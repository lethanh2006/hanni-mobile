import { Stack, useLocalSearchParams } from 'expo-router';
import useSWR from 'swr';

import { Button, EmptyState, Loading, Screen } from '@/components/ui';
import { SessionRunner } from '@/features/lesson/session-runner';
import { goBack } from '@/lib/navigation';
import type { LessonSession } from '@/lib/types';

/** Phiên học 1 bài — lõi học từ mới, dùng chung cho khách lẫn người đã đăng nhập. */
export default function LessonSessionScreen() {
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  // Server trộn câu hỏi ngẫu nhiên mỗi lần gọi — tải lại giữa chừng là đổi đề.
  const { data, error } = useSWR<LessonSession>(`/learn/lessons/${lessonId}/session`, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateIfStale: false,
  });

  return (
    <>
      <Stack.Screen options={{ headerShown: false, gestureEnabled: false }} />
      {error ? (
        <Screen safeTop>
          <EmptyState title="Chưa tải được bài học" description="Bạn kiểm tra kết nối rồi thử lại sau nhé.">
            <Button title="Về lộ trình" onPress={goBack} />
          </EmptyState>
        </Screen>
      ) : !data ? (
        <Screen safeTop>
          <Loading label="Đang chuẩn bị bài học…" />
        </Screen>
      ) : (
        <SessionRunner key={lessonId} session={data} />
      )}
    </>
  );
}
