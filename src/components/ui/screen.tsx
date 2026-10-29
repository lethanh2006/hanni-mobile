import { useIsFocused } from 'expo-router';
import { useEffect, useImperativeHandle, useRef, useState, type ReactNode, type Ref, type RefObject } from 'react';
import {
  Keyboard,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
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
  const list = useRef<ScrollViewInstance>(null);
  const offset = useRef(0);
  useImperativeHandle(scrollRef, () => list.current as ScrollViewInstance);
  const keyboard = useKeyboardSpace(list, offset);
  const padding = [
    styles.content,
    { paddingTop: (safeTop ? insets.top : 0) + 20 },
    contentStyle,
    keyboard > 0 && { paddingBottom: keyboard + 28 },
  ];

  if (!scroll) {
    return <View style={[styles.fill, { backgroundColor: theme.background }, padding]}>{children}</View>;
  }
  return (
    <ScrollView
      ref={list}
      stickyHeaderIndices={stickyHeaderIndices}
      style={[styles.fill, { backgroundColor: theme.background }]}
      contentContainerStyle={padding}
      // Thanh trên/header đã tự chừa tai thỏ — để iOS chèn thêm là cách trên 2 lần.
      contentInsetAdjustmentBehavior="never"
      keyboardShouldPersistTaps="handled"
      onScroll={(e) => {
        offset.current = e.nativeEvent.contentOffset.y;
        reportScroll(offset.current);
      }}
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

/**
 * Android edge-to-edge không còn co màn lại khi bàn phím mở (`adjustResize` hết tác dụng), iOS thì xưa nay vẫn vậy:
 * chừa đáy bằng chiều cao bàn phím để cuộn được, rồi đẩy ô đang gõ lên ngay trên bàn phím nếu nó bị che.
 */
function useKeyboardSpace(list: RefObject<ScrollViewInstance | null>, offset: RefObject<number>) {
  const focused = useIsFocused();
  const [keyboard, setKeyboard] = useState({ height: 0, top: 0 });

  useEffect(() => {
    if (!focused) return;
    const show = Keyboard.addListener('keyboardDidShow', (e) =>
      setKeyboard({ height: e.endCoordinates.height, top: e.endCoordinates.screenY }),
    );
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboard({ height: 0, top: 0 }));
    return () => {
      show.remove();
      hide.remove();
      setKeyboard({ height: 0, top: 0 });
    };
  }, [focused]);

  // Chạy sau khi phần đệm đáy đã vào layout, không thì cuộn bị chặn ở đáy cũ.
  useEffect(() => {
    if (!keyboard.height) return;
    TextInput.State.currentlyFocusedInput()?.measureInWindow((_x, y, _w, h) => {
      const hidden = y + h + 16 - keyboard.top;
      if (hidden > 0) list.current?.scrollTo({ y: offset.current + hidden, animated: true });
    });
  }, [keyboard, list, offset]);

  return keyboard.height;
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 28,
    gap: 24,
  },
});
