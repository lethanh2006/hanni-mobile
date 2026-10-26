import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Card, Icon, IconTile, type IconName } from '@/components/ui';
import { alpha } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Thẻ cài đặt của web: ô biểu tượng trung tính + tiêu đề đậm + 1 câu mô tả, nội dung bên dưới. */
export function SettingCard({
  icon,
  title,
  description,
  children,
}: {
  icon: IconName;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Card style={styles.card}>
      <View style={styles.head}>
        <IconTile icon={icon} iconSize={20} />
        <View style={styles.flex}>
          <AppText variant="heading" weight="600">
            {title}
          </AppText>
          <AppText color="muted" style={styles.desc}>
            {description}
          </AppText>
        </View>
      </View>
      {children}
    </Card>
  );
}

/** Nút chọn 1 trong 2 (Theo số từ ôn / Theo số phút, Bật / Tắt): đang chọn viền + nền đỏ nhạt, chữ đỏ. */
export function ChoiceButton({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: IconName;
  active: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [
        styles.choice,
        active
          ? { borderColor: alpha(theme.primary, 0.35), backgroundColor: alpha(theme.primary, 0.05) }
          : { borderColor: theme.border, backgroundColor: pressed ? theme.surface2 : theme.surface },
      ]}>
      <Icon name={icon} size={17} color={active ? 'primary' : 'muted'} />
      <AppText weight="500" color={active ? 'primary' : 'muted'}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { gap: 20 },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  flex: { flex: 1, minWidth: 0 },
  desc: { marginTop: 4, lineHeight: 22 },
  choice: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});
