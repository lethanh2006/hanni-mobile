import { StyleSheet, View } from 'react-native';

import { AppText, Card, Icon, type IconName } from '@/components/ui';
import { Spacing, type ThemeColor } from '@/constants/theme';

export interface Stat {
  label: string;
  value: number;
  hint?: string;
  icon: IconName;
  color: ThemeColor;
}

/** Lưới ô số liệu 2 cột (Tiến độ, hồ sơ công khai). */
export function StatGrid({ stats }: { stats: Stat[] }) {
  return (
    <View style={styles.grid}>
      {stats.map((s) => (
        <Card key={s.label} style={styles.cell}>
          <View style={styles.row}>
            <AppText variant="caption" color="muted" style={styles.flex}>
              {s.label}
            </AppText>
            <Icon name={s.icon} size={16} color={s.color} />
          </View>
          <AppText variant="title">{s.value.toLocaleString('vi-VN')}</AppText>
          {s.hint && (
            <AppText variant="caption" color="muted">
              {s.hint}
            </AppText>
          )}
        </Card>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: Spacing.md },
  cell: { width: '48%', gap: 2 },
  row: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1 },
});
