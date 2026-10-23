/**
 * Bảng màu chép từ `app/globals.css` của hanni-client để app và web cùng nhận diện.
 * Mọi màn hình lấy màu qua `useTheme()`, không viết mã màu trực tiếp.
 */
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
  },
} as const;

export type ThemeColors = { [K in keyof typeof Colors.light]: string };
export type ThemeColor = keyof ThemeColors;

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

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;
