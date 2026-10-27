import { useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Button } from '@/components/ui';

/**
 * Danh sách mở dần (`ProgressiveList` của web ở khổ điện thoại): "Đang hiển thị x / y …", rồi lưới 2 nút "Xem thêm N …"
 * / "Xem tất cả" / "Thu gọn". Đổi tập dữ liệu thì đặt `key` khác để thu gọn lại.
 */
export function ProgressiveList<T>({
  items,
  renderItems,
  initialCount = 6,
  step = 6,
  itemLabel,
}: {
  items: readonly T[];
  renderItems: (visible: readonly T[]) => ReactNode;
  initialCount?: number;
  step?: number;
  /** Nhãn số nhiều, vd "video". */
  itemLabel: string;
}) {
  const total = items.length;
  const initial = Math.min(initialCount, total);
  const [count, setCount] = useState(initial);
  const shown = Math.min(count, total);
  const remaining = total - shown;
  const canCollapse = shown > initial;

  return (
    <View style={styles.root}>
      <AppText variant="caption" weight="600" color="muted">
        Đang hiển thị {shown} / {total} {itemLabel}
      </AppText>
      {renderItems(items.slice(0, shown))}
      {(remaining > 0 || canCollapse) && (
        <View style={styles.controls}>
          {remaining > 0 && (
            <Button
              title={`Xem thêm ${Math.min(step, remaining)} ${itemLabel}`}
              leftIcon="plus"
              variant="secondary"
              size="sm"
              onPress={() => setCount((c) => Math.min(total, c + step))}
              style={styles.button}
            />
          )}
          {remaining > step && (
            <Button title="Xem tất cả" leftIcon="arrow" variant="ghost" size="sm" onPress={() => setCount(total)} style={styles.button} />
          )}
          {canCollapse && (
            <Button title="Thu gọn" leftIcon="chevronUp" variant="ghost" size="sm" onPress={() => setCount(initial)} style={styles.button} />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 12 },
  controls: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingTop: 2 },
  button: { flexBasis: '45%', flexGrow: 1 },
});
