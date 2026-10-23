import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Radius, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { Icon, type IconName } from './icon';
import { AppText } from './text';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const LOOK: Record<Variant, { bg: ThemeColor | null; border: ThemeColor | null; text: ThemeColor }> = {
  primary: { bg: 'primary', border: 'primary', text: 'primaryText' },
  secondary: { bg: 'surface', border: 'border', text: 'text' },
  ghost: { bg: null, border: null, text: 'muted' },
  danger: { bg: 'dangerSoft', border: 'danger', text: 'danger' },
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  loading = false,
  disabled = false,
  style,
}: {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  /** Icon đặt sau chữ (vd mũi tên "Tiếp tục →"). */
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const look = LOOK[variant];
  const inactive = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: look.bg ? theme[look.bg] : 'transparent',
          borderColor: look.border ? theme[look.border] : 'transparent',
        },
        pressed && styles.pressed,
        inactive && styles.disabled,
        style,
      ]}>
      <View style={styles.row}>
        {loading && <ActivityIndicator size="small" color={theme[look.text]} />}
        <AppText bold color={look.text}>
          {title}
        </AppText>
        {icon && !loading && <Icon name={icon} size={16} color={look.text} />}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    paddingHorizontal: 18,
    borderRadius: Radius.md,
    borderWidth: 1,
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  pressed: { opacity: 0.8, transform: [{ translateY: 1 }] },
  disabled: { opacity: 0.5 },
});
