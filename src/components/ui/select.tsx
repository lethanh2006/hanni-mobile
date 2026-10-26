import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { alpha } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { Icon } from './icon';
import { AppText } from './text';

/**
 * Ô `<select>` của web (`field h-11 rounded-xl border`): bấm mở hộp chọn giữa màn hình như ô chọn của Android.
 * `small` = ô 36px chữ 12px (vd "Xếp theo" ở bảng tiến độ học viên).
 */
export function Select<T extends string | number>({
  value,
  options,
  onChange,
  placeholder = '— Chọn —',
  title,
  small,
  style,
}: {
  value: T | null;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  placeholder?: string;
  /** Tiêu đề hộp chọn (thường là nhãn của ô). */
  title?: string;
  small?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={title}
        style={[
          styles.field,
          small && styles.small,
          { borderColor: open ? theme.primary : theme.border, backgroundColor: theme.surface },
          style,
        ]}>
        <AppText variant={small ? 'caption' : 'body'} numberOfLines={1} color={current ? 'text' : 'muted'} style={styles.flex}>
          {current?.label ?? placeholder}
        </AppText>
        <View style={{ transform: [{ rotate: '90deg' }] }}>
          <Icon name="chevron" size={small ? 12 : 14} color="muted" />
        </View>
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {title && (
              <AppText weight="700" style={[styles.title, { borderColor: theme.border }]}>
                {title}
              </AppText>
            )}
            <ScrollView>
              {options.map((o) => {
                const active = o.value === value;
                return (
                  <Pressable
                    key={String(o.value)}
                    onPress={() => {
                      onChange(o.value);
                      setOpen(false);
                    }}
                    style={({ pressed }) => [
                      styles.option,
                      active && { backgroundColor: alpha(theme.primary, 0.08) },
                      pressed && { backgroundColor: theme.surface2 },
                    ]}>
                    <AppText color={active ? 'primary' : 'text'} weight={active ? '600' : '400'} style={styles.flex}>
                      {o.label}
                    </AppText>
                    {active && <Icon name="check" size={16} color="primary" />}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  small: { height: 36, borderRadius: 8, paddingHorizontal: 8, gap: 6 },
  flex: { flexShrink: 1, flexGrow: 1 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 24 },
  sheet: { maxHeight: '75%', borderWidth: 1, borderRadius: 16, overflow: 'hidden', paddingVertical: 6 },
  title: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 12, borderBottomWidth: 1, marginBottom: 6 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 13 },
});
