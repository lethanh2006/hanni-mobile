import { Appearance } from 'react-native';
import Storage from 'expo-sqlite/kv-store';

/**
 * Nút sáng/tối như `ThemeToggle` của web: chưa bấm lần nào thì theo máy; bấm rồi thì nhớ lựa chọn
 * (web lưu `localStorage` `hanni-theme`). Đổi qua `Appearance` nên mọi `useColorScheme()` đều theo.
 */
const KEY = 'hanni-theme';

export function restoreThemeMode() {
  try {
    const saved = Storage.getItemSync(KEY);
    if (saved === 'light' || saved === 'dark') Appearance.setColorScheme(saved);
  } catch {
    // Không đọc được thì theo máy.
  }
}

export function setThemeMode(mode: 'light' | 'dark') {
  Appearance.setColorScheme(mode);
  try {
    Storage.setItemSync(KEY, mode);
  } catch {
    // Chỉ là tuỳ chọn hiển thị.
  }
}
