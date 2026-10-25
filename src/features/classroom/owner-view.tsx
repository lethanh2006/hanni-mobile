import { router } from 'expo-router';
import { Alert, Share, StyleSheet, View } from 'react-native';

import { AppText, Avatar, Button, Card, SectionTitle, TextLink } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { StatGrid } from '@/features/progress/stat-grid';
import { useTheme } from '@/hooks/use-theme';
import { deleteClassroom, dueLabel, inviteUrl, removeAssignment, type ClassDetail } from '@/lib/classrooms';
import { hskLabel } from '@/lib/hsk';

import { AddAssignmentForm } from './add-assignment-form';

type OwnerData = Extract<ClassDetail, { role: 'owner' }>;

/** Trang lớp của giáo viên: mã mời, tóm tắt, giao bài, bài đã giao, tiến độ từng học viên, xoá lớp. */
export function OwnerView({ data }: { data: OwnerData }) {
  const theme = useTheme();
  const c = data.class;

  function invite() {
    void Share.share({
      message: `Mời bạn vào lớp "${c.name}" trên Hanni. Mã lớp: ${c.code} — hoặc mở link: ${inviteUrl(c.code)}`,
    });
  }

  function confirmDelete() {
    Alert.alert('Xoá lớp này?', 'Học viên sẽ rời lớp, bài đã giao bị xoá. Tiến độ học của từng người vẫn giữ nguyên.', [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Xoá lớp',
        style: 'destructive',
        onPress: () => void deleteClassroom(c.id).then(() => router.back()),
      },
    ]);
  }

  return (
    <>
      <Card style={{ backgroundColor: theme.primarySoft, borderColor: theme.primarySoft }}>
        <AppText variant="label" color="primary">
          Mã lớp
        </AppText>
        <AppText style={styles.code}>{c.code}</AppText>
        <AppText variant="small" color="muted">
          Học viên nhập mã này ở mục Lớp học, hoặc mở link mời.
        </AppText>
        <Button title="Gửi cho học viên" icon="share" onPress={invite} />
      </Card>

      <StatGrid
        stats={[
          { label: 'Học viên', value: c.memberCount, icon: 'users', color: 'lavender' },
          { label: 'Học tuần này', value: data.summary.activeThisWeek, icon: 'flame', color: 'danger' },
          { label: 'Phút học TB (7 ngày)', value: Math.round(data.summary.avgMinutes7d), icon: 'clock', color: 'primary' },
          { label: 'Bài đã giao', value: data.assignments.length, icon: 'flag', color: 'accent' },
        ]}
      />

      <AddAssignmentForm classId={c.id} classLevel={c.hskLevel} />

      {data.assignments.length > 0 && (
        <Card>
          <SectionTitle title="Bài đã giao" />
          {data.assignments.map((a) => {
            const due = dueLabel(a.dueAt);
            return (
              <View key={a.id} style={[styles.row, { borderColor: theme.border }]}>
                <View style={styles.flex}>
                  <AppText variant="small" bold>
                    {a.label}
                  </AppText>
                  <AppText variant="caption" color={due?.overdue ? 'danger' : 'muted'}>
                    {a.doneCount}/{c.memberCount} bạn đã làm{due ? ` · ${due.text}` : ''}
                  </AppText>
                </View>
                <TextLink title="Gỡ" color="muted" onPress={() => void removeAssignment(c.id, a.id)} />
              </View>
            );
          })}
        </Card>
      )}

      <Card>
        <SectionTitle title="Tiến độ học viên" />
        {data.members.length === 0 ? (
          <AppText variant="small" color="muted">
            Chưa có học viên — gửi mã lớp để mọi người vào.
          </AppText>
        ) : (
          data.members.map((m) => (
            <View key={m.id} style={[styles.row, { borderColor: theme.border }]}>
              <Avatar user={m} size={32} />
              <View style={styles.flex}>
                <AppText variant="small" bold>
                  {m.displayName}
                </AppText>
                <AppText variant="caption" color="muted">
                  🔥 {m.currentStreak} ngày · {m.minutes7d} phút/7 ngày · {m.lessonsCompleted} bài · {m.wordsStudied} từ
                  {m.bestExam ? ` · đề tốt nhất ${m.bestExam.score}/${m.bestExam.maxScore}` : ''}
                </AppText>
              </View>
            </View>
          ))
        )}
      </Card>

      <AppText variant="caption" color="muted">
        {c.hskLevel ? `${hskLabel(c.hskLevel)} · ` : ''}Tạo ngày {new Date(c.createdAt).toLocaleDateString('vi-VN')}
      </AppText>
      <Button title="Xoá lớp này" icon="trash" variant="danger" onPress={confirmDelete} />
    </>
  );
}

const styles = StyleSheet.create({
  code: { fontSize: 36, lineHeight: 44, fontWeight: '800', letterSpacing: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, borderTopWidth: 1, paddingTop: Spacing.sm },
  flex: { flex: 1, gap: 2 },
});
