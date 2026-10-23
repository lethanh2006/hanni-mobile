import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText, Card, Icon, ProgressBar } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useStreak, useStreakHistory, useStudyStats } from '@/lib/hooks';

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

/** Ngày theo giờ máy dạng YYYY-MM-DD. */
function localIso(d: Date): string {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

/** Dải tuần T2–CN: ngày nào đã học. Hôm nay theo `activeToday` của server, ngày trước theo lịch sử. */
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
    <View style={styles.week}>
      {WEEKDAYS.map((label, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const iso = localIso(d);
        const isToday = iso === todayIso;
        const done = isToday ? activeToday : studied.has(iso);
        return (
          <View key={label} style={styles.day}>
            <AppText variant="caption" bold color={isToday ? 'primary' : 'muted'}>
              {label}
            </AppText>
            <View
              style={[
                styles.dot,
                done
                  ? { backgroundColor: theme.dangerSoft }
                  : isToday
                    ? { borderWidth: 2, borderColor: theme.primary }
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

/** Chuỗi ngày + mục tiêu hôm nay + từ cần ôn — 3 câu hỏi ai mở app cũng có. */
export function TodayCard() {
  const theme = useTheme();
  const streak = useStreak();
  const stats = useStudyStats();
  const s = streak.data;
  const due = stats.data?.dueNow ?? 0;
  const goalPct = s ? Math.min(100, (s.goal.progress / Math.max(1, s.goal.value)) * 100) : 0;

  const streakNote = s?.activeToday
    ? 'Hôm nay đã học — chuỗi được giữ.'
    : s?.savedByFreeze
      ? 'Hôm qua bạn nghỉ — lá chắn đang giữ chuỗi, học 1 bài hôm nay nhé.'
      : 'Học 1 bài hôm nay để giữ chuỗi.';

  return (
    <Card>
      <View style={styles.row}>
        <View style={[styles.flame, { backgroundColor: s?.activeToday ? theme.dangerSoft : theme.surface2 }]}>
          <Icon name="flame" size={26} color={s?.activeToday ? 'danger' : 'muted'} />
        </View>
        <View style={styles.flex}>
          <AppText variant="title">
            {s?.currentStreak ?? 0}{' '}
            <AppText variant="small" color="muted">
              ngày liên tiếp
            </AppText>
          </AppText>
          <AppText variant="caption" color="muted">
            {streakNote}
            {s && s.streakFreezeCount > 0 && ` · ${s.streakFreezeCount} lá chắn`}
          </AppText>
        </View>
      </View>

      {s && <WeekStrip activeToday={s.activeToday} />}

      {s && (
        <View style={styles.goal}>
          <View style={styles.row}>
            <AppText variant="small" bold style={styles.flex}>
              Mục tiêu hôm nay
            </AppText>
            <AppText variant="small" bold={s.goal.met} color={s.goal.met ? 'good' : 'muted'}>
              {s.goal.met
                ? 'Đã đạt'
                : `${Math.floor(s.goal.progress)}/${s.goal.value} ${s.goal.type === 'MINUTES' ? 'phút' : 'từ'}`}
            </AppText>
          </View>
          <ProgressBar value={goalPct} color={s.goal.met ? 'good' : 'primary'} />
        </View>
      )}

      <Card
        onPress={() => router.navigate(due > 0 ? { pathname: '/review', params: { review: '1' } } : '/study')}
        style={[styles.due, due > 0 && { borderColor: theme.primary, backgroundColor: theme.primarySoft }]}>
        <View style={styles.row}>
          <Icon name="cards" size={20} color={due > 0 ? 'primary' : 'muted'} />
          <View style={styles.flex}>
            <AppText variant="small" bold>
              {due > 0 ? `${due} từ cần ôn hôm nay` : 'Chưa có từ cần ôn'}
            </AppText>
            <AppText variant="caption" color="muted">
              {due > 0 ? 'Ôn đúng lúc sắp quên để nhớ lâu' : 'Hanni sẽ nhắc khi đến lúc ôn'}
            </AppText>
          </View>
          {due > 0 && <Icon name="arrow" size={16} color="primary" />}
        </View>
      </Card>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  flex: { flex: 1 },
  flame: { width: 48, height: 48, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center' },
  week: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.sm },
  day: { alignItems: 'center', gap: 4 },
  dot: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  goal: { gap: 6, marginTop: Spacing.sm },
  due: { padding: Spacing.md, marginTop: Spacing.sm },
});
