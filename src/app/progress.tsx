import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, ErrorNote, Loading, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { ActivityCalendar } from '@/features/progress/activity-calendar';
import { LevelProgress } from '@/features/progress/level-progress';
import { RecentQuizzes } from '@/features/progress/recent-quizzes';
import { StatGrid } from '@/features/progress/stat-grid';
import { TodaySuggestion, VocabSummary } from '@/features/progress/vocab-summary';
import { LeechList, SuspendedList } from '@/features/progress/word-lists';
import { useRequireAuth } from '@/lib/auth';
import { useProgress } from '@/lib/hooks';

/** Tiến độ học tập — bạn đã học được gì và nên ôn gì tiếp. */
export default function ProgressScreen() {
  const { user } = useRequireAuth();
  const { data, error, mutate } = useProgress();
  const [refreshing, setRefreshing] = useState(false);

  async function onRefresh() {
    setRefreshing(true);
    await mutate();
    setRefreshing(false);
  }

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      <Stack.Screen options={{ title: 'Tiến độ học tập' }} />
      {!user || (!data && !error) ? (
        <Loading />
      ) : error || !data ? (
        <>
          <ErrorNote>Chưa tải được tiến độ.</ErrorNote>
          <Button title="Thử lại" variant="secondary" onPress={() => void mutate()} />
        </>
      ) : (
        <>
          <View style={styles.links}>
            <Button title="Huy hiệu" icon="trophy" variant="secondary" onPress={() => router.push('/achievements')} style={styles.flex} />
            <Button title="Xếp hạng" icon="flame" variant="secondary" onPress={() => router.push('/leaderboard')} style={styles.flex} />
          </View>
          <VocabSummary data={data} />
          <TodaySuggestion data={data} />
          {/* 4 con số nói 4 chuyện: vốn từ đã nhớ, đang làm quen, việc hôm nay, việc sắp tới. */}
          <StatGrid
            stats={[
              { label: 'Đã thuộc', value: data.totals.learned, hint: 'Vốn từ đã ghi nhớ', icon: 'check', color: 'good' },
              { label: 'Đang học', value: data.totals.learning, hint: 'Từng bước làm quen', icon: 'book', color: 'primary' },
              { label: 'Đến hạn ôn', value: data.totals.due, hint: 'Cần gặp lại hôm nay', icon: 'clock', color: 'primary' },
              { label: 'Ôn trong 24 giờ', value: data.totals.atRisk, hint: 'Sắp tới lịch ôn', icon: 'refresh', color: 'warn' },
            ]}
          />
          <ActivityCalendar />
          <LeechList />
          <SuspendedList onChange={() => void mutate()} />
          <RecentQuizzes />
          <LevelProgress levels={data.levels} />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  links: { flexDirection: 'row', gap: Spacing.sm },
  flex: { flex: 1 },
});
