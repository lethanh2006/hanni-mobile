import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Linking, Pressable, Share, StyleSheet, View } from 'react-native';

import { AppText, Button, Card, Icon, IconTile, ProgressBar } from '@/components/ui';
import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { deleteClassroom, dueLabel, inviteUrl, removeAssignment, type ClassDetail } from '@/lib/classrooms';
import { appHref } from '@/lib/notifications';
import { pairs } from '@/lib/pairs';

import { AddAssignmentForm } from './add-assignment-form';
import { MembersPanel } from './members-panel';

type OwnerData = Extract<ClassDetail, { role: 'owner' }>;

/**
 * Trang lớp của giáo viên (`TeacherView` của web, thứ tự điện thoại): mời học viên, 4 ô tóm tắt, tiến độ học viên
 * lên trước rồi mới tới giao bài + bài đã giao, "Xoá lớp này" để cuối trang.
 */
export function OwnerView({ data }: { data: OwnerData }) {
  const theme = useTheme();
  const [busy, setBusy] = useState(false);

  function confirmDelete() {
    Alert.alert(
      `Xoá lớp "${data.class.name}"?`,
      'Học viên sẽ rời lớp, bài đã giao bị xoá (tiến độ học của họ vẫn giữ).',
      [
        { text: 'Huỷ', style: 'cancel' },
        {
          text: 'Xoá lớp',
          style: 'destructive',
          onPress: async () => {
            setBusy(true);
            await deleteClassroom(data.class.id);
            router.replace('/lop-hoc');
          },
        },
      ],
    );
  }

  return (
    <>
      <InvitePanel data={data} />
      <View style={styles.grid}>
        {pairs([
          { label: 'Học viên', value: data.members.length, hint: 'đã vào lớp' },
          { label: 'Học tuần này', value: `${data.summary.activeThisWeek}/${data.members.length}`, hint: 'có học trong 7 ngày' },
          { label: 'Phút học TB', value: data.summary.avgMinutes7d, hint: 'mỗi học viên, 7 ngày' },
          { label: 'Bài đã giao', value: data.assignments.length, hint: 'bài học + đề thi thử' },
        ]).map((row) => (
          <View key={row[0].label} style={styles.gridRow}>
            {row.map((s) => (
              <Card key={s.label} style={styles.summary}>
                <AppText variant="caption" weight="500" color="muted">
                  {s.label}
                </AppText>
                <AppText weight="800" style={styles.summaryValue}>
                  {s.value}
                </AppText>
                <AppText variant="caption" color="muted">
                  {s.hint}
                </AppText>
              </Card>
            ))}
          </View>
        ))}
      </View>
      <MembersPanel data={data} />
      <AddAssignmentForm classId={data.class.id} classLevel={data.class.hskLevel} />
      <AssignmentList data={data} />
      <View style={[styles.danger, { borderColor: theme.border }]}>
        <Button title="Xoá lớp này" leftIcon="trash" variant="ghost" disabled={busy} onPress={confirmDelete} style={styles.self} />
      </View>
    </>
  );
}

/** Khối "Mời học viên": mã lớp to, đường dẫn mời, 3 cách gửi (chia sẻ, chép, Google Classroom). */
function InvitePanel({ data }: { data: OwnerData }) {
  const theme = useTheme();
  const [copied, setCopied] = useState(false);
  const url = inviteUrl(data.class.code);
  const shareText = `Vào lớp "${data.class.name}" trên Hanni để học tiếng Trung cùng lớp — mã lớp ${data.class.code}`;

  async function copy() {
    await Clipboard.setStringAsync(`${shareText}: ${url}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card style={styles.invite}>
      <View style={styles.codeBox}>
        <AppText variant="caption" weight="600" color="muted" style={styles.codeLabel}>
          MÃ LỚP
        </AppText>
        <AppText weight="800" color="primary" style={styles.code}>
          {data.class.code}
        </AppText>
      </View>
      <AppText color="muted" style={styles.inviteText}>
        Học viên mở đường dẫn (hoặc nhập mã ở <AppText weight="700">Tài khoản → Lớp học</AppText>) là vào lớp. Bài bạn
        giao hiện ngay ở Trang chủ của họ.
      </AppText>
      <View style={[styles.url, { backgroundColor: theme.surface2 }]}>
        <AppText variant="caption" numberOfLines={1} style={styles.mono}>
          {url}
        </AppText>
      </View>
      <View style={styles.actions}>
        <Button
          title="Gửi cho học viên"
          leftIcon="share"
          onPress={() => void Share.share({ title: data.class.name, message: `${shareText}: ${url}` })}
        />
        <Button
          title={copied ? 'Đã chép' : 'Chép đường dẫn'}
          leftIcon={copied ? 'check' : 'copy'}
          variant="secondary"
          onPress={() => void copy()}
        />
        {/* "Chia sẻ lên Classroom" bằng đường dẫn của Google — không cần khoá API. */}
        <Button
          title="Google Classroom"
          leftIcon="book"
          variant="secondary"
          onPress={() =>
            void Linking.openURL(
              `https://classroom.google.com/share?url=${encodeURIComponent(url)}&title=${encodeURIComponent(`Vào lớp ${data.class.name} trên Hanni`)}`,
            )
          }
        />
      </View>
    </Card>
  );
}

