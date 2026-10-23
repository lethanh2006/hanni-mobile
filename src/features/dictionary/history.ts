import Storage from 'expo-sqlite/kv-store';

/** Từ đã mở gần đây — lưu trên máy (như localStorage `hanni:dict-history` của web). */
const KEY = 'hanni:dict-history';
const MAX = 12;

export interface HistoryItem {
  /** chữ giản thể */
  s: string;
  /** pinyin */
  p: string;
  /** nghĩa ngắn */
  m: string | null;
}

export function readHistory(): HistoryItem[] {
  try {
    const parsed: unknown = JSON.parse(Storage.getItemSync(KEY) ?? '[]');
    return Array.isArray(parsed) ? (parsed as HistoryItem[]).slice(0, MAX) : [];
  } catch {
    return [];
  }
}

export function rememberWord(item: HistoryItem) {
  const rest = readHistory().filter((h) => h.s !== item.s);
  Storage.setItemSync(KEY, JSON.stringify([item, ...rest].slice(0, MAX)));
}

export function clearHistory() {
  Storage.removeItemSync(KEY);
}
