import { StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Variant = 'display' | 'title' | 'heading' | 'body' | 'small' | 'caption' | 'label';
type Weight = '400' | '500' | '600' | '700' | '800';

export type AppTextProps = TextProps & {
  variant?: Variant;
  color?: ThemeColor;
  /** = `weight="700"`. */
  bold?: boolean;
  weight?: Weight;
  center?: boolean;
};

/**
 * Chữ theo cỡ của web (Tailwind): `display` = text-3xl đậm (ô số liệu), `title` = tiêu đề trang 22px,
 * `heading` = đầu mục 17px, `body` = text-sm, `small` = 13px, `caption` = text-xs, `label` = nhãn nhỏ `.eyebrow`
 * (viết hoa, giãn chữ, xám). Nhỏ nhất 12px như quy tắc giao diện của web.
 */
export function AppText({ variant = 'body', color, bold, weight, center, style, ...rest }: AppTextProps) {
  const theme = useTheme();
  return (
    <Text
      style={[
        styles.base,
        styles[variant],
        { color: theme[color ?? (variant === 'label' ? 'muted' : 'text')] },
        bold && { fontWeight: '700' },
        weight && { fontWeight: weight },
        center && styles.center,
        style,
      ]}
      {...rest}
    />
  );
}

/** Chữ Hán: kiểu chữ có chân như `.hanzi` của web (Khải/Tống), không giãn chữ. */
export function Hanzi({
  size = 24,
  color = 'text',
  style,
  ...rest
}: TextProps & { size?: number; color?: ThemeColor }) {
  const theme = useTheme();
  return (
    <Text
      style={[{ fontFamily: Fonts.hanzi, fontSize: size, lineHeight: Math.round(size * 1.3), color: theme[color] }, style]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  base: { fontFamily: Fonts.sans },
  display: { fontSize: 30, lineHeight: 36, fontWeight: '800', letterSpacing: -0.75 },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '700', letterSpacing: -0.66 },
  heading: { fontSize: 17, lineHeight: 25, fontWeight: '600', letterSpacing: -0.42 },
  body: { fontSize: 14, lineHeight: 21 },
  small: { fontSize: 13, lineHeight: 19 },
  caption: { fontSize: 12, lineHeight: 16 },
  label: { fontSize: 12, lineHeight: 18, fontWeight: '600', letterSpacing: 1.68, textTransform: 'uppercase' },
  center: { textAlign: 'center' },
});
