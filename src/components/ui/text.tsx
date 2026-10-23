import { StyleSheet, Text, type TextProps } from 'react-native';

import type { ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Variant = 'title' | 'heading' | 'body' | 'small' | 'caption' | 'label';

export type AppTextProps = TextProps & {
  variant?: Variant;
  color?: ThemeColor;
  bold?: boolean;
  center?: boolean;
};

/** Chữ theo cỡ chuẩn của app. Nhỏ nhất 12px như quy tắc giao diện của web. */
export function AppText({
  variant = 'body',
  color = 'text',
  bold,
  center,
  style,
  ...rest
}: AppTextProps) {
  const theme = useTheme();
  return (
    <Text
      style={[
        styles[variant],
        { color: theme[color] },
        bold && styles.bold,
        center && styles.center,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, lineHeight: 30, fontWeight: '800' },
  heading: { fontSize: 18, lineHeight: 24, fontWeight: '700' },
  body: { fontSize: 15, lineHeight: 22 },
  small: { fontSize: 13, lineHeight: 19 },
  caption: { fontSize: 12, lineHeight: 16 },
  label: { fontSize: 12, lineHeight: 16, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase' },
  bold: { fontWeight: '700' },
  center: { textAlign: 'center' },
});
