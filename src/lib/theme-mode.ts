import { useSyncExternalStore } from 'react';
import { Appearance, useColorScheme as useSystemColorScheme } from 'react-native';
import Storage from 'expo-sqlite/kv-store';

/**
 * Nút sáng/tối như `ThemeToggle` của web: chưa bấm lần nào thì theo máy; bấm rồi thì nhớ lựa chọn
 * (web lưu `localStorage` `hanni-theme`). Android/iOS đổi qua `Appearance` nên mọi `useColorScheme()` đều theo;
 * react-native-web không có `Appearance.setColorScheme` nên bản web giữ lựa chọn ở `forced` dưới đây.
 */
const KEY = 'hanni-theme';
type Mode = 'light' | 'dark';

const canSetAppearance = typeof Appearance.setColorScheme === 'function';
let forced: Mode | null = null;
const listeners = new Set<() => void>();

function apply(mode: Mode) {
  if (canSetAppearance) {
    Appearance.setColorScheme(mode);
    return;
  }
  forced = mode;
  listeners.forEach((l) => l());
}

/** Thay cho `useColorScheme` của react-native — có tính cả lựa chọn đã bấm trên bản web. */
export function useColorScheme() {
  const system = useSystemColorScheme();
  const mode = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => forced,
    () => forced,
  );
  return mode ?? system;
}

export function restoreThemeMode() {
  try {
    const saved = Storage.getItemSync(KEY);
    if (saved === 'light' || saved === 'dark') apply(saved);
  } catch {
    // Không đọc được thì theo máy.
  }
}

export function setThemeMode(mode: Mode) {
  apply(mode);
  try {
    Storage.setItemSync(KEY, mode);
  } catch {
    // Chỉ là tuỳ chọn hiển thị.
  }
}
