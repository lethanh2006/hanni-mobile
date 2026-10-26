import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { AppText, Icon, type IconName } from '@/components/ui';
import { mix, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Achievement } from '@/lib/types';

/** Màu + biểu tượng từng nhóm huy hiệu — mỗi nhóm một màu để bộ sưu tập nhìn ra được như huy chương. */
export const MEDAL: Record<string, { icon: IconName; color: ThemeColor; unit: string }> = {
  STREAK: { icon: 'flame', color: 'danger', unit: 'ngày' },
  MILESTONE: { icon: 'cards', color: 'lavender', unit: 'lượt' },
  VOLUME: { icon: 'book', color: 'good', unit: 'từ' },
  LEVEL: { icon: 'route', color: 'accent', unit: '' },
  ACCURACY: { icon: 'target', color: 'warn', unit: '' },
};

const SIZE = 72;
const RING = 5;

/**
 * Huy chương tròn 72px của web: mốc ở giữa. Đã mở = vòng màu đặc, lòng pha 14% màu nhóm; chưa mở = lòng xám,
 * vòng tiến độ (web dùng `conic-gradient`, app vẽ cung SVG) + ổ khoá ở góc.
 */
export function Medal({ achievement, pct }: { achievement: Achievement; pct: number }) {
  const theme = useTheme();
  const m = MEDAL[achievement.category] ?? MEDAL.MILESTONE;
  const level = /^HSK(\d)_/.exec(achievement.code)?.[1];
  const n = /_(\d+)$/.exec(achievement.code)?.[1];
  const label = level ? `HSK ${level === '7' ? '7–9' : level}` : n;
  const color = theme[m.color];
  const r = (SIZE - RING) / 2;
  const c = 2 * Math.PI * r;
  const fill = achievement.unlocked ? 1 : Math.min(1, Math.max(0, pct));

  return (
    <View style={styles.medal}>
      <Svg width={SIZE} height={SIZE} style={styles.ring}>
        <Circle cx={SIZE / 2} cy={SIZE / 2} r={r} stroke={theme.border} strokeWidth={RING} fill="none" />
        {fill > 0 && (
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={r}
            stroke={color}
            strokeWidth={RING}
            fill="none"
            strokeDasharray={`${c * fill} ${c}`}
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          />
        )}
      </Svg>
      <View
        style={[
          styles.inner,
          { backgroundColor: achievement.unlocked ? mix(color, theme.surface, 0.14) : theme.surface2 },
        ]}>
        <Icon name={m.icon} size={level ? 18 : 20} rawColor={achievement.unlocked ? color : theme.muted} />
        {label && (
          <AppText weight="800" style={[styles.label, { color: achievement.unlocked ? color : theme.muted }]}>
            {label}
          </AppText>
        )}
      </View>
      {!achievement.unlocked && (
        <View style={[styles.lock, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Icon name="lock" size={12} color="muted" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  medal: { width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', top: 0, left: 0 },
  inner: {
    width: SIZE - RING * 2,
    height: SIZE - RING * 2,
    borderRadius: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { marginTop: 4, fontSize: 14, lineHeight: 14, fontVariant: ['tabular-nums'] },
  lock: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
