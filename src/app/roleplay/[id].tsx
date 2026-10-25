import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View, type ScrollViewInstance } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useSWR from 'swr';

import { AppText, Button, Card, ErrorNote, Icon, Loading, Screen, TextLink } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { ChatBubble } from '@/features/roleplay/chat-bubble';
import { SimpleMarkdown } from '@/features/roleplay/simple-markdown';
import { useTheme } from '@/hooks/use-theme';
import { api, errorMessage } from '@/lib/api';
import { useRequireAuth } from '@/lib/auth';
import type { RoleplayMessage } from '@/lib/types';

/** Giới hạn của server cho 1 lượt nói. */
const MAX_LENGTH = 1000;

/**
 * 1 buổi luyện nói: gửi 1 câu → đợi AI đáp (kèm pinyin). "Gợi ý" đưa 1 câu mẫu để tự sửa rồi gửi.
 * "Kết thúc" hiện nhận xét TRƯỚC khi xoá buổi — AI lỗi thì vẫn cho thoát.
 */
export default function RoleplayChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useRequireAuth();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { data: messages, mutate } = useSWR<RoleplayMessage[]>(user ? `/roleplay/sessions/${id}/messages` : null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [hint, setHint] = useState<{ suggestionZh: string; meaningVi: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [ending, setEnding] = useState(false);
  const scroll = useRef<ScrollViewInstance>(null);

  async function send() {
    const message = text.trim();
    if (!message || sending) return;
    setSending(true);
    setError(null);
    setHint(null);
    setText('');
    // Hiện ngay câu vừa gửi trong lúc chờ AI đáp.
    const mine: RoleplayMessage = { id: `local-${Date.now()}`, role: 'USER', text: message, pinyin: null, createdAt: new Date().toISOString() };
    await mutate((list) => [...(list ?? []), mine], { revalidate: false });
    try {
      await api.post(`/roleplay/sessions/${id}/reply`, { message });
      await mutate();
    } catch (err) {
      setError(errorMessage(err, 'AI chưa trả lời được. Thử gửi lại nhé.'));
      setText(message);
      await mutate();
    } finally {
      setSending(false);
    }
  }

  async function askHint() {
    setError(null);
    try {
      setHint(await api.post<{ suggestionZh: string; meaningVi: string }>(`/roleplay/sessions/${id}/hint`));
    } catch (err) {
      setError(errorMessage(err, 'Chưa lấy được gợi ý.'));
    }
  }

  async function end() {
    setEnding(true);
    try {
      const r = await api.post<{ feedbackVi: string }>(`/roleplay/sessions/${id}/feedback`, {});
      setFeedback(r.feedbackVi);
    } catch {
      setFeedback('Chưa lấy được nhận xét lúc này — bạn vẫn có thể đóng buổi luyện.');
    } finally {
      setEnding(false);
    }
  }

  async function close() {
    await api.del(`/roleplay/sessions/${id}`).catch(() => undefined);
    router.back();
  }

  if (feedback !== null) {
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Nhận xét buổi luyện' }} />
        <Card>
          <SimpleMarkdown text={feedback} />
        </Card>
        <Button title="Đóng buổi luyện" onPress={() => void close()} />
        <Button title="Nói tiếp" variant="ghost" onPress={() => setFeedback(null)} />
      </Screen>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.fill, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={insets.top + 44}>
      <Stack.Screen
        options={{
          title: 'Luyện nói',
          headerRight: () => <TextLink title={ending ? 'Đang chấm…' : 'Kết thúc'} onPress={() => void end()} />,
        }}
      />
      <ScrollView
        ref={scroll}
        contentContainerStyle={styles.messages}
        onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}>
        {!messages ? <Loading /> : messages.map((m) => <ChatBubble key={m.id} message={m} />)}
        {sending && (
          <AppText variant="small" color="muted">
            Đang trả lời…
          </AppText>
        )}
      </ScrollView>

      <View style={[styles.composer, { borderColor: theme.border, backgroundColor: theme.surface, paddingBottom: insets.bottom + Spacing.sm }]}>
        {error && <ErrorNote>{error}</ErrorNote>}
        {hint && (
          <Pressable
            onPress={() => {
              setText(hint.suggestionZh);
              setHint(null);
            }}
            style={[styles.hint, { backgroundColor: theme.surface2 }]}>
            <AppText bold>{hint.suggestionZh}</AppText>
            <AppText variant="caption" color="muted">
              {hint.meaningVi} · bấm để dùng câu này
            </AppText>
          </Pressable>
        )}
        <View style={styles.row}>
          <Pressable onPress={() => void askHint()} hitSlop={8} accessibilityLabel="Gợi ý">
            <Icon name="spark" size={22} color="accent" />
          </Pressable>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Nói bằng tiếng Trung…"
            placeholderTextColor={theme.muted}
            maxLength={MAX_LENGTH}
            multiline
            style={[styles.input, { borderColor: theme.border, color: theme.text }]}
          />
          <Pressable
            onPress={() => void send()}
            disabled={!text.trim() || sending}
            accessibilityLabel="Gửi"
            style={[styles.send, { backgroundColor: theme.primary, opacity: !text.trim() || sending ? 0.5 : 1 }]}>
            <Icon name="arrow" size={18} color="primaryText" />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  messages: { padding: Spacing.lg, gap: Spacing.md },
  composer: { borderTopWidth: 1, padding: Spacing.sm, gap: Spacing.sm },
  hint: { borderRadius: Radius.md, padding: Spacing.md, gap: 2 },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm },
  input: { flex: 1, borderWidth: 1, borderRadius: Radius.lg, maxHeight: 120, paddingHorizontal: Spacing.md, paddingVertical: 10, fontSize: 16 },
  send: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
