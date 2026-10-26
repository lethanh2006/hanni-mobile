import Svg, { Path } from 'react-native-svg';

import type { ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Bộ icon nét CHÉP NGUYÊN từ `components/icon.tsx` của hanni-client (cùng path, nét 1.7, đầu tròn) để app nhìn giống web. */
const paths = {
  home: 'm3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z',
  book: 'M12 6c-3-2-6-2-10-1v15c4-1 7-1 10 1m0-15c3-2 6-2 10-1v15c-4-1-7-1-10 1V6Z',
  cards:
    'M8 3h12a1 1 0 0 1 1 1v14M4 7h12a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Z',
  chart: 'M4 3v18h17M9 16v-5m5 5V6m5 10V9',
  trophy:
    'M8 3h8v7a4 4 0 0 1-8 0V3Zm0 2H4v3a4 4 0 0 0 4 4m8-7h4v3a4 4 0 0 1-4 4m-4 2v5m-4 2h8m-6-2h4',
  settings:
    'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1 1-3Z',
  arrow: 'M4 12h16m-6-6 6 6-6 6',
  back: 'M20 12H4m6-6-6 6 6 6',
  check: 'm5 12 4 4L19 6',
  search: 'M21 21l-5-5M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14Z',
  flame:
    'M12 2c2 5-4 6-2 11 2 0 4-2 4-5 4 3 6 6 4 10a7 7 0 0 1-12 0C3 12 9 9 12 2Z',
  target: 'M12 3a9 9 0 1 0 9 9M12 7a5 5 0 1 0 5 5m-5 0 9-9m-5 0h5v5',
  flag: 'M5 21V4m0 0h11l-2 4 2 4H5',
  spark: 'm12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z',
  clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 4v5l3 2',
  sound: 'm11 4-6 5H2v6h3l6 5V4Zm4 4a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14',
  refresh: 'M20 7a9 9 0 0 0-15-1L2 9m0-6v6h6m-4 8a9 9 0 0 0 15 1l3-3m0 6v-6h-6',
  logout: 'M9 3H4v18h5m0-9h13m-5-5 5 5-5 5',
  menu: 'M4 6h16M4 12h16M4 18h16',
  close: 'm6 6 12 12M6 18 18 6',
  lock: 'M6 10h12v11H6V10Zm3 0V6a3 3 0 0 1 6 0v4m-3 4v3',
  info: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 8v6m0-10v.1',
  route:
    'M6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm12-10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm-1 0h-4a4 4 0 0 0 0 8h-2a4 4 0 0 1 0-8',
  bell: 'M18 16H6l1-2V10a5 5 0 0 1 10 0v4l1 2Zm-8 3a2 2 0 0 0 4 0',
  sun: 'M12 6V3m0 18v-3m6-6h3M3 12h3m11.5-5.5 1.5-1.5m-16 16 1.5-1.5m13 0 1.5 1.5m-16-16 1.5 1.5M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z',
  moon: 'M20 14a8 8 0 0 1-10-10 8 8 0 1 0 10 10Z',
  play: 'M8 5v14l11-7L8 5Z',
  pause: 'M8 5v14M16 5v14',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Zm10-3a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z',
  'eye-off':
    'm3 3 18 18M10.5 5.1 12 5c6 0 10 7 10 7a20 20 0 0 1-3.2 3.8M6 6.7C3.5 8.9 2 12 2 12s4 7 10 7a11 11 0 0 0 4.4-1M10 10a3 3 0 0 0 4 4',
  mic: 'M9 5a3 3 0 0 1 6 0v6a3 3 0 0 1-6 0V5Zm-3 6a6 6 0 0 0 12 0m-6 6v4m-3 0h6',
  plus: 'M12 5v14M5 12h14',
  chevron: 'm9 5 7 7-7 7',
  user: 'M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM4 21v-3a8 5 0 0 1 16 0v3',
  headphones: 'M3 14v-3a9 9 0 0 1 18 0v3M3 12h4v8H3v-8Zm14 0h4v8h-4v-8Z',
  pencil:
    'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5Z',
  heart:
    'M12 21s-6.7-4.35-9.3-8.2C1 10.1 1.6 6.6 4.6 5.1 7 4 9.6 4.8 12 7.5c2.4-2.7 5-3.5 7.4-2.4 3 1.5 3.6 5 1.9 7.7C18.7 16.65 12 21 12 21Z',
  message:
    'M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-5 4v-4H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z',
  reply: 'M9 14 4 9l5-5M4 9h9a7 7 0 0 1 7 7v2',
  trash:
    'M4 7h16M9 7V4h6v3m-9 0 1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13',
  share:
    'M18 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM6 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM18 16a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM8.59 13.51 15.42 17.49M15.41 6.51 8.59 10.49',
  crown: 'M4 18h16M4 18 3 8l5 4 4-6 4 6 5-4-1 10',
  grid: 'M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z',
  sidebar: 'M4 4h16v16H4V4Zm5 0v16',
  download: 'M12 4v11m-4-4 4 4 4-4M5 20h14',
  /** Nút Chia sẻ của Safari (ô vuông + mũi tên lên) — dùng trong hướng dẫn cài app trên iOS. */
  'share-ios':
    'M12 3v12m-4-8 4-4 4 4M7 10H5a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1h-2',
  camera:
    'M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Zm8 3a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z',
  users:
    'M9 4a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7ZM2 20v-2a7 4.5 0 0 1 14 0v2M16 4.2a3.5 3.5 0 0 1 0 6.6M18.5 14.6A6.5 4.3 0 0 1 22 18v2',
  calendar: 'M4 6h16v14H4V6Zm0 4h16M8 3v4m8-4v4',
  /** Lá chắn giữ chuỗi ngày học. */
  shield: 'M12 3 19 6v5c0 4.6-3 8.4-7 10-4-1.6-7-5.4-7-10V6l7-3Z',
  copy: 'M9 9h11v11H9V9ZM5 15H4V4h11v1',
} as const;

export type IconName = keyof typeof paths;

export function Icon({
  name,
  size = 20,
  color = 'text',
  rawColor,
  strokeWidth = 1.7,
}: {
  name: IconName;
  size?: number;
  color?: ThemeColor;
  /** Màu tự do (vd màu pha độ mờ) — thắng `color`. */
  rawColor?: string;
  strokeWidth?: number;
}) {
  const theme = useTheme();
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={rawColor ?? theme[color]}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round">
      <Path d={paths[name]} />
    </Svg>
  );
}
