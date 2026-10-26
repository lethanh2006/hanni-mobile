import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, ErrorNote, Loading, PageHeader, Screen, Stat, TourButton, type TourStep } from '@/components/ui';
import { ActivityCalendar } from '@/features/progress/activity-calendar';
import { LevelProgress } from '@/features/progress/level-progress';
import { PeriodReport } from '@/features/progress/period-report';
import { TodaySuggestion, VocabSummary } from '@/features/progress/vocab-summary';
import { LeechList, RecentQuizzes, SuspendedList } from '@/features/progress/word-lists';
import { useRequireAuth } from '@/lib/auth';
import { useProgress } from '@/lib/hooks';

const TOUR: TourStep[] = [
  {
    icon: 'chart',
    title: 'Bốn con số nói bốn chuyện khác nhau',
    description:
      '"Đang học" là vốn từ bạn đã chạm tới; "Đến hạn ôn" là việc cần làm hôm nay; "Ôn trong 24 giờ" là từ sắp tới lịch ôn; "Đã thuộc" chỉ tính từ đã ôn đúng khoảng 21 ngày nên tăng chậm nhất.',
  },
  {
    icon: 'spark',
    title: 'Báo cáo tuần, tháng, quý',
    description:
      'Đổi giữa tuần/tháng/quý để so với cùng kỳ trước. Hanni Coach (Premium) đọc số liệu đó và viết nhận xét, mẹo nhớ từ hay quên theo âm Hán Việt và kế hoạch kỳ tới.',
  },
  {
    icon: 'flame',
    title: 'Lịch 30 ngày',
    description: 'Mỗi ô là một ngày có học. Nhìn vào đây dễ thấy mình đang đều hay đang đứt quãng hơn là nhìn con số tổng.',
  },
  {
    icon: 'target',
    title: 'Từ khó nhớ',
    description:
      'Những từ bạn sai nhiều lần sẽ tự gom vào một mục riêng ở cuối trang. Khi bạn thật sự nhớ được, từ đó tự rời khỏi danh sách.',
  },
];

/** Tiến độ học tập (trang `/progress` của web): bạn đã học được gì và nên ôn gì tiếp. */
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
    <Screen refreshing={refreshing} onRefresh={onRefresh} contentStyle={styles.page}>
      <View style={styles.head}>
        <PageHeader
          icon="chart"
          tone="good"
          title="Tiến độ học tập"
          description="Bạn đã học được gì và nên ôn gì tiếp."
        />
        <View style={styles.actions}>
          <Button title="Tiếp tục ôn tập" leftIcon="cards" onPress={() => router.navigate('/study')} />
          <Button title="Huy hiệu" leftIcon="trophy" variant="secondary" onPress={() => router.push('/achievements')} />
          <TourButton steps={TOUR} />
        </View>
      </View>
      {!user || (!data && !error) ? (
        <Loading />
      ) : error || !data ? (
        <ErrorNote>
          Chưa tải được tiến độ.{' '}
          <AppText weight="600" color="danger" style={styles.underline} onPress={() => void mutate()}>
            Thử lại
          </AppText>
        </ErrorNote>
      ) : (
        <>
          <View style={styles.top}>
            <VocabSummary data={data} />
            <TodaySuggestion data={data} />
          </View>
          <View style={styles.grid}>
            {(
              [
                { label: 'Đã thuộc', value: data.totals.learned, hint: 'Vốn từ đã ghi nhớ', icon: 'check', tone: 'good' },
                { label: 'Đang học', value: data.totals.learning, hint: 'Từng bước làm quen', icon: 'book', tone: 'primary' },
                { label: 'Đến hạn ôn', value: data.totals.due, hint: 'Cần gặp lại hôm nay', icon: 'clock', tone: 'primary' },
                { label: 'Ôn trong 24 giờ', value: data.totals.atRisk, hint: 'Sắp tới lịch ôn', icon: 'refresh', tone: 'warn' },
              ] as const
            ).map((s) => (
              <View key={s.label} style={styles.cell}>
                <Stat {...s} />
              </View>
            ))}
          </View>
          <PeriodReport />
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
  page: { gap: 32 },
  head: { gap: 12 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  top: { gap: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -8, rowGap: 16 },
  cell: { width: '50%', paddingHorizontal: 8 },
  underline: { textDecorationLine: 'underline' },
});
