import type { ReactNode } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * Khung chung của mọi màn: nền, lề, cuộn.
 * - Màn trong tab (không có thanh tiêu đề) truyền `safeTop` để chừa tai thỏ.
 * - Có `onRefresh` thì kéo xuống để tải lại.
 * - `scroll={false}` cho màn tự quản lý cuộn (vd danh sách dài dùng FlatList).
 */
export function Screen({
  children,
  scroll = true,
  safeTop = false,
  refreshing = false,
  onRefresh,
  contentStyle,
}: {
  children: ReactNode;
  scroll?: boolean;
  safeTop?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const padding = [
    styles.content,
    { paddingTop: (safeTop ? insets.top : 0) + Spacing.lg },
    contentStyle,
  ];

  if (!scroll) {
    return <View style={[styles.fill, { backgroundColor: theme.background }, padding]}>{children}</View>;
  }
  return (
    <ScrollView
      style={[styles.fill, { backgroundColor: theme.background }]}
      contentContainerStyle={padding}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      refreshControl={
        onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} /> : undefined
      }>
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
    gap: Spacing.lg,
  },
});
