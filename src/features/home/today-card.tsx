import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppText, Card, Flicker, Icon, ProgressBar } from '@/components/ui';
import { alpha } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useStreak, useStreakHistory, useStudyStats } from '@/lib/hooks';

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

function localIso(d: Date): string {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

/** Dải tuần T2–CN: ngày nào đã học trong tuần này. Hôm nay lấy `activeToday` của server, ngày trước lấy lịch sử. */
function WeekStrip({ activeToday }: { activeToday: boolean }) {
  const theme = useTheme();
  const history = useStreakHistory(7);
  const studied = new Set(
    (history.data ?? []).filter((d) => d.date && (d.wordsReviewed > 0 || d.minutesStudied > 0)).map((d) => d.date),
  );
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const todayIso = localIso(today);
  return (
    <View style={styles.week} accessibilityLabel="Tuần này">
      {WEEKDAYS.map((label, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const iso = localIso(d);
        const isToday = iso === todayIso;
        const future = iso > todayIso;
        const done = isToday ? activeToday : studied.has(iso);
        return (
          <View key={label} style={styles.day}>
            <AppText variant="caption" weight="700" color={isToday ? 'primary' : 'muted'}>
              {label}
            </AppText>
            <View
              accessibilityLabel={future ? undefined : done ? 'đã học' : 'chưa học'}
              style={[
                styles.dot,
                done
                  ? { backgroundColor: alpha(theme.danger, 0.12) }
                  : isToday
                    ? { borderWidth: 2, borderColor: theme.primary }
                    : future
                      ? { borderWidth: 1, borderStyle: 'dashed', borderColor: theme.border }
                      : { backgroundColor: theme.surface2 },
              ]}>
              {done && <Icon name="flame" size={14} color="danger" />}
            </View>
          </View>
        );
      })}
    </View>
  );
}

/**
 * Chuỗi ngày + mục tiêu hôm nay + từ cần ôn (`TodayCard` của web) — 3 câu hỏi người học nào cũng có khi mở app:
 * "hôm nay học chưa, đủ chưa, có gì cần ôn không".
 */
export function TodayCard() {
  const theme = useTheme();
  const streak = useStreak();
  const stats = useStudyStats();
  const s = streak.data;
  const due = stats.data?.dueNow ?? 0;
  const goalPct = s ? Math.min(100, (s.goal.progress / Math.max(1, s.goal.value)) * 100) : 0;

  return (
    <Card style={styles.card}>
      <View style={styles.head}>
        <View
          style={[
            styles.flame,
            { backgroundColor: s?.activeToday ? alpha(theme.danger, 0.12) : theme.surface2 },
          ]}>
          <Flicker on={!!s?.activeToday}>
            <Icon name="flame" size={26} color={s?.activeToday ? 'danger' : 'muted'} />
          </Flicker>
        </View>
        <View style={styles.flex}>
          <AppText weight="800" style={styles.count}>
            {s?.currentStreak ?? 0}
            <Text style={[styles.countUnit, { color: theme.muted }]}> ngày liên tiếp</Text>
          </AppText>
          <AppText variant="caption" color="muted" style={styles.note}>
            {s?.activeToday
              ? 'Hôm nay đã học — chuỗi được giữ.'
              : s?.savedByFreeze
                ? 'Hôm qua bạn nghỉ — lá chắn đang giữ chuỗi, học 1 bài hôm nay nhé.'
                : 'Học 1 bài hôm nay để giữ chuỗi.'}
            {s && s.streakFreezeCount > 0 && ` · ${s.streakFreezeCount} lá chắn`}
          </AppText>
        </View>
      </View>
      {s && <WeekStrip activeToday={s.activeToday} />}
      {s && (
        <View style={styles.goal}>
          <View style={styles.goalRow}>
            <AppText variant="caption" weight="600">
              Mục tiêu hôm nay
            </AppText>
            <AppText variant="caption" weight={s.goal.met ? '600' : '400'} color={s.goal.met ? 'good' : 'muted'}>
              {s.goal.met
                ? 'Đã đạt'
                : `${Math.floor(s.goal.progress)}/${s.goal.value} ${s.goal.type === 'MINUTES' ? 'phút' : 'từ'}`}
            </AppText>
          </View>
          <ProgressBar value={goalPct} color={s.goal.met ? 'good' : 'primary'} />
        </View>
      )}
      <Pressable
        onPress={() => router.navigate(due > 0 ? { pathname: '/review', params: { review: '1' } } : '/study')}
        style={({ pressed }) => [
          styles.due,
          due > 0
            ? { borderColor: alpha(theme.primary, 0.3), backgroundColor: alpha(theme.primary, pressed ? 0.1 : 0.05) }
            : { borderColor: theme.border, backgroundColor: pressed ? theme.surface2 : 'transparent' },
        ]}>
        <Icon name="cards" size={20} color={due > 0 ? 'primary' : 'muted'} />
        <View style={styles.flex}>
          <AppText weight="600">{due > 0 ? `${due} từ cần ôn hôm nay` : 'Chưa có từ cần ôn'}</AppText>
          <AppText variant="caption" color="muted">
            {due > 0 ? 'Ôn đúng lúc sắp quên để nhớ lâu' : 'Hanni sẽ nhắc khi đến lúc ôn'}
          </AppText>
        </View>
        {due > 0 && <Icon name="arrow" size={16} color="primary" />}
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 0 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flame: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1, minWidth: 0 },
  count: { fontSize: 24, lineHeight: 26 },
  countUnit: { fontSize: 14, fontWeight: '600' },
  note: { marginTop: 4 },
  week: { marginTop: 16, flexDirection: 'row', gap: 4 },
  day: { flex: 1, alignItems: 'center' },
  dot: { marginTop: 4, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  goal: { marginTop: 16 },
  goalRow: { marginBottom: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  due: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
});
