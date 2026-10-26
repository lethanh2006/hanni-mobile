import type { ReactNode, Ref } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewInstance,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/use-theme';
import { reportScroll } from '@/lib/scroll-tuck';

/**
 * Khung chung của mọi màn — lề như `.page-wrap` trong khung app của web ở khổ điện thoại (trên 20px, ngang 16px,
 * dưới 28px), các khối cách nhau 24px (`space-y-6`).
 * - Màn toàn màn hình (không thanh trên, vd phiên học) truyền `safeTop` để chừa tai thỏ.
 * - Có `onRefresh` thì kéo xuống để tải lại.
 * - `scroll={false}` cho màn tự quản lý cuộn (vd danh sách dài dùng FlatList).
 * - `scrollRef` để cuộn tới 1 mục (vd mục lục trang từ), `stickyHeaderIndices` để dính 1 khối con lên đầu khi cuộn.
 */
export function Screen({
  children,
  scroll = true,
  safeTop = false,
  refreshing = false,
  onRefresh,
  contentStyle,
  scrollRef,
  stickyHeaderIndices,
}: {
  children: ReactNode;
  scroll?: boolean;
  safeTop?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  contentStyle?: StyleProp<ViewStyle>;
  scrollRef?: Ref<ScrollViewInstance>;
  stickyHeaderIndices?: number[];
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const padding = [styles.content, { paddingTop: (safeTop ? insets.top : 0) + 20 }, contentStyle];

  if (!scroll) {
    return <View style={[styles.fill, { backgroundColor: theme.background }, padding]}>{children}</View>;
  }
  return (
    <ScrollView
      ref={scrollRef}
      stickyHeaderIndices={stickyHeaderIndices}
      style={[styles.fill, { backgroundColor: theme.background }]}
      contentContainerStyle={padding}
      // Thanh trên/header đã tự chừa tai thỏ — để iOS chèn thêm là cách trên 2 lần.
      contentInsetAdjustmentBehavior="never"
      keyboardShouldPersistTaps="handled"
      onScroll={(e) => reportScroll(e.nativeEvent.contentOffset.y)}
      scrollEventThrottle={32}
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
    paddingHorizontal: 16,
    paddingBottom: 28,
    gap: 24,
  },
});
