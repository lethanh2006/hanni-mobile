import { Pressable } from 'react-native';

import type { ThemeColor } from '@/constants/theme';

import { AppText } from './text';

/** Chữ bấm được (`text-xs font-medium text-primary` của web), dùng cho liên kết phụ ("Quên mật khẩu?", "Xem tất cả"). */
export function TextLink({
  title,
  onPress,
  color = 'primary',
  size = 'small',
}: {
  title: string;
  onPress: () => void;
  color?: ThemeColor;
  size?: 'small' | 'caption' | 'body';
}) {
  return (
    <Pressable onPress={onPress} hitSlop={8} accessibilityRole="link">
      {({ pressed }) => (
        <AppText variant={size} weight="600" color={color} style={pressed && { textDecorationLine: 'underline' }}>
          {title}
        </AppText>
      )}
    </Pressable>
  );
}
