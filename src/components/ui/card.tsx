import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { alpha, panelShadow, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { Icon, type IconName } from './icon';

/**
 * Khối `.panel` của web: nền trắng, viền mảnh, bo 16px, bóng mềm; `Card` của web có `p-5` (20px) trên điện thoại.
 * Có `onPress` thì cả thẻ bấm được.
 */
export function Card({
  children,
  onPress,
  style,
}: {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const look = [
    styles.card,
    { backgroundColor: theme.surface, borderColor: alpha(theme.border, 0.8), boxShadow: panelShadow(theme) },
    style,
  ];
  if (!onPress) return <View style={look}>{children}</View>;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [look, pressed && { borderColor: alpha(theme.primary, 0.3), transform: [{ scale: 0.99 }] }]}>
      {children}
    </Pressable>
  );
}

/** Ô biểu tượng trung tính `.icon-tile` của web (44px, nền xám nhạt, viền, biểu tượng màu chữ 75%). */
export function IconTile({
  icon,
  iconSize = 22,
  children,
  size = 44,
  style,
}: {
  icon?: IconName;
  iconSize?: number;
  children?: ReactNode;
  size?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.tile,
        { width: size, height: size, backgroundColor: theme.surface2, borderColor: theme.border },
        style,
      ]}>
      {icon && <Icon name={icon} size={iconSize} rawColor={alpha(theme.text, 0.75)} />}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: 20,
    gap: 12,
  },
  tile: {
    borderWidth: 1,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
