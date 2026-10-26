import { router, Stack } from 'expo-router';
import { useState } from 'react';

import { AppText, Button, ChipRow, EmptyState, ErrorNote, Loading, Screen } from '@/components/ui';
import { MyRank, Rankings } from '@/features/leaderboard/rankings';
import { WeeklyLeague } from '@/features/leaderboard/weekly-league';
import { useAuth } from '@/lib/auth';
import { useLeaderboard } from '@/lib/hooks';
import type { LeaderboardMetricKey } from '@/lib/types';

/**
 * 2 tiêu chí: "Chuỗi hiện tại" (mặc định) + "Bài đã xong". "Từ đã thuộc" cần ~21 ngày
 * mới có nên trống với mọi người; "Chuỗi dài nhất" trùng ý — web cũng đã bỏ.
 */
const METRICS: { value: LeaderboardMetricKey; label: string; description: string }[] = [
  { value: 'streak', label: 'Chuỗi hiện tại', description: 'Xếp hạng theo chuỗi ngày học liên tiếp hiện tại.' },
  { value: 'lessons', label: 'Bài đã xong', description: 'Xếp hạng theo số bài học đã hoàn thành.' },
];

/** Giải đấu tuần với người cùng bậc + bảng xếp hạng chung. Khách xem được bảng chung. */
export default function LeaderboardScreen() {
  const { user } = useAuth();
  const [metric, setMetric] = useState<LeaderboardMetricKey>('streak');
  const board = useLeaderboard(metric);
  const details = METRICS.find((m) => m.value === metric) ?? METRICS[0];

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Bảng xếp hạng' }} />
      {user && <WeeklyLeague />}
      <ChipRow options={METRICS} value={metric} onChange={setMetric} />
      <AppText variant="small" color="muted">
        {details.description}
      </AppText>

      {board.error && !board.data ? (
        <>
          <ErrorNote>Chưa tải được bảng xếp hạng.</ErrorNote>
          <Button title="Thử lại" variant="secondary" onPress={() => void board.mutate()} />
        </>
      ) : !board.data ? (
        <Loading />
      ) : board.data.rows.length === 0 ? (
        <EmptyState
          title="Hành trình bắt đầu từ bước nhỏ"
          description="Chưa có người học được xếp hạng ở mục này. Học một bài để ghi dấu bước tiến đầu tiên của bạn nhé."
        >
          <Button title="Học tiếp hôm nay" icon="arrow" onPress={() => router.dismissTo('/')} />
        </EmptyState>
      ) : (
        <>
          <MyRank board={board.data} user={user} />
          <Rankings board={board.data} />
        </>
      )}
    </Screen>
  );
}
