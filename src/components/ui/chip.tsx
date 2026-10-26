import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { alpha, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { AppText } from './text';

/**
 * Nút chọn dạng viên thuốc. Đang chọn = lớp `.chip-on` của web (viền đỏ 50%, nền đỏ 10%, chữ đỏ đậm).
 * Mặc định = chip lọc của web (`px-3.5 py-1.5 text-xs font-semibold`); `strong` = chip cấp HSK ở trang chủ web
 * (viền 2px, chữ 14px đậm, có bóng đáy khi chọn).
 */
export function Chip({
  label,
  active,
  onPress,
  strong = false,
  trailing,
  style,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  strong?: boolean;
  /** Phần đuôi trong chip, sau chữ (vd nhãn "ĐANG HỌC"). */
  trailing?: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [
        styles.chip,
        strong && styles.strong,
        active
          ? {
              backgroundColor: alpha(theme.primary, 0.1),
              borderColor: alpha(theme.primary, 0.5),
              boxShadow: strong ? `0 3px 0 ${alpha(theme.primary, 0.25)}` : undefined,
            }
          : { backgroundColor: theme.surface, borderColor: theme.border },
        pressed && { transform: [{ scale: 0.97 }] },
        style,
      ]}>
      <AppText variant={strong ? 'body' : 'caption'} weight={strong || active ? '700' : '600'} color={active ? 'primary' : 'text'}>
        {label}
      </AppText>
      {trailing}
    </Pressable>
  );
}

/** Hàng chip cuộn ngang, chọn 1 (điện thoại của web cũng để 1 hàng cuộn ngang). */
export function ChipRow<T extends string | number>({
  options,
  value,
  onChange,
  strong,
}: {
  options: { value: T; label: string }[];
  value: T | null;
  onChange: (value: T) => void;
  strong?: boolean;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {options.map((o) => (
        <Chip
          key={o.value}
          label={o.label}
          active={o.value === value}
          onPress={() => onChange(o.value)}
          strong={strong}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  strong: { borderWidth: 2, paddingHorizontal: 16, paddingVertical: 8 },
  row: { gap: 8, paddingBottom: 4 },
});
