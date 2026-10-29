import Storage from 'expo-sqlite/kv-store';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewInstance,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useSWR from 'swr';

import { ChatComposer } from '@/components/chat-composer';
import { AppText, Button, ErrorNote, Icon, IconTile, Loading } from '@/components/ui';
import { alpha } from '@/constants/theme';
import { ChatBubble } from '@/features/roleplay/chat-bubble';
import { SimpleMarkdown } from '@/features/roleplay/simple-markdown';
import { useTheme } from '@/hooks/use-theme';
import { api, errorMessage } from '@/lib/api';
import { speakChinese, stopAudio } from '@/lib/audio';
import { useRequireAuth } from '@/lib/auth';
import type { RoleplayMessage } from '@/lib/types';

/** Giới hạn của server cho 1 lượt nói. */
const MAX_LENGTH = 1000;
const SPEAK_KEY = 'hanni:roleplay-speak';

function readSpeak() {
  try {
    return Storage.getItemSync(SPEAK_KEY) !== '0';
  } catch {
    return true;
  }
}

/**
 * 1 buổi luyện nói (`ChatView` của web): thanh trên (về tình huống, bật/tắt đọc to, Kết thúc), bong bóng hội thoại,
 * gợi ý câu tiếp theo, ô soạn có nút gợi ý + gửi. "Kết thúc" hiện nhận xét TRƯỚC khi xoá buổi — AI lỗi vẫn cho thoát.
 */
