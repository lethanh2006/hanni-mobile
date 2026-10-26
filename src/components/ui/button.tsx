import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { alpha, mix, Radius, type ThemeColor, type ThemeColors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { Icon, type IconName } from './icon';
import { AppText } from './text';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

/**
 * Nút "nổi khối" như `Button` của web (bóng đáy đặc, bấm thì lún xuống — kiểu Duolingo/Hanbeego).
 * Bóng + lớp sáng chép từ `.motion-button.bg-primary` và `VARIANTS` ở `components/ui.tsx` của hanni-client.
 */
function look(variant: Variant, theme: ThemeColors, pressed: boolean): { box: ViewStyle; text: ThemeColor } {
  switch (variant) {
    case 'primary':
      return {
        text: 'primaryText',
        box: {
          backgroundColor: theme.primary,
          borderColor: theme.primary,
          backgroundImage: `linear-gradient(165deg, ${alpha(theme.surface, 0.12)}, transparent 60%)`,
          boxShadow: pressed
            ? `0 1px 0 ${mix(theme.primary, theme.text, 0.78)}`
            : `0 3px 0 ${mix(theme.primary, theme.text, 0.78)}, 0 8px 16px -8px ${alpha(theme.primary, 0.45)}`,
        },
      };
    case 'secondary':
      return {
        text: 'text',
        box: {
          backgroundColor: pressed ? theme.surface2 : theme.surface,
          borderColor: theme.border,
          boxShadow: `0 ${pressed ? 1 : 3}px 0 ${theme.border}`,
        },
      };
    case 'ghost':
      return {
        text: 'muted',
        box: { backgroundColor: pressed ? theme.surface2 : 'transparent', borderColor: 'transparent' },
      };
    case 'danger':
      return {
        text: 'danger',
        box: { backgroundColor: alpha(theme.danger, pressed ? 0.2 : 0.1), borderColor: alpha(theme.danger, 0.3) },
      };
  }
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  leftIcon,
  loading = false,
  disabled = false,
  style,
}: {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  /** `lg` = nút chính to ở đầu trang (như "Bắt đầu học" ở thẻ Học tiếp). */
  size?: 'md' | 'lg';
  /** Icon đặt sau chữ (vd mũi tên "Tiếp tục →"). */
  icon?: IconName;
  /** Icon đặt trước chữ (vd ▷ Bắt đầu học, 🔊 Học phát âm). */
  leftIcon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const inactive = disabled || loading;
  const lift = variant === 'primary' ? 3 : variant === 'secondary' ? 2 : 1;
  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        size === 'lg' && styles.lg,
        look(variant, theme, pressed && !inactive).box,
        pressed && !inactive && { transform: [{ translateY: lift }, { scale: 0.98 }] },
        inactive && styles.disabled,
        style,
      ]}>
      {({ pressed }) => {
        const text = look(variant, theme, pressed).text;
        return (
          <View style={styles.row}>
            {loading && <ActivityIndicator size="small" color={theme[text]} />}
            {leftIcon && !loading && <Icon name={leftIcon} size={size === 'lg' ? 18 : 16} color={text} />}
            <AppText
              weight={variant === 'primary' ? '700' : '600'}
              color={text}
              style={size === 'lg' && styles.lgText}>
              {title}
            </AppText>
            {icon && !loading && <Icon name={icon} size={16} color={text} />}
          </View>
        );
      }}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 44,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    justifyContent: 'center',
  },
  lg: { minHeight: 52, paddingHorizontal: 22 },
  lgText: { fontSize: 15 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  disabled: { opacity: 0.5 },
});