/** "Bài đã giao": mỗi bài có tiến độ cả lớp, xem ai chưa làm, xoá bài giao. */
function AssignmentList({ data }: { data: OwnerData }) {
  const theme = useTheme();
  const [open, setOpen] = useState<string | null>(null);
  const names = new Map(data.members.map((m) => [m.id, m.displayName]));
  if (data.assignments.length === 0) {
    return (
      <Card>
        <AppText color="muted">
          Chưa giao bài nào. Giao một bài học là cách nhanh nhất để cả lớp bắt đầu — học viên thấy bài ngay ở Trang chủ.
        </AppText>
      </Card>
    );
  }
  const total = data.members.length;
  return (
    <Card style={styles.assignments}>
      <AppText weight="700" style={styles.assignmentsTitle}>
        Bài đã giao
      </AppText>
      {data.assignments.map((a, i) => {
        const due = dueLabel(a.dueAt);
        const pending = data.members.filter((m) => !a.doneUserIds.includes(m.id));
        return (
          <View
            key={a.id}
            style={[
              styles.assignment,
              i > 0 && { borderTopWidth: 1, borderColor: theme.border, paddingTop: 12 },
              i < data.assignments.length - 1 && { paddingBottom: 12 },
            ]}>
            <IconTile size={36} style={styles.assignmentIcon}>
              <Icon name={a.kind === 'LESSON' ? 'cards' : 'target'} size={16} color="muted" />
            </IconTile>
            <View style={styles.flex}>
              <Pressable onPress={() => router.push(appHref(a.href, '/lop-hoc'))}>
                <AppText weight="600">{a.label}</AppText>
              </Pressable>
              <AppText variant="caption" color="muted" style={styles.assignmentMeta}>
                {a.doneCount}/{total} đã xong
                {due && <AppText variant="caption" color={due.overdue ? 'danger' : 'muted'}>{` · ${due.text}`}</AppText>}
              </AppText>
              <View style={styles.assignmentBar}>
                <ProgressBar value={total ? (a.doneCount / total) * 100 : 0} color="good" />
              </View>
              {pending.length > 0 && total > 0 && (
                <Pressable onPress={() => setOpen(open === a.id ? null : a.id)} style={styles.pendingToggle} hitSlop={4}>
                  <AppText variant="caption" weight="600" color="primary">
                    {open === a.id ? 'Ẩn' : `Xem ${pending.length} bạn chưa làm`}
                  </AppText>
                </Pressable>
              )}
              {open === a.id && (
                <AppText variant="caption" color="muted" style={styles.pending}>
                  {pending.map((m) => names.get(m.id)).join(', ')}
                </AppText>
              )}
            </View>
            <Pressable
              accessibilityLabel="Xoá bài giao"
              onPress={() =>
                Alert.alert(`Xoá bài giao "${a.label}"?`, undefined, [
                  { text: 'Huỷ', style: 'cancel' },
                  { text: 'Xoá', style: 'destructive', onPress: () => void removeAssignment(data.class.id, a.id) },
                ])
              }
              style={({ pressed }) => [styles.trash, pressed && { backgroundColor: theme.surface2 }]}>
              <Icon name="trash" size={15} color="muted" />
            </Pressable>
          </View>
        );
      })}
    </Card>
  );
}

const styles = StyleSheet.create({
  invite: { gap: 20 },
  codeBox: { alignItems: 'center' },
  codeLabel: { letterSpacing: 0.3 },
  code: { marginTop: 4, fontFamily: Fonts.mono, fontSize: 36, lineHeight: 40, letterSpacing: 9 },
  inviteText: { lineHeight: 24 },
  url: { marginTop: -8, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  mono: { fontFamily: Fonts.mono },
  actions: { marginTop: -8, gap: 8 },
  grid: { gap: 12 },
  gridRow: { flexDirection: 'row', gap: 12 },
  summary: { flex: 1, minWidth: 0, padding: 16, gap: 0 },
  summaryValue: { marginTop: 4, fontSize: 24, lineHeight: 32, letterSpacing: -0.6 },
  assignments: { gap: 0 },
  assignmentsTitle: { marginBottom: 12, fontSize: 16, lineHeight: 24 },
  assignment: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  assignmentIcon: { marginTop: 2 },
  flex: { flex: 1, minWidth: 0 },
  assignmentMeta: { marginTop: 2 },
  assignmentBar: { marginTop: 8 },
  pendingToggle: { marginTop: 6, alignSelf: 'flex-start' },
  pending: { marginTop: 4, lineHeight: 20 },
  trash: { padding: 8, borderRadius: 8 },
  danger: { borderTopWidth: 1, paddingTop: 16 },
  self: { alignSelf: 'flex-start' },
});
