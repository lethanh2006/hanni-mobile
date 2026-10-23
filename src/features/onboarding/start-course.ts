import { router } from 'expo-router';
import { mutate } from 'swr';

import { api } from '@/lib/api';

/**
 * "Học cấp N" (trang `/bat-dau` của web).
 * - Đã đăng nhập: lưu cấp lộ trình rồi về Trang chủ, không bắt học lại bài 1.
 * - Khách: vào thẳng bài 1 của cấp — học trước, đăng ký sau.
 */
export async function startCourse(level: number, loggedIn: boolean) {
  const safeLevel = Math.min(Math.max(level || 1, 1), 7);
  if (loggedIn) {
    await api.patch('/users/me/settings', { courseLevel: safeLevel }).catch(() => undefined);
    void mutate((key) => typeof key === 'string' && key.startsWith('/learn'));
    router.dismissTo('/');
    return;
  }
  try {
    const lesson = await api.get<{ id: string }>(`/learn/start?level=${safeLevel}`);
    router.replace(`/bai-hoc/${lesson.id}`);
  } catch {
    router.dismissTo('/');
  }
}
