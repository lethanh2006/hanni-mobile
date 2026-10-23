import { StyleSheet, View } from 'react-native';

import { AppText, Card, Icon, type IconName } from '@/components/ui';
import { Spacing, type ThemeColor } from '@/constants/theme';
import type { ProgressOverview } from '@/lib/types';

/** 4 con số nói 4 chuyện khác nhau: vốn từ đã nhớ, đang làm quen, việc hôm nay, việc sắp tới. */
export function StatGrid({ totals }: { totals: ProgressOverview['totals'] }) {
  const stats: { label: string; value: number; hint: string; icon: IconName; color: ThemeColor }[] = [
    { label: 'Đã thuộc', value: totals.learned, hint: 'Vốn từ đã ghi nhớ', icon: 'check', color: 'good' },
    { label: 'Đang học', value: totals.learning, hint: 'Từng bước làm quen', icon: 'book', color: 'primary' },
    { label: 'Đến hạn ôn', value: totals.due, hint: 'Cần gặp lại hôm nay', icon: 'clock', color: 'primary' },
    { label: 'Ôn trong 24 giờ', value: totals.atRisk, hint: 'Sắp tới lịch ôn', icon: 'refresh', color: 'warn' },
  ];
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
          <AppText variant="caption" color="muted">
            {s.hint}
          </AppText>
        </Card>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  cell: { flexBasis: '46%', flexGrow: 1, gap: 2 },
  row: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1 },
});
