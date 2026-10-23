import { Pressable } from 'react-native';

import type { ThemeColor } from '@/constants/theme';

import { AppText } from './text';

/** Chữ bấm được, dùng cho liên kết phụ ("Quên mật khẩu?", "Đăng ký ngay"). */
export function TextLink({
  title,
  onPress,
  color = 'primary',
}: {
  title: string;
  onPress: () => void;
  color?: ThemeColor;
}) {
  return (
    <Pressable onPress={onPress} hitSlop={8} accessibilityRole="link">
      <AppText variant="small" bold color={color}>
        {title}
      </AppText>
    </Pressable>
  );
}
