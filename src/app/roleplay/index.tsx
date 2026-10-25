import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import useSWR from 'swr';

import { AppText, Card, ErrorNote, Icon, Loading, Screen, SectionTitle } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { api, errorMessage } from '@/lib/api';
import { useRequireAuth } from '@/lib/auth';
import { hskLabel } from '@/lib/hsk';
import { timeAgo } from '@/lib/time';
import type { RoleplayMessage, RoleplayScenario, RoleplaySessionSummary } from '@/lib/types';

/** Luyện nói với AI: chọn 1 tình huống đời thường (AI giữ vai suốt buổi), hoặc nói tiếp buổi đang dở. */
export default function RoleplayListScreen() {
  const { user } = useRequireAuth();
  const scenarios = useSWR<RoleplayScenario[]>(user ? '/roleplay/scenarios' : null);
  const sessions = useSWR<RoleplaySessionSummary[]>(user ? '/roleplay/sessions' : null);
  const [starting, setStarting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function start(key: string) {
    setStarting(key);
    setError(null);
    try {
      const r = await api.post<{ sessionId: string; message: RoleplayMessage }>('/roleplay/sessions', { scenarioKey: key });
      void sessions.mutate();
      router.push(`/roleplay/${r.sessionId}`);
    } catch (err) {
      setError(errorMessage(err, 'Chưa bắt đầu được buổi luyện. Thử lại nhé.'));
    } finally {
      setStarting(null);
    }
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Luyện nói với AI' }} />
      <AppText color="muted">
        Chọn một tình huống — AI đóng vai bằng tiếng Trung, câu nào cũng có pinyin. Bí thì bấm “Gợi ý”.
      </AppText>
      {error && <ErrorNote>{error}</ErrorNote>}

      {!!sessions.data?.length && (
        <>
          <SectionTitle title="Nói tiếp" />
          {sessions.data.map((s) => (
            <Card key={s.id} onPress={() => router.push(`/roleplay/${s.id}`)}>
              <AppText bold>{s.titleVi}</AppText>
              <AppText variant="small" color="muted" numberOfLines={1}>
                {s.lastMessage ?? s.persona} · {timeAgo(s.updatedAt)}
              </AppText>
            </Card>
          ))}
        </>
      )}

      <SectionTitle title="Tình huống" />
      {!scenarios.data ? (
        <Loading />
      ) : (
        scenarios.data.map((s) => (
          <Card key={s.key} onPress={() => void start(s.key)}>
            <View style={styles.row}>
              <Icon name="message" size={22} color="primary" />
              <View style={styles.flex}>
                <AppText bold>{s.titleVi}</AppText>
                <AppText variant="caption" color="muted">
                  {hskLabel(s.hskLevel)} · {s.persona}
                </AppText>
              </View>
              {starting === s.key ? <ActivityIndicator /> : <Icon name="chevron" size={16} color="muted" />}
            </View>
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  flex: { flex: 1, gap: 2 },
});
