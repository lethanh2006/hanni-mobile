import type { ReactNode } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/use-theme';

/**
 * Khung chung của mọi màn — lề như `.page-wrap` của web ở khổ điện thoại (ngang 20px, trên 28px),
 * các khối cách nhau 24px (`space-y-6`).
 * - Màn toàn màn hình (không thanh trên, vd phiên học) truyền `safeTop` để chừa tai thỏ.
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
  const padding = [styles.content, { paddingTop: (safeTop ? insets.top : 0) + 28 }, contentStyle];

  if (!scroll) {
    return <View style={[styles.fill, { backgroundColor: theme.background }, padding]}>{children}</View>;
  }
  return (
    <ScrollView
      style={[styles.fill, { backgroundColor: theme.background }]}
      contentContainerStyle={padding}
      // Thanh trên/header đã tự chừa tai thỏ — để iOS chèn thêm là cách trên 2 lần.
      contentInsetAdjustmentBehavior="never"
      keyboardShouldPersistTaps="handled"
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} colors={[theme.primary]} />
        ) : undefined
      }>
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 24,
  },
});
