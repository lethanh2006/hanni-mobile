import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import Storage from 'expo-sqlite/kv-store';
import { Platform } from 'react-native';

/**
 * Nhắc học hằng ngày trên điện thoại. Web nhận nhắc qua web push (server gửi đúng `reminderHour` vào những ngày chưa
 * đạt mục tiêu); server chưa gửi được tới app nên app tự đặt lịch thông báo trên máy: đúng `reminderHour` (lưu ở server,
 * dùng chung với web) theo múi giờ học tập, 7 ngày tới, bỏ qua hôm nay nếu đã đạt mục tiêu — mỗi lần mở app đặt lại.
 */

const ENABLED_KEY = 'hanni:reminders-on';
const DAYS_AHEAD = 7;
const CHANNEL = 'nhac-hoc';
/** Câu nhắc — cùng câu với lời nhắc trong tệp lịch học (.ics) của web. */
const CONTENT = { title: 'Hanni', body: 'Đến giờ học tiếng Trung rồi!', data: { url: '/' } };

export const remindersSupported = Platform.OS !== 'web';

export function remindersEnabled(): boolean {
  try {
    return Storage.getItemSync(ENABLED_KEY) === '1';
  } catch {
    return false;
  }
}

function setEnabled(on: boolean) {
  try {
    Storage.setItemSync(ENABLED_KEY, on ? '1' : '0');
  } catch {
    // không lưu được thì thôi
  }
}

/** Đã bị từ chối quyền và máy không cho hỏi lại — khỏi mời bật nữa. */
export async function permissionBlocked(): Promise<boolean> {
  if (!remindersSupported) return true;
  const p = await Notifications.getPermissionsAsync();
  return !p.granted && !p.canAskAgain;
}

async function ensurePermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  return (await Notifications.requestPermissionsAsync()).granted;
}

async function ensureChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL, {
    name: 'Nhắc học',
    importance: AndroidImportance.HIGH,
  });
}

/** Chênh lệch (ms) giữa giờ ở múi `tz` và giờ UTC tại thời điểm `t`. */
function zoneOffset(t: number, tz: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(t));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second')) - t;
}

/** Các lần nhắc sắp tới: `hour`:00 theo múi `tz`, từ hôm nay (hoặc mai nếu `skipToday`) trong `DAYS_AHEAD` ngày. */
function upcoming(hour: number, tz: string, skipToday: boolean): Date[] {
  const now = Date.now();
  let zone = tz;
  try {
    zoneOffset(now, zone);
  } catch {
    zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  }
  const local = new Date(now + zoneOffset(now, zone));
  const out: Date[] = [];
  for (let i = skipToday ? 1 : 0; i < DAYS_AHEAD + 1 && out.length < DAYS_AHEAD; i++) {
    const guess = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() + i, hour);
    let at = guess - zoneOffset(guess, zone);
    const fixed = guess - zoneOffset(at, zone);
    if (fixed !== at) at = fixed;
    if (at > now + 60_000) out.push(new Date(at));
  }
  return out;
}

/**
 * Đặt lại lịch nhắc theo `reminderHour` (`null` = không nhắc). `goalMetToday`: đã đạt mục tiêu hôm nay thì bỏ lần nhắc
 * hôm nay, như server chỉ nhắc vào ngày chưa đạt.
 */
export async function scheduleReminders(reminderHour: number | null, timezone: string, goalMetToday: boolean) {
  if (!remindersSupported) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!remindersEnabled() || reminderHour === null) return;
  if (!(await Notifications.getPermissionsAsync()).granted) return;
  await ensureChannel();
  for (const date of upcoming(reminderHour, timezone, goalMetToday)) {
    await Notifications.scheduleNotificationAsync({
      content: CONTENT,
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date, channelId: CHANNEL },
    });
  }
}

/** "Bật thông báo": xin quyền rồi ghi nhớ đã bật trên máy này. */
export async function enableReminders() {
  if (!remindersSupported) throw new Error('Thiết bị này không hỗ trợ thông báo.');
  if (!(await ensurePermission())) throw new Error('Bạn chưa cấp quyền thông báo cho Hanni.');
  setEnabled(true);
}

/** "Tắt thông báo" trên máy này. */
export async function disableReminders() {
  setEnabled(false);
  if (remindersSupported) await Notifications.cancelAllScheduledNotificationsAsync();
}

/** "Gửi thử": hiện ngay một thông báo nhắc để xem nó trông thế nào. */
export async function sendTestReminder() {
  await ensureChannel();
  await Notifications.scheduleNotificationAsync({ content: CONTENT, trigger: Platform.OS === 'android' ? { channelId: CHANNEL } : null });
}
