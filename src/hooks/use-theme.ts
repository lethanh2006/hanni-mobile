import { Colors, type ThemeColors } from '@/constants/theme';
import { useColorScheme } from '@/lib/theme-mode';

/** Màu theo chế độ sáng/tối (của máy, hoặc lựa chọn ở nút sáng/tối). */
export function useTheme(): ThemeColors {
  return Colors[useColorScheme() === 'dark' ? 'dark' : 'light'];
}
