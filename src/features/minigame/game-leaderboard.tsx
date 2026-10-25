import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import useSWR from 'swr';

import { AppText, Avatar, Card, ChipRow, SectionTitle } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import type { GameMode, MinigameLeaderboardRow } from '@/lib/types';

type Period = 'daily' | 'weekly';

/** Bảng điểm riêng của từng trò, theo ngày hoặc tuần. */
export function GameLeaderboard({ mode }: { mode: GameMode }) {
  const [period, setPeriod] = useState<Period>('daily');
  const { data } = useSWR<MinigameLeaderboardRow[]>(`/minigame/leaderboard?period=${period}&mode=${mode}`);

  return (
    <Card>
      <SectionTitle title="Bảng điểm" />
      <ChipRow<Period>
        options={[
          { value: 'daily', label: 'Hôm nay' },
          { value: 'weekly', label: 'Tuần này' },
        ]}
        value={period}
        onChange={setPeriod}
      />
      {!data?.length ? (
        <AppText variant="small" color="muted">
          Chưa ai chơi {period === 'daily' ? 'hôm nay' : 'tuần này'} — bạn mở hàng nhé!
        </AppText>
      ) : (
        data.slice(0, 10).map((row) => (
          <View key={row.userId} style={styles.row}>
            <AppText bold color="muted" style={styles.rank}>
              {row.rank}
            </AppText>
            <Avatar user={{ id: row.userId, displayName: row.displayName, avatarUrl: row.avatarUrl }} size={28} />
            <AppText variant="small" bold numberOfLines={1} style={styles.flex}>
              {row.displayName}
            </AppText>
            <AppText variant="small" bold color="primary">
              {row.score} điểm
            </AppText>
          </View>
        ))
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: 4 },
  rank: { width: 20, textAlign: 'center' },
  flex: { flex: 1 },
});
