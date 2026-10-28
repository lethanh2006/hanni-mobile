import { Image } from 'expo-image';
import { router, usePathname } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewInstance,
} from 'react-native';
import Reanimated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { mutate as revalidate } from 'swr';

import { ChatComposer } from '@/components/chat-composer';
import { MarkdownLite } from '@/components/markdown-lite';
import { AppText, Icon } from '@/components/ui';
import { alpha } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  createAssistantSession,
  deleteAssistantSession,
  onAskAssistant,
  streamAssistant,
  useAssistantForced,
  useAssistantMessages,
  useAssistantSessions,
} from '@/lib/assistant';
import { useAuth } from '@/lib/auth';
import { appHref } from '@/lib/notifications';
import { resetScroll, useTucked } from '@/lib/scroll-tuck';
import { timeAgo } from '@/lib/time';
import type { AssistantAction, AssistantMessage } from '@/lib/types';

const LOGO = require('@/assets/images/fox-mark.png');

/** Server nhận tối đa 1.000 ký tự (MaxLength ở ask-assistant.dto.ts). */
const MAX_LENGTH = 1000;

/** Câu hỏi gợi ý khi chưa nói gì — người mới thường không biết hỏi trợ lý cái gì. */
const STARTERS = [
  'Phân biệt 的, 地, 得 giúp mình',
  'Đặt 3 câu đơn giản với từ 学习',
  'Khi nào dùng 了?',
  'Mình nên bắt đầu học HSK mấy?',
];

/** Các màn trong khung tab có thanh dưới đáy — nút nổi đặt trên thanh đó. */
const TAB_PATHS = ['/', '/study', '/thi-thu-hsk', '/luyen-tap', '/tu-dien', '/leaderboard', '/lop-hoc', '/progress', '/account'];

/**
 * Web chỉ gắn trợ lý trong khung app (người đã đăng nhập): không có ở màn đăng nhập, khảo sát, kiểm tra trình độ, phiên
 * học, phòng thi (màn kết quả tự bật bằng `useShowAssistant`) và luyện nói AI (đã là chat với AI).
 */
function showsOn(path: string) {
  if (['/login', '/register', '/forgot-password', '/onboarding', '/kiem-tra-trinh-do', '/premium'].includes(path)) return false;
  if (path.startsWith('/bai-hoc/') || path.startsWith('/roleplay')) return false;
  if (path.startsWith('/thi-thu-hsk/') && !path.startsWith('/thi-thu-hsk/dang-bai/')) return false;
  return true;
}

function HanniLogo({ size }: { size: number }) {
  return <Image source={LOGO} style={{ width: size, height: size, borderRadius: size / 2 }} contentFit="cover" />;
}

/** 3 chấm nhấp nhô lúc trợ lý chưa trả lời chữ nào. */
function TypingDots() {
  const theme = useTheme();
  const [values] = useState(() => [0, 1, 2].map(() => new Animated.Value(0)));
  useEffect(() => {
    const loops = values.map((v, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 120),
          Animated.timing(v, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(v, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay((2 - i) * 120),
        ]),
      ),
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [values]);
  return (
    <View style={styles.dots} accessibilityLabel="Đang trả lời…">
      {values.map((v, i) => (
        <Animated.View
          key={i}
          style={[
            styles.dot,
            { backgroundColor: theme.muted, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -6] }) }] },
          ]}
        />
      ))}
    </View>
  );
}

/** Nút cho hành động trợ lý gợi ý (mở trang) — người dùng tự bấm mới điều hướng, trợ lý không tự chuyển trang thay. */
function ActionButton({ action, onOpen }: { action: AssistantAction; onOpen: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={() => {
        onOpen();
        router.push(appHref(action.path, '/luyen-tap'));
      }}
      style={({ pressed }) => [styles.action, { backgroundColor: alpha(theme.primary, pressed ? 0.2 : 0.1) }]}>
      <Icon name="arrow" size={14} color="primary" />
      <AppText variant="caption" weight="600" color="primary">
        Mở: {action.label}
      </AppText>
    </Pressable>
  );
}

