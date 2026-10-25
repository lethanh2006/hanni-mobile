import { router } from 'expo-router';
import { Alert, StyleSheet, View } from 'react-native';

import { AppText, Avatar, Button, Card, SectionTitle } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { dueLabel, leaveClassroom, type ClassDetail } from '@/lib/classrooms';
import { appHref } from '@/lib/notifications';

type MemberData = Extract<ClassDetail, { role: 'member' }>;

/** Trang lớp của học viên: bài được giao, phút học tuần của cả lớp, rời lớp. */
export function MemberView({ data }: { data: MemberData }) {
  const theme = useTheme();
  const c = data.class;
  const classmates = [...data.classmates].sort((a, b) => b.minutes7d - a.minutes7d);

  function confirmLeave() {
    Alert.alert('Rời lớp?', 'Bạn sẽ không nhận bài giao của lớp này nữa. Tiến độ học của bạn vẫn giữ nguyên.', [
      { text: 'Ở lại', style: 'cancel' },
      { text: 'Rời lớp', style: 'destructive', onPress: () => void leaveClassroom(c.id).then(() => router.back()) },
    ]);
  }

  return (
    <>
      <Card>
        <View style={styles.row}>
          <Avatar user={c.teacher} size={40} />
          <View style={styles.flex}>
            <AppText variant="caption" color="muted">
              Giáo viên
            </AppText>
            <AppText bold>{c.teacher.displayName}</AppText>
          </View>
        </View>
        <AppText variant="caption" color="muted">
          Giáo viên thấy chuỗi ngày, phút học trong tuần, số bài đã học và điểm đề thi của bạn.
        </AppText>
      </Card>

      <Card>
        <SectionTitle title="Bài tập" />
        {data.assignments.length === 0 ? (
          <AppText variant="small" color="muted">
            Giáo viên chưa giao bài nào.
          </AppText>
        ) : (
          data.assignments.map((a) => {
            const due = dueLabel(a.dueAt);
            return (
              <View key={a.id} style={[styles.row, { borderColor: theme.border }, styles.line]}>
                <View style={styles.flex}>
                  <AppText variant="small" bold>
                    {a.label}
                  </AppText>
                  <AppText variant="caption" color={a.done ? 'good' : due?.overdue ? 'danger' : 'muted'}>
                    {a.done ? '✓ Đã làm' : (due?.text ?? 'Không có hạn')}
                  </AppText>
                </View>
                {!a.done && <Button title="Làm ngay" onPress={() => router.push(appHref(a.href, '/'))} />}
              </View>
            );
          })
        )}
      </Card>

      <Card>
        <SectionTitle title="Cả lớp tuần này" />
        {classmates.map((m) => (
          <View key={m.id} style={[styles.row, m.isMe && { backgroundColor: theme.primarySoft }, styles.mate]}>
            <Avatar user={m} size={28} />
            <AppText variant="small" bold style={styles.flex}>
              {m.isMe ? `${m.displayName} (bạn)` : m.displayName}
            </AppText>
            <AppText variant="caption" color="muted">
              🔥 {m.currentStreak} · {m.minutes7d} phút
            </AppText>
          </View>
        ))}
      </Card>

      <Button title="Rời lớp" variant="ghost" onPress={confirmLeave} />
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  line: { borderTopWidth: 1, paddingTop: Spacing.sm },
  mate: { paddingVertical: 6, paddingHorizontal: Spacing.sm, borderRadius: 8 },
  flex: { flex: 1, gap: 2 },
});
