import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppText } from '@/components/ui';
import { alpha } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { InsightsPeriod, InsightsReport } from '@/lib/types';

type Point = InsightsReport['series'][number];

const WEEKDAY = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const WEEKDAY_LONG = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
const HEIGHT = 160;

const dateOf = (iso: string) => new Date(`${iso.slice(0, 10)}T00:00:00Z`);

/** "12/10" */
export const dayMonth = (iso: string) => {
  const d = dateOf(iso);
  return `${d.getUTCDate()}/${d.getUTCMonth() + 1}`;
};

/** Mốc trên cùng của trục: số "tròn" ≥ giá trị lớn nhất. */
function niceTop(max: number) {
  const steps = [10, 20, 30, 40, 60, 90, 120, 180, 240, 300, 420, 600, 900];
  return steps.find((s) => s >= max) ?? Math.ceil(max / 300) * 300;
}

/**
 * Biểu đồ "Phút học mỗi ngày/tuần" (`ActivityBars` của web): trục 0 / giữa / đỉnh, lưới mảnh, cột ≤24px bo đầu 4px
 * màu `chartBar`, chỉ ghi số ở cột cao nhất; chạm 1 cột để xem chú thích (phút, lượt chấm thẻ, ngày).
 */
export function ActivityBars({ series, period, endIso }: { series: Point[]; period: InsightsPeriod; endIso: string }) {
  const theme = useTheme();
  const [active, setActive] = useState<number | null>(null);
  const top = niceTop(Math.max(0, ...series.map((p) => p.minutes)));
  const peak = series.reduce((best, p, i) => (p.minutes > (series[best]?.minutes ?? 0) ? i : best), -1);
  const lastPast = series.reduce((last, p, i) => (p.startIso <= endIso ? i : last), 0);

  const describe = (p: Point) =>
    period === 'quarter'
      ? `${dayMonth(p.startIso)} – ${dayMonth(p.endIso)}`
      : `${WEEKDAY_LONG[dateOf(p.startIso).getUTCDay()]} ${dayMonth(p.startIso)}`;
  const tick = (p: Point, i: number) => {
    if (period === 'week') return WEEKDAY[dateOf(p.startIso).getUTCDay()];
    if (period === 'month') {
      const d = dateOf(p.startIso).getUTCDate();
      return d === 1 || d % 5 === 0 ? String(d) : '';
    }
    return i % 3 === 0 ? dayMonth(p.startIso) : '';
  };
  const point = active === null ? null : series[active];
  const leftPct = active === null ? 0 : ((active + 0.5) / series.length) * 100;

  return (
    <View>
      <View style={styles.row}>
        <View style={styles.axis}>
          {[top, top / 2, 0].map((v, i) => (
            <Text key={i} style={[styles.axisText, { color: theme.muted, top: (i * HEIGHT) / 2 - 7 }]}>
              {v}
            </Text>
          ))}
        </View>
        <View style={styles.plot}>
          {[0, 0.5, 1].map((f) => (
            <View key={f} style={[styles.grid, { top: f * HEIGHT, backgroundColor: theme.border }]} />
          ))}
          <View style={styles.bars}>
            {series.map((p, i) => {
              const h = (p.minutes / top) * HEIGHT;
              return (
                <Pressable key={p.startIso} onPress={() => setActive(active === i ? null : i)} style={styles.col}>
                  {i === peak && p.minutes > 0 && (
                    <Text style={[styles.peak, { color: theme.text, bottom: h + 2 }]}>{p.minutes}</Text>
                  )}
                  {p.minutes > 0 && (
                    <View
                      style={[
                        styles.bar,
                        { height: h, backgroundColor: theme.chartBar, opacity: active !== null && active !== i ? 0.55 : 1 },
                      ]}
                    />
                  )}
                </Pressable>
              );
            })}
          </View>
          {point && (
            <View
              pointerEvents="none"
              style={[
                styles.tip,
                {
                  borderColor: theme.border,
                  backgroundColor: theme.surface,
                  boxShadow: `0 10px 15px -3px ${alpha(theme.text, 0.1)}`,
                  left: `${leftPct}%`,
                  transform: [{ translateX: leftPct < 18 ? 0 : leftPct > 82 ? -150 : -75 }],
                },
              ]}>
              {point.startIso > endIso ? (
                <AppText variant="caption" weight="600" color="muted">
                  Chưa tới
                </AppText>
              ) : (
                <>
                  <AppText weight="700">{point.minutes} phút</AppText>
                  <AppText variant="caption" color="muted">
                    {point.reviews} lượt chấm thẻ
                  </AppText>
                </>
              )}
              <AppText variant="caption" color="muted">
                {describe(point)}
              </AppText>
            </View>
          )}
        </View>
      </View>
      <View style={styles.ticks}>
        {series.map((p, i) => (
          <Text
            key={p.startIso}
            numberOfLines={1}
            style={[
              styles.tick,
              { color: i === lastPast && period !== 'quarter' ? theme.text : theme.muted },
              i === lastPast && period !== 'quarter' && { fontWeight: '700' },
            ]}>
            {tick(p, i)}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  axis: { width: 36, height: HEIGHT },
  axisText: { position: 'absolute', right: 8, fontSize: 10, fontVariant: ['tabular-nums'] },
  plot: { flex: 1, height: HEIGHT },
  grid: { position: 'absolute', left: 0, right: 0, height: 1 },
  bars: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  col: { flex: 1, height: '100%', alignItems: 'center', justifyContent: 'flex-end' },
  bar: { width: '100%', maxWidth: 24, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  peak: { position: 'absolute', fontSize: 10, fontWeight: '600', fontVariant: ['tabular-nums'] },
  tip: { position: 'absolute', top: 4, width: 150, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  ticks: { marginTop: 8, marginLeft: 36, flexDirection: 'row', gap: 2 },
  tick: { flex: 1, fontSize: 10, textAlign: 'center' },
});
