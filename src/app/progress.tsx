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
          <StatGrid totals={data.totals} />
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
