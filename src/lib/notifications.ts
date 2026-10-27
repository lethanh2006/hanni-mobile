import type { Href } from 'expo-router';
import { useEffect } from 'react';
import { io, type Socket } from 'socket.io-client';
import useSWR, { mutate } from 'swr';

import { api, SERVER_ORIGIN } from './api';
import { useAuth } from './auth';
import { announceStreakMilestone } from './streak-celebration';
import type { AppNotification, NotificationsPage } from './types';

/** Mã huy hiệu chuỗi ngày dạng "STREAK_7". */
const STREAK_CODE = /^STREAK_(\d+)$/;

const KEY = '/notifications?pageSize=15';

export function useNotifications() {
  const { user } = useAuth();
  return useSWR<NotificationsPage>(user ? KEY : null);
}

function patchCache(patch: (current: NotificationsPage) => NotificationsPage) {
  void mutate<NotificationsPage>(KEY, (current) => (current ? patch(current) : current), { revalidate: false });
}

let socket: Socket | null = null;

/**
 * Kết nối WebSocket nhận thông báo realtime khi đã đăng nhập (mount 1 lần ở layout gốc).
 * Đăng xuất thì ngắt để lần đăng nhập sau bắt tay lại bằng cookie mới.
 * React Native gửi kèm cookie phiên khi mở WebSocket nên chỉ dùng transport `websocket`.
 */
export function useNotificationSocket() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      socket?.disconnect();
      socket = null;
      return;
    }
    socket ??= io(`${SERVER_ORIGIN}/notifications`, { transports: ['websocket'], withCredentials: true });
    const s = socket;

    function onNew(notification: AppNotification) {
      patchCache((current) => ({
        ...current,
        items: [notification, ...current.items].slice(0, current.pageSize),
        total: current.total + 1,
        unreadCount: current.unreadCount + 1,
      }));
      // Mở khoá huy hiệu CHUỖI NGÀY là cột mốc hiếm — có màn ăn mừng riêng.
      const match = notification.achievement ? STREAK_CODE.exec(notification.achievement.code) : null;
      if (match) announceStreakMilestone(Number(match[1]));
    }
    s.on('notification:new', onNew);
    return () => {
      s.off('notification:new', onNew);
    };
  }, [user]);
}

/** Đánh dấu đã đọc 1 dòng (dòng gộp nhiều huy hiệu thì nhiều id). */
export async function markNotificationsRead(ids: string[]) {
  if (ids.length === 0) return;
  const now = new Date().toISOString();
  patchCache((current) => {
    const fresh = current.items.filter((n) => ids.includes(n.id) && !n.readAt).length;
    return {
      ...current,
      items: current.items.map((n) => (ids.includes(n.id) && !n.readAt ? { ...n, readAt: now } : n)),
      unreadCount: Math.max(0, current.unreadCount - fresh),
    };
  });
  await Promise.all(ids.map((id) => api.patch(`/notifications/${id}/read`).catch(() => undefined)));
}

export async function markAllNotificationsRead() {
  patchCache((current) => ({
    ...current,
    items: current.items.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })),
    unreadCount: 0,
  }));
  await api.post('/notifications/read-all').catch(() => undefined);
}

/** Đầu đường dẫn các màn có trong app — link server soạn theo web mà app chưa có thì không mở. */
const APP_PREFIXES = [
  '/achievements', '/leaderboard', '/lop-hoc', '/progress', '/study', '/review', '/bai-hoc/', '/learn/',
  '/thi-thu-hsk', '/tu-dien', '/ngu-phap', '/listening', '/minigame', '/writing', '/roleplay', '/phien-am',
  '/settings', '/account', '/u/', '/bai-doc/', '/watch', '/pronunciation',
];

/**
 * Server soạn `href` theo đường dẫn của web ("/learn#giai-dau", "/lop-hoc/…").
 * Đổi sang màn tương ứng của app (bỏ phần neo `#…`); màn app chưa có thì dùng `fallback`.
 */
export function appHref(webHref: string | null, fallback: Href): Href {
  if (!webHref) return fallback;
  const path = webHref.split('#')[0];
  if (path === '/learn' || path === '/dashboard') return '/';
  return APP_PREFIXES.some((p) => path.startsWith(p)) ? (path as Href) : fallback;
}
