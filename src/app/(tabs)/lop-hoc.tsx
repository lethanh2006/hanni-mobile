import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Card, ErrorNote, Icon, Loading, PageHeader, Screen } from '@/components/ui';
import { alpha } from '@/constants/theme';
import { ClassList } from '@/features/classroom/class-list';
import { CreateClassForm } from '@/features/classroom/create-class-form';
import { JoinClassForm } from '@/features/classroom/join-class-form';
import { useTheme } from '@/hooks/use-theme';
import { useRequireAuth } from '@/lib/auth';
import { useMyClassrooms } from '@/lib/classrooms';

/** 4 bước của cả luồng — người mới vào trang (chưa có lớp nào) thấy ngay ai làm gì. */
const FLOW: { who: string; text: string }[] = [
  { who: 'Giáo viên', text: 'tạo lớp, nhận mã 6 ký tự' },
  { who: 'Giáo viên', text: 'gửi mã hoặc đường dẫn qua Zalo, Messenger' },
  { who: 'Học viên', text: 'vào lớp — bài được giao hiện ở Trang chủ' },
  { who: 'Giáo viên', text: 'xem ai đã làm bài, ai học đều mỗi ngày' },
];

/**
 * Lớp học (trang `/lop-hoc` của web): AI cũng tạo được lớp, người tạo là giáo viên của lớp đó. Đã có lớp thì danh sách
 * lớp lên đầu; luôn có 2 vai — học viên nhập mã, giáo viên mở lớp; người mới thấy thêm 4 bước của luồng.
 */
export default function ClassroomsScreen() {
  const theme = useTheme();
  const { user } = useRequireAuth();
  const { data, error, mutate } = useMyClassrooms();
  const [refreshing, setRefreshing] = useState(false);

  async function onRefresh() {
    setRefreshing(true);
    await mutate();
    setRefreshing(false);
  }

  const owned = data?.owned ?? [];
  const joined = data?.joined ?? [];
  const isNew = owned.length + joined.length === 0;

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh} contentStyle={styles.page}>
      <PageHeader
        icon="users"
        title="Lớp học"
        description="Vào lớp của giáo viên bằng mã, hoặc tự mở lớp để giao bài — miễn phí."
      />
      {!user || (!data && !error) ? (
        <Loading />
      ) : (
        <>
          {error && <ErrorNote>Chưa tải được danh sách lớp.</ErrorNote>}
          <ClassList owned={owned} joined={joined} />

          <Card style={styles.card}>
            <View>
              <AppText variant="label">{isNew ? 'Học viên' : 'Vào thêm lớp'}</AppText>
              <AppText weight="700" style={styles.title}>
                Có mã lớp từ giáo viên?
              </AppText>
              <AppText color="muted" style={styles.desc}>
                Nhập mã 6 ký tự giáo viên gửi qua Zalo, Messenger.
              </AppText>
            </View>
            <JoinClassForm />
            <View style={styles.note}>
              <Icon name="info" size={14} color="muted" />
              <AppText variant="caption" color="muted" style={styles.flex}>
                Vào lớp thì giáo viên thấy chuỗi ngày, phút học, bài đã xong, điểm thi thử của bạn — không thấy email.
              </AppText>
            </View>
          </Card>

          <Card style={styles.card}>
            <View>
              <AppText variant="label">{isNew ? 'Giáo viên' : 'Mở thêm lớp'}</AppText>
              <AppText weight="700" style={styles.title}>
                Dạy tiếng Trung? Mở lớp miễn phí
              </AppText>
              <AppText color="muted" style={styles.desc}>
                Giao bài từ lộ trình HSK hoặc đề thi thử, xem ai đã làm, ai học đều.
              </AppText>
            </View>
            <CreateClassForm />
          </Card>

          {isNew && (
            <View style={[styles.flow, { borderColor: theme.border }]}>
              <AppText weight="700">Lớp học hoạt động thế nào</AppText>
              <View style={styles.steps}>
                {FLOW.map((step, i) => (
                  <View key={step.text} style={styles.step}>
                    <View style={[styles.no, { backgroundColor: alpha(theme.primary, 0.1) }]}>
                      <AppText variant="caption" weight="700" color="primary">
                        {i + 1}
                      </AppText>
                    </View>
                    <AppText style={styles.flex}>
                      <AppText weight="600">{step.who}:</AppText> {step.text}
                    </AppText>
                  </View>
                ))}
              </View>
            </View>
          )}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { gap: 28 },
  card: { gap: 16 },
  title: { marginTop: 4, fontSize: 18, lineHeight: 26 },
  desc: { marginTop: 4, lineHeight: 24 },
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  flex: { flex: 1, minWidth: 0, lineHeight: 20 },
  flow: { borderWidth: 1, borderRadius: 16, padding: 16 },
  steps: { marginTop: 12, gap: 12 },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  no: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
