import { StyleSheet, View } from 'react-native';

import { AppText, Icon, type IconName } from '@/components/ui';
import type { ThemeColor } from '@/constants/theme';
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

/** Huy chương tròn: mốc ở giữa (số ngày/từ hoặc cấp HSK); chưa mở thì xám + ổ khoá. */
export function Medal({ achievement }: { achievement: Achievement }) {
  const theme = useTheme();
  const m = MEDAL[achievement.category] ?? MEDAL.MILESTONE;
  const level = /^HSK(\d)_/.exec(achievement.code)?.[1];
  const n = /_(\d+)$/.exec(achievement.code)?.[1];
  const label = level ? `HSK ${level === '7' ? '7–9' : level}` : n;
  const color = achievement.unlocked ? m.color : 'muted';

  return (
    <View
      style={[
        styles.ring,
        { borderColor: theme[color], backgroundColor: achievement.unlocked ? theme.surface : theme.surface2 },
      ]}>
      <Icon name={m.icon} size={18} color={color} />
      {label && (
        <AppText variant="small" bold color={color}>
          {label}
        </AppText>
      )}
      {!achievement.unlocked && (
        <View style={[styles.lock, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Icon name="lock" size={11} color="muted" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lock: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
