import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { AppText, Avatar, Button, Card, Icon } from '@/components/ui';
import { alpha } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { dueLabel, leaveClassroom, type ClassDetail } from '@/lib/classrooms';
import { appHref } from '@/lib/notifications';

type MemberData = Extract<ClassDetail, { role: 'member' }>;

/** Trang lớp của học viên (`StudentView` của web): bài tập của lớp, phút học tuần này của cả lớp, rời lớp. */
export function MemberView({ data }: { data: MemberData }) {
  const theme = useTheme();
  const [busy, setBusy] = useState(false);
  const pending = data.assignments.filter((a) => !a.done);
  const done = data.assignments.filter((a) => a.done);

  function confirmLeave() {
    Alert.alert(`Rời lớp "${data.class.name}"?`, undefined, [
      { text: 'Ở lại', style: 'cancel' },
      {
        text: 'Rời lớp',
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          await leaveClassroom(data.class.id);
          router.replace('/lop-hoc');
        },
      },
    ]);
  }

  return (
    <>
      <Card style={styles.panel}>
        <View style={styles.title}>
          <Icon name="flag" size={18} color="primary" />
          <AppText weight="700" style={styles.heading}>
            Bài tập của lớp
          </AppText>
        </View>
        {data.assignments.length === 0 ? (
          <AppText color="muted">Giáo viên chưa giao bài nào. Trong lúc chờ, cứ học tiếp lộ trình ở Trang chủ nhé.</AppText>
        ) : (
          <View style={styles.list}>
            {[...pending, ...done].map((a) => {
              const due = dueLabel(a.dueAt);
              return (
                <View
                  key={a.id}
                  style={[
                    styles.assignment,
                    a.done
                      ? { borderColor: theme.border, opacity: 0.7 }
                      : { borderColor: alpha(theme.primary, 0.25), backgroundColor: alpha(theme.primary, 0.04) },
                  ]}>
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: a.done ? alpha(theme.good, 0.15) : alpha(theme.primary, 0.1) },
                    ]}>
                    <Icon
                      name={a.done ? 'check' : a.kind === 'LESSON' ? 'cards' : 'target'}
                      size={15}
                      color={a.done ? 'good' : 'primary'}
                    />
                  </View>
                  <View style={styles.flex}>
                    <AppText weight="600">{a.label}</AppText>
                    <AppText variant="caption" color={due?.overdue && !a.done ? 'danger' : 'muted'}>
                      {a.done ? 'Đã xong' : due ? due.text : 'Không có hạn'}
                    </AppText>
                  </View>
                  {!a.done && (
                    <Button title="Làm ngay" onPress={() => router.push(appHref(a.href, '/'))} style={styles.go} />
                  )}
                </View>
              );
            })}
          </View>
        )}
      </Card>

      <Card style={styles.panel}>
        <View>
          <View style={styles.title}>
            <Icon name="trophy" size={18} color="primary" />
            <AppText weight="700" style={styles.heading}>
              Phút học tuần này
            </AppText>
          </View>
          <AppText variant="caption" color="muted" style={styles.sub}>
            7 ngày gần nhất, cả lớp.
          </AppText>
        </View>
        <View style={styles.board}>
          {data.classmates.map((m, i) => (
            <View key={m.id} style={[styles.mate, m.isMe && { backgroundColor: alpha(theme.primary, 0.08) }]}>
              <AppText variant="caption" weight="700" color="muted" style={styles.rank}>
                {i + 1}
              </AppText>
              <Avatar user={m} size={28} />
              <AppText weight="500" numberOfLines={1} style={styles.flex}>
                {m.displayName}
                {m.isMe && <AppText color="muted"> (bạn)</AppText>}
              </AppText>
              <View style={styles.streak}>
                <Icon name="flame" size={12} color="muted" />
                <AppText variant="caption" color="muted">
                  {m.currentStreak}
                </AppText>
              </View>
              <AppText weight="700" style={styles.minutes}>
                {m.minutes7d}′
              </AppText>
            </View>
          ))}
        </View>
      </Card>

      <View style={[styles.privacy, { borderColor: theme.border }]}>
        <AppText variant="caption" color="muted" style={styles.privacyText}>
          Giáo viên thấy tiến độ học của bạn trong lớp này (chuỗi ngày, phút học, bài đã xong, số từ, điểm thi thử) — không
          thấy email. Rời lớp là giáo viên không xem được nữa.
        </AppText>
        <Button title="Rời lớp" leftIcon="logout" variant="ghost" disabled={busy} onPress={confirmLeave} style={styles.leave} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  panel: { gap: 12 },
  heading: { fontSize: 16, lineHeight: 24 },
  title: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sub: { marginTop: 2 },
  list: { gap: 8 },
  assignment: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 12, padding: 12 },
  badge: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1, minWidth: 0 },
  go: { minHeight: 36, paddingHorizontal: 12, paddingVertical: 6 },
  board: { gap: 6 },
  mate: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 6 },
  rank: { width: 20, textAlign: 'center', fontVariant: ['tabular-nums'] },
  streak: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  minutes: { width: 56, textAlign: 'right', fontVariant: ['tabular-nums'] },
  privacy: { gap: 8, borderWidth: 1, borderRadius: 12, padding: 16 },
  privacyText: { lineHeight: 20 },
  leave: { alignSelf: 'flex-start' },
});
