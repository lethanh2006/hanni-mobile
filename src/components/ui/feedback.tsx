import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { Card } from './card';
import { Icon } from './icon';
import { AppText } from './text';

export function Loading({ label = 'Đang tải…' }: { label?: string }) {
  const theme = useTheme();
  return (
    <View style={styles.loading} accessibilityRole="progressbar">
      <ActivityIndicator color={theme.primary} />
      <AppText variant="small" color="muted">
        {label}
      </AppText>
    </View>
  );
}

export function ErrorNote({ children }: { children: ReactNode }) {
  const theme = useTheme();
  return (
    <View
      accessibilityRole="alert"
      style={[styles.error, { backgroundColor: theme.dangerSoft, borderColor: theme.danger }]}>
      <Icon name="info" size={18} color="danger" />
      <AppText variant="small" color="danger" style={styles.flex}>
        {children}
      </AppText>
    </View>
  );
}

/** Trạng thái rỗng có cáo Hanni — luôn kèm việc tiếp theo (children) khi có thể. */
export function EmptyState({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <Card style={styles.empty}>
      <Image source={require('@/assets/images/fox-mark.png')} style={styles.fox} />
      <AppText variant="heading" center>
        {title}
      </AppText>
      <AppText variant="small" color="muted" center>
        {description}
      </AppText>
      {children}
    </Card>
  );
}

const styles = StyleSheet.create({
  loading: { paddingVertical: 48, alignItems: 'center', gap: Spacing.sm },
  error: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  flex: { flex: 1 },
  empty: { alignItems: 'center', paddingVertical: Spacing.xxl, gap: Spacing.md },
  fox: { width: 72, height: 72 },
});
