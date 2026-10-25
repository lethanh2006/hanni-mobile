import { Stack } from 'expo-router';
import { useState } from 'react';

import { Card, EmptyState, Loading, Screen, TextLink } from '@/components/ui';
import { groupRows, NotificationRow } from '@/features/notifications/notification-row';
import { useRequireAuth } from '@/lib/auth';
import { markAllNotificationsRead, useNotifications } from '@/lib/notifications';

/** Thông báo: huy hiệu, bài giao của lớp, kết quả giải đấu tuần, lá chắn giữ chuỗi. */
export default function NotificationsScreen() {
  const { user } = useRequireAuth();
  const { data, mutate } = useNotifications();
  const [refreshing, setRefreshing] = useState(false);
  const rows = groupRows(data?.items ?? []);

  async function onRefresh() {
    setRefreshing(true);
    await mutate();
    setRefreshing(false);
  }

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      <Stack.Screen
        options={{
          title: 'Thông báo',
          headerRight: () =>
            data && data.unreadCount > 0 ? (
              <TextLink title="Đọc hết" onPress={() => void markAllNotificationsRead()} />
            ) : null,
        }}
      />
      {!user || !data ? (
        <Loading />
      ) : rows.length === 0 ? (
        <EmptyState
          title="Chưa có thông báo"
          description="Hanni báo ở đây khi bạn đạt huy hiệu, có bài tập mới từ lớp học, có kết quả giải đấu tuần hoặc khi lá chắn giữ chuỗi cho bạn."
        />
      ) : (
        <Card>
          {rows.map((row) => (
            <NotificationRow key={row[0].id} row={row} />
          ))}
        </Card>
      )}
    </Screen>
  );
}
