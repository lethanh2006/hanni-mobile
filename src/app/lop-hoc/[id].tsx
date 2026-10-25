import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { Button, EmptyState, Loading, Screen } from '@/components/ui';
import { MemberView } from '@/features/classroom/member-view';
import { OwnerView } from '@/features/classroom/owner-view';
import { useRequireAuth } from '@/lib/auth';
import { useClassroom } from '@/lib/classrooms';
import { goBack } from '@/lib/navigation';

/** Trang 1 lớp — giáo viên và học viên thấy 2 giao diện khác nhau. */
export default function ClassroomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useRequireAuth();
  const { data, error, mutate } = useClassroom(id);
  const [refreshing, setRefreshing] = useState(false);

  async function onRefresh() {
    setRefreshing(true);
    await mutate();
    setRefreshing(false);
  }

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      <Stack.Screen options={{ title: data?.class.name ?? 'Lớp học' }} />
      {error ? (
        <EmptyState title="Không mở được lớp này" description="Có thể lớp đã bị xoá hoặc bạn không còn trong lớp.">
          <Button title="Quay lại" variant="secondary" onPress={goBack} />
        </EmptyState>
      ) : !user || !data ? (
        <Loading />
      ) : data.role === 'owner' ? (
        <OwnerView data={data} />
      ) : (
        <MemberView data={data} />
      )}
    </Screen>
  );
}
