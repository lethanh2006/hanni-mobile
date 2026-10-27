import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect } from 'react';
import useSWR from 'swr';

import { useAuth } from '@/lib/auth';
import { useStreak } from '@/lib/hooks';
import { remindersSupported, scheduleReminders } from '@/lib/reminders';
import type { UserSettings } from '@/lib/types';

if (remindersSupported) {
  // App đang mở thì vẫn hiện thông báo nhắc.
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
  });
}

/**
 * Giữ lịch nhắc học trên máy khớp với cài đặt: đổi giờ nhắc, đổi múi giờ, đạt mục tiêu hôm nay, mở lại app (SWR tự tải
 * lại khi app quay về) đều đặt lại. Đăng xuất thì huỷ. Bấm thông báo mở Trang chủ (web mở `/learn`).
 */
export function ReminderSync() {
  const { user } = useAuth();
  const settings = useSWR<UserSettings>(user && remindersSupported ? '/users/me/settings' : null);
  const streak = useStreak();
  const hour = settings.data?.reminderHour ?? null;
  const goalMet = streak.data?.goal.met ?? false;
  const timezone = user?.timezone ?? 'Asia/Ho_Chi_Minh';
  const ready = Boolean(user && settings.data);

  useEffect(() => {
    if (!remindersSupported) return;
    if (!user) {
      void Notifications.cancelAllScheduledNotificationsAsync().catch(() => undefined);
      return;
    }
    if (ready) void scheduleReminders(hour, timezone, goalMet).catch(() => undefined);
  }, [user, ready, hour, timezone, goalMet]);

  useEffect(() => {
    if (!remindersSupported) return;
    const sub = Notifications.addNotificationResponseReceivedListener(() => router.navigate('/'));
    return () => sub.remove();
  }, []);

  return null;
}