/**
 * Trợ lý AI Hanni (`AssistantWidget` của web ở khổ điện thoại): nút tròn logo cáo ở góc dưới phải (tự lùi xuống khi
 * cuộn xuống đọc), bấm mở khung toàn màn hình — nhiều cuộc trò chuyện (nút "+", lịch sử), câu hỏi gợi ý, trả lời hiện
 * dần từng chữ, nút "Mở: …" khi trợ lý gợi ý một trang.
 */
export function AssistantWidget() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const pathname = usePathname();
  const forced = useAssistantForced();
  const tucked = useTucked();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<'chat' | 'history'>('chat');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const sessions = useAssistantSessions(open);
  // Chưa chọn phiên nào → tự tiếp tục cuộc trò chuyện gần nhất (nếu có), như ChatGPT khi mở lại app.
  const effectiveSessionId = sessionId ?? sessions.data?.[0]?.id ?? null;
  const { data, mutate, isLoading } = useAssistantMessages(open ? effectiveSessionId : null);
  const [input, setInput] = useState('');
  // Tin vừa gửi/nhận hiện ngay bất kể khoá SWR — gửi tin đầu của cuộc trò chuyện MỚI thì id phiên chỉ có SAU khi server
  // trả lời, khoá cache đổi ngay sau đó. Dữ liệu thật đã có tin vừa gửi thì bỏ bản tạm cho khỏi trùng.
  const [pending, setPending] = useState<AssistantMessage[]>([]);
  const live = (p: AssistantMessage[]) => (p.length && data?.some((m) => m.text === p[p.length - 1].text) ? [] : p);
  const messages = [...(data ?? []), ...live(pending)];
  // Nút "Mở: …" khớp theo CHỮ của tin trợ lý (tin tạm bị dọn ngay khi server đồng bộ xong — gắn vào tin tạm là mất nút).
  const [lastAction, setLastAction] = useState<{ text: string; action: AssistantAction } | null>(null);
  const [sending, setSending] = useState(false);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const closeStreamRef = useRef<(() => void) | null>(null);

  // Cuộn: đang ở cuối thì bám theo tin mới; đang đọc lại tin cũ thì hiện "Xuống tin mới" kèm số tin mới.
  const list = useRef<ScrollViewInstance>(null);
  const atBottomRef = useRef(true);
  const [atBottom, setAtBottom] = useState(true);
  const [unseen, setUnseen] = useState(0);
  const last = messages.at(-1);
  const lastKey = open && view === 'chat' ? (last?.id ?? 'empty') : null;
  const seenKey = useRef<string | null>(null);

  function scrollToBottom(animated: boolean) {
    list.current?.scrollToEnd({ animated });
    atBottomRef.current = true;
    setAtBottom(true);
    setUnseen(0);
  }

  useEffect(() => {
    if (lastKey === null) {
      seenKey.current = null;
      return;
    }
    if (lastKey === seenKey.current) return;
    const first = seenKey.current === null;
    seenKey.current = lastKey;
    if (first || last?.role === 'USER' || atBottomRef.current) requestAnimationFrame(() => scrollToBottom(!first));
    else setUnseen((n) => n + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ phản ứng khi có tin mới ở cuối
  }, [lastKey]);

  // Đóng luồng dở dang nếu gỡ khỏi màn (vd đăng xuất).
  useEffect(() => () => closeStreamRef.current?.(), []);
  useEffect(() => resetScroll(), [pathname]);

  // Nút quay lại của Android đóng khung trợ lý trước.
  useEffect(() => {
    if (!open) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setOpen(false);
      return true;
    });
    return () => sub.remove();
  }, [open]);

  /** `preset`: câu soạn sẵn — từ nơi khác (`askAssistant`, vào phiên vừa tạo) hoặc câu gợi ý (`starter`). */
  function send(preset?: { text: string; sessionId?: string; starter?: boolean }) {
    const text = (preset?.text ?? input).trim();
    if (!text || (sending && (!preset || preset.starter))) return;
    if (!preset) setInput('');
    const requestSessionId = preset?.sessionId ?? effectiveSessionId ?? undefined;
    setSending(true);
    const modelMsgId = `tmp-m-${Date.now()}`;
    setStreamingId(modelMsgId);
    setPending((p) => [
      ...live(p),
      { id: `tmp-u-${Date.now()}`, role: 'USER', text, createdAt: new Date().toISOString() },
      { id: modelMsgId, role: 'MODEL', text: '', createdAt: new Date().toISOString() },
    ]);

    // Chữ nhận qua luồng tới không đều (theo cụm token) — dồn vào hàng chờ rồi nhả đều mỗi 20ms cho mượt; hàng chờ
    // càng dài thì nhả càng nhanh để không tụt lại quá xa.
    let accumulated = '';
    let backlog = '';
    let onNetworkDone: (() => void) | null = null;
    const revealTimer = setInterval(() => {
      if (backlog) {
        const step = Math.max(1, Math.round(backlog.length / 10));
        accumulated += backlog.slice(0, step);
        backlog = backlog.slice(step);
        setPending((p) => p.map((m) => (m.id === modelMsgId ? { ...m, text: accumulated } : m)));
        if (atBottomRef.current) list.current?.scrollToEnd({ animated: false });
      } else if (onNetworkDone) {
        clearInterval(revealTimer);
        const finalize = onNetworkDone;
        onNetworkDone = null;
        finalize();
      }
    }, 20);

    const closeStream = streamAssistant(text, requestSessionId, {
      onDelta: (delta) => {
        backlog += delta;
      },
      onDone: (newSessionId, action) => {
        onNetworkDone = () => {
          if (action) setLastAction({ text: accumulated, action });
          if (newSessionId && requestSessionId !== newSessionId) setSessionId(newSessionId);
          else if (preset?.sessionId) void revalidate(`/assistant/sessions/${preset.sessionId}/messages`);
          else void mutate();
          void revalidate('/assistant/sessions');
          setStreamingId(null);
          setSending(false);
        };
        if (!backlog) {
          clearInterval(revealTimer);
          onNetworkDone();
          onNetworkDone = null;
        }
      },
      onError: () => {
        clearInterval(revealTimer);
        setPending((p) =>
          p.map((m) => (m.id === modelMsgId && !accumulated && !backlog ? { ...m, text: 'Có lỗi mạng, thử lại nhé.' } : m)),
        );
        setStreamingId(null);
        setSending(false);
      },
    });
    closeStreamRef.current = () => {
      clearInterval(revealTimer);
      closeStream();
    };
  }

  // Câu hỏi soạn sẵn từ nơi khác: mở khung, tạo phiên mới rồi gửi luôn.
  const sendRef = useRef(send);
  useEffect(() => {
    sendRef.current = send;
  });
  useEffect(
    () =>
      onAskAssistant(async (text) => {
        setOpen(true);
        setView('chat');
        closeStreamRef.current?.();
        const created = await createAssistantSession();
        setSessionId(created.id);
        setPending([]);
        setLastAction(null);
        void revalidate('/assistant/sessions');
        sendRef.current({ text, sessionId: created.id });
      }),
    [],
  );

  async function startNewChat() {
    closeStreamRef.current?.();
    const created = await createAssistantSession();
    setSessionId(created.id);
    setPending([]);
    setLastAction(null);
    setStreamingId(null);
    setSending(false);
    setView('chat');
    void sessions.mutate((current) => [created, ...(current ?? [])], { revalidate: false });
  }

  function removeSession(id: string) {
    Alert.alert('Xoá cuộc trò chuyện này?', undefined, [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Xoá',
        style: 'destructive',
        onPress: async () => {
          await deleteAssistantSession(id).catch(() => undefined);
          void sessions.mutate((current) => (current ?? []).filter((s) => s.id !== id), { revalidate: false });
          if (id === effectiveSessionId) {
            setSessionId(null);
            setPending([]);
            setLastAction(null);
          }
        },
      },
    ]);
  }

  if (!user) return null;
  const onTabs = TAB_PATHS.includes(pathname);
  const showButton = !open && (forced || showsOn(pathname));

  return (
    <>
      {showButton && (
        <Reanimated.View
          pointerEvents={tucked ? 'none' : 'auto'}
          style={[
            styles.fabWrap,
            {
              bottom: (onTabs ? 64 : 0) + insets.bottom + 16,
              opacity: tucked ? 0 : 1,
              transform: [{ translateY: tucked ? 96 : 0 }],
              transitionProperty: ['opacity', 'transform'],
              transitionDuration: 300,
            },
          ]}>
          <Pressable
            onPress={() => setOpen(true)}
            accessibilityLabel="Mở trợ lý Hanni"
            style={({ pressed }) => [
              styles.fab,
              { backgroundColor: theme.primary, boxShadow: `0 10px 15px -3px rgba(0,0,0,0.15), 0 4px 6px -4px rgba(0,0,0,0.15)` },
              pressed && { transform: [{ translateY: 1 }] },
            ]}>
            <HanniLogo size={48} />
          </Pressable>
        </Reanimated.View>
      )}

      {open && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[styles.panel, { backgroundColor: theme.surface, paddingTop: insets.top }]}
          accessibilityLabel="Trợ lý Hanni">
          <View style={[styles.header, { borderColor: theme.border }]}>
            <View style={styles.brand}>
              <HanniLogo size={32} />
              <View style={styles.flex}>
                <AppText weight="700">Trợ lý Hanni</AppText>
                <AppText variant="caption" color="muted">
                  Hỏi về tiếng Trung, ngữ pháp, lộ trình học
                </AppText>
              </View>
            </View>
            <View style={styles.tools}>
              <Pressable
                onPress={() => void startNewChat()}
                accessibilityLabel="Cuộc trò chuyện mới"
                style={({ pressed }) => [styles.tool, pressed && { backgroundColor: theme.surface2 }]}>
                <Icon name="plus" size={16} color="muted" />
              </Pressable>
              <Pressable
                onPress={() => setView(view === 'history' ? 'chat' : 'history')}
                accessibilityLabel="Lịch sử trò chuyện"
                accessibilityState={{ selected: view === 'history' }}
                style={({ pressed }) => [styles.tool, pressed && { backgroundColor: theme.surface2 }]}>
                <Icon name="clock" size={16} color={view === 'history' ? 'primary' : 'muted'} />
              </Pressable>
              <Pressable
                onPress={() => setOpen(false)}
                accessibilityLabel="Đóng trợ lý"
                style={({ pressed }) => [styles.tool, pressed && { backgroundColor: theme.surface2 }]}>
                <Icon name="close" size={16} color="muted" />
              </Pressable>
            </View>
          </View>

          {view === 'history' ? (
            <ScrollView style={styles.flex} contentContainerStyle={[styles.history, { paddingBottom: insets.bottom + 8 }]}>
              {!sessions.data || sessions.data.length === 0 ? (
                <AppText variant="caption" color="muted" center style={styles.noHistory}>
                  Chưa có cuộc trò chuyện nào.
                </AppText>
              ) : (
                sessions.data.map((s) => (
                  <View
                    key={s.id}
                    style={[styles.historyRow, s.id === effectiveSessionId && { backgroundColor: theme.surface2 }]}>
                    <Pressable
                      onPress={() => {
                        setSessionId(s.id);
                        setPending([]);
                        setLastAction(null);
                        setView('chat');
                      }}
                      style={styles.flex}>
                      <AppText numberOfLines={1}>
                        {s.title ?? 'Cuộc trò chuyện mới'}
                        <AppText variant="caption" color="muted">
                          {'  '}
                          {timeAgo(s.updatedAt)}
                        </AppText>
                      </AppText>
                    </Pressable>
                    <Pressable
                      onPress={() => removeSession(s.id)}
                      accessibilityLabel="Xoá cuộc trò chuyện"
                      hitSlop={6}
                      style={styles.trash}>
                      <Icon name="trash" size={14} color="muted" />
                    </Pressable>
                  </View>
                ))
              )}
            </ScrollView>
          ) : (
            <>
              <View style={styles.flex}>
                <ScrollView
                  ref={list}
                  style={styles.flex}
                  contentContainerStyle={styles.messages}
                  keyboardShouldPersistTaps="handled"
                  scrollEventThrottle={32}
                  onScroll={(e) => {
                    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
                    const near = contentSize.height - contentOffset.y - layoutMeasurement.height < 80;
                    atBottomRef.current = near;
                    setAtBottom(near);
                    if (near) setUnseen(0);
                  }}>
                  {isLoading && messages.length === 0 ? (
                    <AppText variant="caption" color="muted" center>
                      Đang tải…
                    </AppText>
                  ) : messages.length === 0 ? (
                    <View style={styles.msgRow}>
                      <HanniLogo size={28} />
                      <View style={styles.welcome}>
                        <View style={[styles.bubble, styles.welcomeBubble, { backgroundColor: theme.surface2 }]}>
                          <AppText style={styles.bubbleText}>
                            Chào {user.displayName ?? 'bạn'}! Mình là Hanni 👋 Mình có thể giúp gì cho bạn hôm nay — hỏi về từ
                            vựng, ngữ pháp, phát âm, hay lộ trình học đều được nhé.
                          </AppText>
                        </View>
                        <View style={styles.starters}>
                          {STARTERS.map((q) => (
                            <Pressable
                              key={q}
                              onPress={() => send({ text: q, sessionId: effectiveSessionId ?? undefined, starter: true })}
                              disabled={sending}
                              style={[
                                styles.starter,
                                { borderColor: alpha(theme.primary, 0.25), backgroundColor: alpha(theme.primary, 0.05) },
                                sending && styles.faded,
                              ]}>
                              <AppText variant="caption" weight="500" color="primary">
                                {q}
                              </AppText>
                            </Pressable>
                          ))}
                        </View>
                      </View>
                    </View>
                  ) : (
                    messages.map((m) => {
                      const mine = m.role === 'USER';
                      return (
                        <View key={m.id} style={[styles.msgRow, mine && styles.mine]}>
                          {!mine && <HanniLogo size={28} />}
                          <View style={[styles.bubble, { backgroundColor: mine ? theme.primary : theme.surface2 }]}>
                            {mine ? (
                              <AppText color="primaryText" style={styles.bubbleText}>
                                {m.text}
                              </AppText>
                            ) : m.id === streamingId && !m.text ? (
                              <TypingDots />
                            ) : (
                              <MarkdownLite text={m.text} />
                            )}
                            {!mine && lastAction && m.text === lastAction.text && (
                              <ActionButton action={lastAction.action} onOpen={() => setOpen(false)} />
                            )}
                          </View>
                        </View>
                      );
                    })
                  )}
                </ScrollView>
                {!atBottom && (
                  <Pressable
                    onPress={() => scrollToBottom(true)}
                    style={[
                      styles.jump,
                      { borderColor: theme.border, backgroundColor: theme.surface, boxShadow: `0 10px 15px -3px ${alpha('#000000', 0.12)}` },
                    ]}>
                    <View style={styles.down}>
                      <Icon name="arrow" size={14} color="primary" />
                    </View>
                    <AppText variant="caption" weight="600">
                      Xuống tin mới
                    </AppText>
                    {unseen > 0 && (
                      <View style={[styles.unseen, { backgroundColor: theme.primary }]}>
                        <AppText variant="caption" weight="700" color="primaryText">
                          {unseen > 99 ? '99+' : unseen}
                        </AppText>
                      </View>
                    )}
                  </Pressable>
                )}
              </View>
              <ChatComposer
                value={input}
                onChange={setInput}
                onSubmit={() => send()}
                maxLength={MAX_LENGTH}
                placeholder="Nhập câu hỏi…"
                busy={sending}
                bottomInset={insets.bottom}
              />
            </>
          )}
        </KeyboardAvoidingView>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  faded: { opacity: 0.5 },
  fabWrap: { position: 'absolute', right: 16, zIndex: 40 },
  fab: { width: 48, height: 48, borderRadius: 24, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  panel: { ...StyleSheet.absoluteFill, zIndex: 40 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  brand: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 8 },
  tools: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tool: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  history: { paddingHorizontal: 8, paddingVertical: 8 },
  noHistory: { paddingHorizontal: 8, paddingVertical: 24 },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 10 },
  trash: { padding: 6, borderRadius: 6 },
  messages: { paddingHorizontal: 16, paddingVertical: 16, gap: 12 },
  msgRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  mine: { flexDirection: 'row-reverse' },
  welcome: { flex: 1, minWidth: 0, gap: 10 },
  bubble: { maxWidth: '78%', gap: 8, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  welcomeBubble: { maxWidth: '100%' },
  bubbleText: { fontSize: 14, lineHeight: 24 },
  starters: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  starter: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  dots: { flexDirection: 'row', gap: 4, paddingVertical: 4 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  action: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  jump: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  down: { transform: [{ rotate: '90deg' }] },
  unseen: { minWidth: 20, borderRadius: 999, paddingHorizontal: 6, paddingVertical: 2, alignItems: 'center' },
});
