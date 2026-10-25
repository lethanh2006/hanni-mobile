import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { InsightsReport } from '@/lib/types';

const BAR_HEIGHT = 96;

/** "12/10" */
export const dayMonth = (iso: string) => {
  const [, m, d] = iso.slice(0, 10).split('-');
  return `${Number(d)}/${Number(m)}`;
};

/** Cột phút học mỗi ngày (quý: mỗi tuần). Chỉ ghi số ở cột cao nhất cho đỡ rối. */
export function ActivityBars({ series }: { series: InsightsReport['series'] }) {
  const theme = useTheme();
  const max = Math.max(1, ...series.map((s) => s.minutes));
  const peak = series.findIndex((s) => s.minutes === max);

  return (
    <View>
      <View style={[styles.chart, { borderColor: theme.border }]}>
        {series.map((s, i) => (
          <View key={s.startIso} style={styles.column}>
            {i === peak && s.minutes > 0 && (
              <AppText variant="caption" bold color="primary">
                {s.minutes}
              </AppText>
            )}
            <View
              style={[
                styles.bar,
                { height: Math.max(2, (s.minutes / max) * BAR_HEIGHT), backgroundColor: s.minutes ? theme.primary : theme.surface2 },
              ]}
            />
          </View>
        ))}
      </View>
      {series.length > 0 && (
        <View style={styles.axis}>
          <AppText variant="caption" color="muted">
            {dayMonth(series[0].startIso)}
          </AppText>
          <AppText variant="caption" color="muted">
            {dayMonth(series[series.length - 1].startIso)}
          </AppText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: BAR_HEIGHT + 18, borderBottomWidth: 1 },
  column: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 2 },
  bar: { width: '80%', maxWidth: 24, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  axis: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.xs },
});
