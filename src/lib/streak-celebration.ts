/**
 * Kênh nhỏ báo VỪA cán một cột mốc chuỗi ngày học (1/3/7/30/100 ngày) — giống web.
 * `lib/notifications.ts` lọc thông báo mở khoá huy hiệu STREAK_* rồi phát qua đây,
 * màn ăn mừng (mount 1 lần ở layout gốc) nghe và hiện lên dù đang ở màn nào.
 */
type Listener = (streakDays: number) => void;

const listeners = new Set<Listener>();

export function announceStreakMilestone(streakDays: number) {
  for (const fn of listeners) fn(streakDays);
}

export function onStreakMilestone(fn: Listener) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
