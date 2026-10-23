import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { AppText } from './text';

/** Nút chọn dạng viên thuốc. Đang chọn = nền đỏ nhạt + viền + chữ đỏ (lớp `.chip-on` của web). */
export function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[
        styles.chip,
        active
          ? { backgroundColor: theme.primarySoft, borderColor: theme.primary }
          : { backgroundColor: theme.surface, borderColor: theme.border },
      ]}>
      <AppText variant="small" bold color={active ? 'primary' : 'text'}>
        {label}
      </AppText>
    </Pressable>
  );
}

/** Hàng chip cuộn ngang, chọn 1. */
export function ChipRow<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T | null;
  onChange: (value: T) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {options.map((o) => (
        <Chip key={o.value} label={o.label} active={o.value === value} onPress={() => onChange(o.value)} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  row: { gap: Spacing.sm },
});