export default function RoleplayChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useRequireAuth();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { data: messages, mutate } = useSWR<RoleplayMessage[]>(user ? `/roleplay/sessions/${id}/messages` : null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [hinting, setHinting] = useState(false);
  const [hint, setHint] = useState<{ suggestionZh: string; meaningVi: string } | null>(null);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [ending, setEnding] = useState(false);
  // Mặc định đọc to câu trả lời — luyện nói mà chỉ đọc chữ thì mất nửa bài tập nghe.
  const [speakOn, setSpeakOn] = useState(readSpeak);
  const scroll = useRef<ScrollViewInstance>(null);

  useEffect(() => () => stopAudio(), []);

  function toggleSpeak() {
    const next = !speakOn;
    setSpeakOn(next);
    if (!next) stopAudio();
    try {
      Storage.setItemSync(SPEAK_KEY, next ? '1' : '0');
    } catch {
      // chỉ là tuỳ chọn hiển thị
    }
  }

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setError('');
    setHint(null);
    setInput('');
    // Hiện ngay câu vừa gửi trong lúc chờ AI đáp.
    const mine: RoleplayMessage = { id: `local-${Date.now()}`, role: 'USER', text, pinyin: null, createdAt: new Date().toISOString() };
    await mutate((list) => [...(list ?? []), mine], { revalidate: false });
    try {
      const reply = await api.post<RoleplayMessage>(`/roleplay/sessions/${id}/reply`, { message: text });
      await mutate((list) => [...(list ?? []), reply], { revalidate: false });
      if (speakOn) speakChinese(reply.text);
    } catch (err) {
      setInput(text);
      await mutate();
      setError(errorMessage(err, 'Chưa gửi được, thử lại nhé.'));
    } finally {
      setSending(false);
    }
  }

  async function getHint() {
    if (hinting) return;
    setHinting(true);
    setError('');
    try {
      setHint(await api.post<{ suggestionZh: string; meaningVi: string }>(`/roleplay/sessions/${id}/hint`));
    } catch (err) {
      setError(errorMessage(err, 'Chưa gợi ý được, thử lại nhé.'));
    } finally {
      setHinting(false);
    }
  }

  /** Kết thúc = XIN NHẬN XÉT trước, chưa xoá gì. */
  async function endSession() {
    if (ending) return;
    setEnding(true);
    setError('');
    try {
      const r = await api.post<{ feedbackVi: string }>(`/roleplay/sessions/${id}/feedback`, {});
      setFeedback(r.feedbackVi);
    } catch (err) {
      // Không chặn đường thoát chỉ vì AI bận: bỏ qua nhận xét.
      setError(errorMessage(err, 'Chưa lấy được nhận xét, nhưng bạn vẫn kết thúc được buổi luyện.'));
      setFeedback('');
    } finally {
      setEnding(false);
    }
  }

  /** Đóng hẳn: xoá hội thoại rồi về màn chọn tình huống. */
  async function closeSession() {
    await api.del(`/roleplay/sessions/${id}`).catch(() => undefined);
    router.back();
  }

  return (
    <KeyboardAvoidingView
      style={[styles.fill, { backgroundColor: theme.surface }]}
      behavior="padding">
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.bar, { paddingTop: insets.top + 12, borderColor: theme.border }]}>
        <Pressable onPress={() => router.back()} style={styles.back} hitSlop={6}>
          <Icon name="back" size={16} color="muted" />
          <AppText weight="500" color="muted">
            Tình huống
          </AppText>
        </Pressable>
        {feedback === null && (
          <View style={styles.actions}>
            <Pressable
              onPress={toggleSpeak}
              accessibilityState={{ selected: speakOn }}
              accessibilityLabel={speakOn ? 'Đọc to: bật' : 'Đọc to: tắt'}
              style={[styles.speak, speakOn && { backgroundColor: alpha(theme.primary, 0.1) }]}>
              <Icon name="sound" size={15} color={speakOn ? 'primary' : 'muted'} />
            </Pressable>
            <Button
              title={ending ? 'Đang tổng kết…' : 'Kết thúc'}
              leftIcon="check"
              variant="ghost"
              disabled={ending}
              onPress={() => void endSession()}
              style={styles.end}
            />
          </View>
        )}
      </View>

      {feedback !== null ? (
        <ScrollView contentContainerStyle={[styles.feedback, { paddingBottom: insets.bottom + 24 }]}>
          <IconTile size={56} style={styles.center}>
            <Icon name="check" size={26} color="good" />
          </IconTile>
          <AppText weight="700" center style={styles.feedbackTitle}>
            Xong buổi luyện!
          </AppText>
          {feedback ? (
            <View style={[styles.feedbackBox, { borderColor: theme.border, backgroundColor: theme.surface2 }]}>
              <SimpleMarkdown text={feedback} />
            </View>
          ) : (
            <AppText color="muted" center>
              Lần này chưa lấy được nhận xét từ trợ lý. Bạn vẫn giữ nguyên phần luyện tập vừa rồi nhé.
            </AppText>
          )}
          {error ? <ErrorNote>{error}</ErrorNote> : null}
          <View style={styles.feedbackActions}>
            <Button title="Đóng buổi luyện" icon="arrow" onPress={() => void closeSession()} />
            {/* Chưa xoá gì cho tới khi bấm "Đóng" — đọc nhận xét xong vẫn quay lại nói tiếp được. */}
            <Button title="Nói tiếp" variant="secondary" onPress={() => setFeedback(null)} />
          </View>
        </ScrollView>
      ) : (
        <>
          <ScrollView
            ref={scroll}
            style={[styles.fill, { backgroundColor: theme.surface }]}
            contentContainerStyle={styles.messages}
            onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}
            // Bàn phím mở làm khung thấp lại → giữ tin mới nhất trong tầm nhìn.
            onLayout={() => scroll.current?.scrollToEnd({ animated: true })}>
            {!messages ? <Loading /> : messages.map((m) => <ChatBubble key={m.id} message={m} />)}
          </ScrollView>

          {hint && (
            <View style={[styles.hint, { borderColor: alpha(theme.accent, 0.2), backgroundColor: alpha(theme.accent, 0.05) }]}>
              <Icon name="spark" size={16} color="accent" />
              <View style={styles.flex}>
                <AppText weight="500">{hint.suggestionZh}</AppText>
                {hint.meaningVi ? (
                  <AppText variant="caption" color="muted" style={styles.hintVi}>
                    {hint.meaningVi}
                  </AppText>
                ) : null}
              </View>
              <AppText
                variant="caption"
                weight="600"
                color="accent"
                onPress={() => {
                  setInput(hint.suggestionZh);
                  setHint(null);
                }}>
                Dùng câu này
              </AppText>
              <Pressable onPress={() => setHint(null)} accessibilityLabel="Đóng gợi ý" hitSlop={6}>
                <Icon name="close" size={14} color="muted" />
              </Pressable>
            </View>
          )}

          {error ? (
            <View style={styles.errorWrap}>
              <ErrorNote>{error}</ErrorNote>
            </View>
          ) : null}

          <ChatComposer
            value={input}
            onChange={setInput}
            onSubmit={() => void send()}
            maxLength={MAX_LENGTH}
            placeholder="Nhập tiếng Trung…"
            busy={sending}
            bottomInset={insets.bottom}
            before={
              <Pressable
                onPress={() => void getHint()}
                disabled={hinting || sending}
                accessibilityLabel="Gợi ý câu trả lời"
                style={[styles.square, { backgroundColor: theme.surface2 }, (hinting || sending) && styles.faded]}>
                <Icon name="spark" size={18} color="accent" />
              </Pressable>
            }
          />
        </>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  flex: { flex: 1, minWidth: 0 },
  center: { alignSelf: 'center' },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  speak: { height: 36, borderRadius: 12, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center' },
  end: { minHeight: 36, paddingHorizontal: 12, paddingVertical: 6 },
  messages: { padding: 16, gap: 16 },
  hint: {
    marginHorizontal: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  hintVi: { marginTop: 2 },
  errorWrap: { paddingHorizontal: 16, paddingBottom: 8 },
  square: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  faded: { opacity: 0.45 },
  feedback: { padding: 20, gap: 16 },
  feedbackTitle: { fontSize: 18, lineHeight: 26 },
  feedbackBox: { borderWidth: 1, borderRadius: 16, padding: 16 },
  feedbackActions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 },
});
