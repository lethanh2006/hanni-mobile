import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { Icon, type IconName } from './icon';
import { AppText } from './text';

/** Đầu màn trong tab: biểu tượng + tiêu đề + 1 câu nói màn này làm gì (như `PageHeading` của web). */
export function PageHeader({
  icon,
  title,
  description,
  right,
}: {
  icon: IconName;
  title: string;
  description?: string;
  right?: ReactNode;
}) {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      <View style={[styles.icon, { backgroundColor: theme.primarySoft }]}>
        <Icon name={icon} size={20} color="primary" />
      </View>
      <View style={styles.copy}>
        <AppText variant="title">{title}</AppText>
        {description && (
          <AppText variant="small" color="muted">
            {description}
          </AppText>
        )}
      </View>
      {right}
    </View>
  );
}

/** Đầu mục bên trong màn. */
export function SectionTitle({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <View style={styles.section}>
      <AppText variant="heading" style={styles.copy}>
        {title}
      </AppText>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  icon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1 },
  section: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
});
