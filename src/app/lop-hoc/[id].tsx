import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { Button, ErrorNote, Loading, Screen } from '@/components/ui';
import { ClassHeader } from '@/features/classroom/class-header';
import { MemberView } from '@/features/classroom/member-view';
import { OwnerView } from '@/features/classroom/owner-view';
import { errorMessage } from '@/lib/api';
import { useRequireAuth } from '@/lib/auth';
import { useClassroom } from '@/lib/classrooms';

/** Trang 1 lớp (`/lop-hoc/[id]` của web) — giáo viên và học viên thấy 2 giao diện khác nhau. */
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
      <Stack.Screen options={{ title: 'Lớp học' }} />
      {error ? (
        <>
          <ErrorNote>{errorMessage(error, 'Không mở được lớp này.')}</ErrorNote>
          <Button
            title="Về danh sách lớp"
            leftIcon="back"
            variant="secondary"
            onPress={() => router.navigate('/lop-hoc')}
            style={styles.self}
          />
        </>
      ) : !user || !data ? (
        <Loading />
      ) : (
        <>
          <ClassHeader data={data} />
          {data.role === 'owner' ? <OwnerView data={data} /> : <MemberView data={data} />}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  self: { alignSelf: 'flex-start' },
});
