import { useColorScheme } from 'react-native';

import { Colors, type ThemeColors } from '@/constants/theme';

/** Màu theo chế độ sáng/tối của máy. */
export function useTheme(): ThemeColors {
  return Colors[useColorScheme() === 'dark' ? 'dark' : 'light'];
}
