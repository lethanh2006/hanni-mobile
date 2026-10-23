import { StyleSheet, View } from 'react-native';

import type { ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Thanh tiến độ, `value` từ 0 đến 100. */
export function ProgressBar({ value, color = 'primary' }: { value: number; color?: ThemeColor }) {
  const theme = useTheme();
  const safe = Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0;
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(safe) }}
      style={[styles.track, { backgroundColor: theme.surface2 }]}>
      <View style={[styles.fill, { width: `${safe}%`, backgroundColor: theme[color] }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 8, borderRadius: 999, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 999 },
});
