/**
 * Bảng màu chép từ `app/globals.css` của hanni-client để app và web cùng nhận diện.
 * Mọi màn hình lấy màu qua `useTheme()`, không viết mã màu trực tiếp.
 */
import { Platform } from 'react-native';

export const Colors = {
  light: {
    background: '#f7f8fa',
    surface: '#ffffff',
    surface2: '#f0f2f5',
    text: '#202b3e',
    muted: '#646c7b',
    border: '#e7e9ef',
    primary: '#bd2b1f',
    primaryText: '#ffffff',
    primarySoft: '#fbeceb',
    hanviet: '#946311',
    accent: '#85621c',
    good: '#24784b',
    goodSoft: '#e6f3ec',
    warn: '#93600f',
    danger: '#c0392f',
    dangerSoft: '#fbeceb',
    lavender: '#8e5383',
    chartBar: '#dc3526',
    heroFrom: '#fff8f5',
    heroTo: '#f9e8df',
  },
  dark: {
    background: '#121720',
    surface: '#1a2230',
    surface2: '#252e3d',
    text: '#f1f3f8',
    muted: '#a2acbc',
    border: '#303a4a',
    primary: '#ff796b',
    primaryText: '#26110d',
    primarySoft: '#3a2222',
    hanviet: '#e3b25c',
    accent: '#d8a24e',
    good: '#55c489',
    goodSoft: '#1d3328',
    warn: '#e0a04a',
    danger: '#e56b60',
    dangerSoft: '#3a2222',
    lavender: '#c489b8',
    chartBar: '#ec5d50',
    heroFrom: '#2c1c16',
    heroTo: '#37231a',
  },
} as const;

export type ThemeColors = { [K in keyof typeof Colors.light]: string };
export type ThemeColor = keyof ThemeColors;

function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Màu có độ mờ — như `bg-primary/10` của Tailwind: `alpha(theme.primary, 0.1)`. */
export function alpha(hex: string, a: number) {
  const [r, g, b] = rgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/** Trộn 2 màu — như `color-mix(in srgb, a p%, b)` của CSS (`p` từ 0 đến 1). */
export function mix(a: string, b: string, p: number) {
  const [r1, g1, b1] = rgb(a);
  const [r2, g2, b2] = rgb(b);
  const c = (x: number, y: number) => Math.round(x * p + y * (1 - p));
  return `rgb(${c(r1, r2)}, ${c(g1, g2)}, ${c(b1, b2)})`;
}

/** Bóng của khối `.panel` trên web. */
export function panelShadow(theme: ThemeColors) {
  return `0 4px 20px -12px ${alpha(theme.text, 0.16)}, 0 1px 3px -1px ${alpha(theme.text, 0.08)}`;
}

/** Khối `.panel.tint-primary` (hoặc tông khác) của web: nền pha màu 7% nhạt dần xuống trắng, viền + bóng như `.panel`. */
export function tintPanel(theme: ThemeColors, color: string = theme.primary, amount = 0.07) {
  return {
    backgroundColor: theme.surface,
    backgroundImage: `linear-gradient(180deg, ${mix(color, theme.surface, amount)}, ${theme.surface})`,
    borderColor: alpha(theme.border, 0.8),
    boxShadow: panelShadow(theme),
  };
}

/**
 * Font giống web: chữ Latin/Việt là Geist (nhúng lúc build qua plugin expo-font), chữ Hán là kiểu chữ có chân
 * (web: "Kaiti SC", "KaiTi", "Noto Serif CJK SC", "Songti SC", serif — trên Android là Noto Serif CJK).
 */
export const Fonts = {
  sans: 'Geist',
  hanzi: Platform.select({
    ios: 'Songti SC',
    android: 'serif',
    default: '"Kaiti SC", "KaiTi", "Noto Serif CJK SC", "Songti SC", serif',
  }),
};

/** Màu pinyin theo thanh điệu (giống `TONE_CLASS` của web). Thanh nhẹ dùng màu `muted`. */
export const ToneColors: Record<string, string> = {
  '1': '#c23b32',
  '2': '#2f8f4f',
  '3': '#2f6fd0',
  '4': '#8a4fbf',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

/** Bo góc như quy tắc giao diện của web: thẻ 16px, ô bên trong + nút 12px, chip tròn. */
export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;
