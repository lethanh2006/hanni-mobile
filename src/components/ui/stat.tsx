import { StyleSheet, View } from 'react-native';

import { alpha, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { Card } from './card';
import { Icon, type IconName } from './icon';
import { AppText } from './text';

/** Ô số liệu `Stat` của web: nhãn nhỏ viết hoa + ô biểu tượng màu 40px, số to đậm, 1 dòng gợi ý. */
export function Stat({
  label,
  value,
  hint,
  icon = 'chart',
  tone = 'primary',
}: {
  label: string;
  value: number | string;
  hint?: string;
  icon?: IconName;
  tone?: Extract<ThemeColor, 'primary' | 'good' | 'warn' | 'accent' | 'lavender'>;
}) {
  const theme = useTheme();
  const color = theme[tone];
  return (
    <Card style={styles.card}>
      <View style={styles.head}>
        <AppText variant="caption" weight="500" color="muted" style={styles.label}>
          {label.toUpperCase()}
        </AppText>
        <View
          style={[
            styles.icon,
            {
              backgroundColor: alpha(color, tone === 'primary' ? 0.1 : 0.08),
              borderColor: alpha(color, tone === 'primary' ? 0.2 : 0.15),
            },
          ]}>
          <Icon name={icon} size={18} color={tone} />
        </View>
      </View>
      <AppText variant="display">{typeof value === 'number' ? value.toLocaleString('vi-VN') : value}</AppText>
      {hint && (
        <AppText variant="caption" color="muted" style={styles.hint}>
          {hint}
        </AppText>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 0 },
  head: { marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  label: { flex: 1, letterSpacing: 0.3 },
  icon: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  hint: { marginTop: 8, lineHeight: 19 },
});
