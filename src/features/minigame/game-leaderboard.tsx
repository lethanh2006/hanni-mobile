import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import useSWR from 'swr';

import { AppText, Card, SectionHeading } from '@/components/ui';
import { alpha } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { GameMode, MinigameLeaderboardRow } from '@/lib/types';

type Period = 'daily' | 'weekly';

/** Khoá SWR bảng điểm của 1 trò — màn chơi làm mới sau khi nộp. */
export const leaderboardKey = (period: Period, mode: GameMode) => `/minigame/leaderboard?period=${period}&mode=${mode}`;

/** "Bảng xếp hạng luyện tập" của từng trò (web): Hôm nay / Tuần này, mỗi dòng hạng + tên + điểm. */
export function GameLeaderboard({ mode }: { mode: GameMode }) {
  const theme = useTheme();
  const [period, setPeriod] = useState<Period>('daily');
  const { data } = useSWR<MinigameLeaderboardRow[]>(leaderboardKey(period, mode));
  const match = mode === 'MATCH';

  return (
    <View style={styles.section}>
      <SectionHeading
        icon="trophy"
        tone={match ? 'good' : 'accent'}
        title="Bảng xếp hạng luyện tập"
        right={
          <View style={styles.periods}>
            {(['daily', 'weekly'] as const).map((p) => (
              <Pressable
                key={p}
                onPress={() => setPeriod(p)}
                accessibilityState={{ selected: period === p }}
                style={[styles.period, period === p && { backgroundColor: alpha(theme.primary, 0.1) }]}>
                <AppText variant="caption" weight="600" color={period === p ? 'primary' : 'muted'}>
                  {p === 'daily' ? 'Hôm nay' : 'Tuần này'}
                </AppText>
              </Pressable>
            ))}
          </View>
        }
      />
      <Card style={styles.card}>
        {data?.length ? (
          data.map((row, i) => (
            <View key={row.userId} style={[styles.row, i > 0 && { borderTopWidth: 1, borderColor: theme.border }]}>
              <View style={styles.who}>
                <AppText variant="caption" weight="600" color="muted" style={styles.rank}>
                  {row.rank}
                </AppText>
                <AppText numberOfLines={1} style={styles.flex}>
                  {row.displayName}
                </AppText>
              </View>
              <AppText weight="600" color="primary">
                {match ? `${row.score} điểm · ${Math.floor(row.durationMs / 1000)}s` : `${row.score}/${row.totalAsked} câu`}
              </AppText>
            </View>
          ))
        ) : (
          <AppText color="muted" center style={styles.empty}>
            Chưa có ai chơi trong khoảng này — chơi ngay để dẫn đầu!
          </AppText>
        )}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 32, gap: 16 },
  periods: { flexDirection: 'row', gap: 8 },
  period: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  card: { gap: 0, padding: 0 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingHorizontal: 20, paddingVertical: 14 },
  who: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 12 },
  rank: { width: 20, textAlign: 'center' },
  flex: { flex: 1, minWidth: 0 },
  empty: { paddingHorizontal: 20, paddingVertical: 32 },
});
