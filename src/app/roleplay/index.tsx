import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import useSWR from 'swr';

import {
  AppText,
  Button,
  Card,
  ErrorNote,
  Icon,
  Loading,
  NextStep,
  PageHeader,
  Screen,
  TourButton,
  type TourStep,
} from '@/components/ui';
import { alpha } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api, errorMessage } from '@/lib/api';
import { useRequireAuth } from '@/lib/auth';
import type { RoleplayMessage, RoleplayScenario, RoleplaySessionSummary } from '@/lib/types';

const TOUR: TourStep[] = [
  {
    icon: 'message',
    title: 'AI đóng vai, không dạy ngữ pháp',
    description:
      'Chọn một tình huống, AI sẽ giữ đúng vai đó và chỉ nói tiếng Trung — giống nói chuyện thật. Mỗi câu của AI đều có pinyin ngay bên dưới.',
  },
  {
    icon: 'sound',
    title: 'Nghe bằng tai',
    description: 'AI đọc to câu trả lời bằng giọng tiếng Trung — tắt/bật bằng nút loa ở đầu khung hội thoại.',
  },
  {
    icon: 'spark',
    title: 'Bí thì bấm "Gợi ý"',
    description:
      'Nút gợi ý cạnh ô nhập đưa ra một câu bạn có thể nói tiếp kèm nghĩa tiếng Việt. Bấm "Dùng câu này" để điền vào ô nhập rồi tự sửa trước khi gửi.',
  },
];

/** Luyện nói với AI (`/roleplay` của web): chọn 1 tình huống đời thường (AI giữ vai suốt buổi), hoặc nói tiếp buổi đang dở. */
export default function RoleplayListScreen() {
  const theme = useTheme();
  const { user } = useRequireAuth();
  const scenarios = useSWR<RoleplayScenario[]>(user ? '/roleplay/scenarios' : null);
  const sessions = useSWR<RoleplaySessionSummary[]>(user ? '/roleplay/sessions' : null);
  const [starting, setStarting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function start(key: string) {
    if (starting) return;
    setStarting(key);
    setError(null);
    try {
      const r = await api.post<{ sessionId: string; message: RoleplayMessage }>('/roleplay/sessions', { scenarioKey: key });
      void sessions.mutate();
      router.push(`/roleplay/${r.sessionId}`);
    } catch (err) {
      setError(errorMessage(err, 'Chưa bắt đầu được, thử lại nhé.'));
    } finally {
      setStarting(null);
    }
  }

  return (
    <Screen contentStyle={styles.page}>
      <Stack.Screen options={{ title: 'Luyện nói với AI' }} />
      <PageHeader
        icon="message"
        tone="accent"
        title="Luyện nói với AI"
        description="Chọn một tình huống, nói chuyện với AI bằng tiếng Trung — gõ hoặc nói."
        right={<TourButton steps={TOUR} />}
      />

      {!scenarios.data ? (
        <Loading />
      ) : (
        <View style={styles.list}>
          {scenarios.data.map((s) => (
            <Card key={s.key} style={styles.scenario}>
              <View style={styles.scenarioHead}>
                <View style={[styles.tile, { borderColor: theme.border, backgroundColor: alpha(theme.accent, 0.1) }]}>
                  <Icon name="message" size={18} color="accent" />
                </View>
                <View style={[styles.level, { backgroundColor: theme.surface2 }]}>
                  <AppText variant="caption" weight="700" color="muted">
                    HSK{s.hskLevel}+
                  </AppText>
                </View>
              </View>
              <View>
                <AppText weight="600" style={styles.title}>
                  {s.titleVi}
                </AppText>
                <AppText variant="caption" color="muted" style={styles.persona}>
                  AI đóng vai: {s.persona}
                </AppText>
              </View>
              <Button
                title={starting === s.key ? 'Đang bắt đầu…' : 'Bắt đầu luyện'}
                variant="secondary"
                disabled={starting !== null}
                onPress={() => void start(s.key)}
              />
            </Card>
          ))}
        </View>
      )}
      {error && <ErrorNote>{error}</ErrorNote>}

      {!!sessions.data?.length && (
        <View>
          <AppText weight="600" color="muted" style={styles.recentTitle}>
            Cuộc hội thoại gần đây
          </AppText>
          <View style={styles.recent}>
            {sessions.data.map((s) => (
              <Pressable
                key={s.id}
                onPress={() => router.push(`/roleplay/${s.id}`)}
                style={({ pressed }) => [
                  styles.session,
                  { borderColor: pressed ? alpha(theme.primary, 0.4) : theme.border },
                ]}>
                <View style={[styles.tile, { borderColor: theme.border, backgroundColor: theme.surface2 }]}>
                  <Icon name="message" size={16} color="muted" />
                </View>
                <View style={styles.flex}>
                  <AppText weight="600">{s.titleVi}</AppText>
                  <AppText variant="caption" color="muted" numberOfLines={1}>
                    {s.lastMessage ?? 'Chưa có tin nhắn'}
                  </AppText>
                </View>
                <Icon name="arrow" size={16} color="muted" />
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* Luyện nói xong không bị cụt đường — củng cố vốn từ. Web có thêm "Luyện phát âm" (app chưa có). */}
      <NextStep
        title="Luyện nói xong, củng cố thêm nhé"
        description="Phản xạ hội thoại tốt nhất khi phát âm chuẩn và vốn từ đủ dùng."
        actions={[{ href: '/study', label: 'Ôn tập flashcard', icon: 'cards' }]}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { gap: 24 },
  flex: { flex: 1, minWidth: 0 },
  list: { gap: 16 },
  scenario: { gap: 12 },
  scenarioHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tile: { width: 44, height: 44, borderWidth: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  level: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  title: { fontSize: 16, lineHeight: 24 },
  persona: { marginTop: 4 },
  recentTitle: { marginBottom: 12 },
  recent: { gap: 8 },
  session: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 16, padding: 12 },
});
