import { useSyncExternalStore } from 'react';

/**
 * Nút trợ lý tự lùi xuống khi cuộn xuống đọc, hiện lại khi cuộn lên (`useTuckOnScroll` của web) — để nút không đè lên
 * chữ, nút ở cuối thẻ. `Screen` báo vị trí cuộn vào đây.
 */
let last = 0;
let tucked = false;
const listeners = new Set<() => void>();

function set(next: boolean) {
  if (next === tucked) return;
  tucked = next;
  listeners.forEach((l) => l());
}

export function reportScroll(y: number) {
  if (Math.abs(y - last) < 12) return;
  set(y > last && y > 160);
  last = y;
}

/** Sang màn khác thì nút hiện lại (màn mới bắt đầu ở đầu trang). */
export function resetScroll() {
  last = 0;
  set(false);
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function useTucked() {
  return useSyncExternalStore(subscribe, () => tucked, () => false);
}
