import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { AppText, Avatar, Card, Icon, Select } from '@/components/ui';
import { alpha, Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { removeMember, type ClassDetail, type MemberStats } from '@/lib/classrooms';

type OwnerData = Extract<ClassDetail, { role: 'owner' }>;
type Sort = 'recent' | 'minutes' | 'lessons';

const SORTS: { value: Sort; label: string }[] = [
  { value: 'recent', label: 'Học gần nhất' },
  { value: 'minutes', label: 'Phút học tuần này' },
  { value: 'lessons', label: 'Bài đã xong' },
];

/** "hôm nay" / "hôm qua" / "5 ngày trước" từ ngày học cuối (yyyy-mm-dd, theo ngày học của người đó). */
function lastStudied(date: string | null) {
  if (!date) return 'Chưa học';
  const days = Math.round((Date.now() - new Date(`${date}T12:00:00+07:00`).getTime()) / 86_400_000);
  if (days <= 0) return 'Hôm nay';
  if (days === 1) return 'Hôm qua';
  return `${days} ngày trước`;
}

/** "Tiến độ học viên" (`Members` của web, bản điện thoại): thẻ từng người với 4 ô số, xếp theo 3 tiêu chí. */
export function MembersPanel({ data }: { data: OwnerData }) {
  const theme = useTheme();
  const [sort, setSort] = useState<Sort>('recent');
  const order = (m: MemberStats) =>
    sort === 'minutes'
      ? -m.minutes7d
      : sort === 'lessons'
        ? -m.lessonsCompleted
        : -(m.lastStudiedOn ? Date.parse(m.lastStudiedOn) : 0);
  const members = [...data.members].sort((a, b) => order(a) - order(b));

  function kick(m: MemberStats) {
    Alert.alert(`Cho ${m.displayName} rời lớp?`, 'Tiến độ học của bạn ấy vẫn giữ nguyên.', [
      { text: 'Huỷ', style: 'cancel' },
      { text: 'Cho rời lớp', style: 'destructive', onPress: () => void removeMember(data.class.id, m.id) },
    ]);
  }

  return (
    <Card style={styles.card}>
      <View style={styles.head}>
        <AppText weight="700" style={styles.heading}>
          Tiến độ học viên
        </AppText>
        <View style={styles.sort}>
          <AppText variant="caption" color="muted">
            Xếp theo
          </AppText>
          <Select small title="Xếp theo" value={sort} options={SORTS} onChange={setSort} />
        </View>
      </View>
      {members.length === 0 ? (
        <View style={[styles.empty, { backgroundColor: alpha(theme.surface2, 0.6) }]}>
          <AppText color="muted" style={styles.emptyText}>
            Chưa có học viên nào. Gửi mã{' '}
            <AppText weight="700" color="text" style={styles.mono}>
              {data.class.code}
            </AppText>{' '}
            hoặc đường dẫn ở trên cho lớp — ai vào lớp sẽ hiện ở đây cùng chuỗi ngày, phút học, bài đã xong và điểm thi
            thử.
          </AppText>
        </View>
      ) : (
        <View style={styles.list}>
          {members.map((m) => (
            <View key={m.id} style={[styles.member, { borderColor: theme.border }]}>
              <View style={styles.row}>
                <Avatar user={m} size={32} />
                <Pressable onPress={() => router.push(`/u/${m.id}`)} style={styles.flex}>
                  <AppText weight="600" numberOfLines={1}>
                    {m.displayName}
                  </AppText>
                </Pressable>
                <AppText variant="caption" color="muted">
                  {lastStudied(m.lastStudiedOn)}
                </AppText>
                <Pressable
                  onPress={() => kick(m)}
                  accessibilityLabel={`Cho ${m.displayName} rời lớp`}
                  hitSlop={6}
                  style={styles.kick}>
                  <Icon name="close" size={14} color="muted" />
                </Pressable>
              </View>
              <View style={styles.stats}>
                {(
                  [
                    ['Chuỗi', m.currentStreak],
                    ['Phút/7n', m.minutes7d],
                    ['Bài xong', m.lessonsCompleted],
                    ['Từ', m.wordsStudied],
                  ] as const
                ).map(([k, v]) => (
                  <View key={k} style={[styles.stat, { backgroundColor: alpha(theme.surface2, 0.7) }]}>
                    <AppText weight="700" style={styles.statValue}>
                      {v}
                    </AppText>
                    <AppText variant="caption" color="muted">
                      {k}
                    </AppText>
                  </View>
                ))}
              </View>
              {m.bestExam && (
                <Pressable onPress={() => router.push(`/thi-thu-hsk/${m.bestExam?.slug}`)} style={styles.exam}>
                  <AppText variant="caption">
                    Thi thử tốt nhất:{' '}
                    <AppText variant="caption" weight="700" color={m.bestExam.passed ? 'good' : 'text'}>
                      {m.bestExam.score}/{m.bestExam.maxScore}
                    </AppText>
                  </AppText>
                  <AppText variant="caption" color="muted">
                    {m.bestExam.title}
                  </AppText>
                </Pressable>
              )}
            </View>
          ))}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 12 },
  heading: { fontSize: 16, lineHeight: 24 },
  head: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  sort: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  empty: { borderRadius: 12, padding: 16 },
  emptyText: { lineHeight: 24 },
  mono: { fontFamily: Fonts.mono },
  list: { gap: 8 },
  member: { borderWidth: 1, borderRadius: 12, padding: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flex: { flex: 1, minWidth: 0 },
  kick: { padding: 6, borderRadius: 8 },
  stats: { marginTop: 8, flexDirection: 'row', gap: 4 },
  stat: { flex: 1, alignItems: 'center', borderRadius: 8, paddingVertical: 6 },
  statValue: { fontVariant: ['tabular-nums'] },
  exam: { marginTop: 8 },
});
