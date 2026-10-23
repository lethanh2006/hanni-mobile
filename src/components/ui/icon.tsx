import { SymbolView, type SymbolViewProps } from 'expo-symbols';

import type { ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Tên icon giống `components/icon.tsx` của web; mỗi tên ứng với 1 SF Symbol (iOS) và 1 Material Symbol (Android). */
const ICONS = {
  home: { ios: 'house', android: 'home' },
  book: { ios: 'book', android: 'menu_book' },
  cards: { ios: 'rectangle.stack', android: 'style' },
  chart: { ios: 'chart.bar', android: 'bar_chart' },
  trophy: { ios: 'trophy', android: 'emoji_events' },
  settings: { ios: 'gearshape', android: 'settings' },
  arrow: { ios: 'arrow.right', android: 'arrow_forward' },
  back: { ios: 'chevron.left', android: 'arrow_back' },
  chevron: { ios: 'chevron.right', android: 'chevron_right' },
  check: { ios: 'checkmark', android: 'check' },
  close: { ios: 'xmark', android: 'close' },
  search: { ios: 'magnifyingglass', android: 'search' },
  flame: { ios: 'flame', android: 'local_fire_department' },
  target: { ios: 'target', android: 'ads_click' },
  flag: { ios: 'flag', android: 'flag' },
  spark: { ios: 'sparkles', android: 'auto_awesome' },
  clock: { ios: 'clock', android: 'schedule' },
  sound: { ios: 'speaker.wave.2', android: 'volume_up' },
  refresh: { ios: 'arrow.clockwise', android: 'refresh' },
  logout: { ios: 'rectangle.portrait.and.arrow.right', android: 'logout' },
  lock: { ios: 'lock', android: 'lock' },
  info: { ios: 'info.circle', android: 'info' },
  route: { ios: 'map', android: 'route' },
  bell: { ios: 'bell', android: 'notifications' },
  play: { ios: 'play.fill', android: 'play_arrow' },
  eye: { ios: 'eye', android: 'visibility' },
  'eye-off': { ios: 'eye.slash', android: 'visibility_off' },
  mic: { ios: 'mic', android: 'mic' },
  plus: { ios: 'plus', android: 'add' },
  user: { ios: 'person', android: 'person' },
  users: { ios: 'person.2', android: 'group' },
  headphones: { ios: 'headphones', android: 'headphones' },
  pencil: { ios: 'pencil', android: 'edit' },
  heart: { ios: 'heart', android: 'favorite' },
  share: { ios: 'square.and.arrow.up', android: 'share' },
  trash: { ios: 'trash', android: 'delete' },
  crown: { ios: 'crown', android: 'workspace_premium' },
  grid: { ios: 'square.grid.2x2', android: 'grid_view' },
  calendar: { ios: 'calendar', android: 'calendar_month' },
  shield: { ios: 'shield', android: 'shield' },
  mail: { ios: 'envelope', android: 'mail' },
  history: { ios: 'clock.arrow.circlepath', android: 'history' },
  message: { ios: 'message', android: 'chat' },
  sun: { ios: 'sun.max', android: 'light_mode' },
} as const satisfies Record<string, SymbolViewProps['name']>;

export type IconName = keyof typeof ICONS;

export function Icon({
  name,
  size = 20,
  color = 'text',
}: {
  name: IconName;
  size?: number;
  color?: ThemeColor;
}) {
  const theme = useTheme();
  return <SymbolView name={ICONS[name]} size={size} tintColor={theme[color]} />;
}
