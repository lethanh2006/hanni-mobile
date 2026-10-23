import { StyleSheet, View } from 'react-native';

import { AppText, Card, Loading, SectionTitle } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useStreakHistory } from '@/lib/hooks';
import type { DayActivity } from '@/lib/types';

const DAYS = 30;

function localIso(d: Date): string {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

/**
 * Lịch 30 ngày gần nhất: mỗi ô 1 ngày, đậm dần theo mức ôn, xanh khi đạt mục tiêu ngày.
 * API chỉ trả NGÀY CÓ học nên tự dựng đủ 30 ngày rồi khớp theo ngày.
 */
export function ActivityCalendar() {
  const theme = useTheme();
  const { data, isLoading } = useStreakHistory(DAYS);
  const byDate = new Map((data ?? []).map((d) => [d.date, d]));
  const today = new Date();
  const cells = Array.from({ length: DAYS }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (DAYS - 1 - i));
    const iso = localIso(d);
    return { iso, day: byDate.get(iso) };
  });

  function tone(day: DayActivity | undefined) {
    if (!day || (day.wordsReviewed === 0 && day.minutesStudied === 0)) return { backgroundColor: theme.surface2 };
    if (day.goalMet) return { backgroundColor: theme.good };
    return { backgroundColor: theme.primary, opacity: day.wordsReviewed >= 10 || day.minutesStudied >= 10 ? 0.6 : 0.25 };
  }

  return (
    <Card>
      <SectionTitle title="Lịch hoạt động 30 ngày" />
      {isLoading ? (
        <Loading />
      ) : (
        <View style={styles.grid}>
          {cells.map(({ iso, day }) => (
            <View key={iso} style={styles.cellWrap}>
              <View style={[styles.cell, tone(day)]} />
            </View>
          ))}
        </View>
      )}
      <AppText variant="caption" color="muted">
        Xám: không học · Đỏ: có học · Xanh: đạt mục tiêu ngày
      </AppText>
    </Card>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginVertical: Spacing.sm },
  // 10 ô mỗi hàng.
  cellWrap: { width: '10%', padding: 3 },
  cell: { aspectRatio: 1, borderRadius: 4 },
});
