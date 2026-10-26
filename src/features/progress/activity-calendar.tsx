import { StyleSheet, View } from 'react-native';

import { AppText, Card, SectionHeading } from '@/components/ui';
import { alpha } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useStreakHistory } from '@/lib/hooks';
import type { DayActivity } from '@/lib/types';

const DAYS = 30;

function localIso(d: Date): string {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

/**
 * "Lịch hoạt động 30 ngày" (`ActivityCalendar` của web): lưới 10 cột ô vuông, đậm dần theo mức ôn, xanh khi đạt mục
 * tiêu ngày; chú thích 3 màu bên dưới. API chỉ trả NGÀY CÓ học nên tự dựng đủ 30 ngày rồi khớp theo ngày.
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
    if (!day || (day.wordsReviewed === 0 && day.minutesStudied === 0)) return theme.surface2;
    if (day.goalMet) return theme.good;
    return alpha(theme.primary, day.wordsReviewed >= 10 || day.minutesStudied >= 10 ? 0.6 : 0.25);
  }

  const legend: [string, string][] = [
    ['Không học', theme.surface2],
    ['Có học', alpha(theme.primary, 0.25)],
    ['Đạt mục tiêu', theme.good],
  ];

  return (
    <View style={styles.wrap}>
      <SectionHeading
        icon="clock"
        tone="accent"
        title="Lịch hoạt động 30 ngày"
        description="Mỗi ô là 1 ngày — đậm dần theo mức độ ôn tập, xanh lá khi đạt mục tiêu ngày."
      />
      <Card style={styles.card}>
        {isLoading ? (
          <AppText color="muted">Đang tải lịch hoạt động…</AppText>
        ) : (
          <View>
            <View style={styles.grid}>
              {cells.map(({ iso, day }) => (
                <View key={iso} style={styles.cellWrap}>
                  <View style={[styles.cell, { backgroundColor: tone(day) }]} />
                </View>
              ))}
            </View>
            <View style={styles.legend}>
              {legend.map(([label, color]) => (
                <View key={label} style={styles.legendItem}>
                  <View style={[styles.swatch, { backgroundColor: color }]} />
                  <AppText variant="caption" color="muted">
                    {label}
                  </AppText>
                </View>
              ))}
            </View>
          </View>
        )}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 20 },
  card: { gap: 0 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -3, rowGap: 6 },
  cellWrap: { width: '10%', paddingHorizontal: 3 },
  cell: { aspectRatio: 1, borderRadius: 2 },
  legend: { marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  swatch: { width: 10, height: 10, borderRadius: 2 },
});
