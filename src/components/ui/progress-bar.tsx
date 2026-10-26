import Svg, { Circle } from 'react-native-svg';
import { StyleSheet, View } from 'react-native';

import { alpha, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Thanh tiến độ `ProgressBar` của web: rãnh xám có đệm 2px, vạch bo tròn. `value` từ 0 đến 100. */
export function ProgressBar({
  value,
  color = 'primary',
  height = 10,
}: {
  value: number;
  color?: ThemeColor;
  height?: number;
}) {
  const theme = useTheme();
  const safe = Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0;
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(safe) }}
      style={[
        styles.track,
        { height, backgroundColor: alpha(theme.surface2, 0.9), boxShadow: `inset 0 1px 2px ${alpha(theme.text, 0.06)}` },
      ]}>
      <View style={[styles.fill, { width: `${safe}%`, backgroundColor: theme[color] }]} />
    </View>
  );
}

/** Vòng tiến độ (thẻ "Học tiếp" của web). */
export function ProgressRing({
  value,
  size = 96,
  stroke = 8,
  color = 'primary',
  children,
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: ThemeColor;
  children?: React.ReactNode;
}) {
  const theme = useTheme();
  const safe = Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={theme.surface2} strokeWidth={stroke} fill="none" />
        {safe > 0 && (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={theme[color]}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${(c * safe) / 100} ${c}`}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        )}
      </Svg>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { width: '100%', borderRadius: 999, overflow: 'hidden', padding: 2 },
  fill: { height: '100%', borderRadius: 999 },
});
