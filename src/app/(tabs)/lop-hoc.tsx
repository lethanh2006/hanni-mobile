import { Stack } from 'expo-router';
import { useState } from 'react';

import { AppText, Loading, Screen } from '@/components/ui';
import { ClassList } from '@/features/classroom/class-list';
import { CreateClassForm } from '@/features/classroom/create-class-form';
import { JoinClassForm } from '@/features/classroom/join-class-form';
import { useRequireAuth } from '@/lib/auth';
import { useMyClassrooms } from '@/lib/classrooms';

/**
 * Lớp học: đã có lớp thì danh sách lớp lên đầu; luôn có 2 hành động rõ vai —
 * học viên nhập mã, giáo viên tạo lớp.
 */
export default function ClassroomsScreen() {
  const { user } = useRequireAuth();
  const { data, mutate } = useMyClassrooms();
  const [refreshing, setRefreshing] = useState(false);
  const hasClass = !!data && data.owned.length + data.joined.length > 0;

  async function onRefresh() {
    setRefreshing(true);
    await mutate();
    setRefreshing(false);
  }

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      <Stack.Screen options={{ title: 'Lớp học' }} />
      {!user || !data ? (
        <Loading />
      ) : (
        <>
          {hasClass ? (
            <ClassList owned={data.owned} joined={data.joined} />
          ) : (
            <AppText color="muted">
              Lớp học giúp giáo viên giao bài và xem tiến độ học viên. Ai có tài khoản Hanni cũng tạo được lớp.
            </AppText>
          )}
          <JoinClassForm />
          <CreateClassForm />
        </>
      )}
    </Screen>
  );
}
