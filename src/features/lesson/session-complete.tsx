import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Share, StyleSheet, View } from 'react-native';

import { AppText, Button, Card, Screen } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { goBack } from '@/lib/navigation';
import type { LessonSession } from '@/lib/types';

import type { SessionResult } from './session-runner';
import { shortMeaning } from './steps';

function formatDuration(ms: number) {
  const s = Math.max(1, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function praise(pct: number) {
  if (pct >= 90) return 'Gần như tuyệt đối — bạn nhớ rất nhanh!';
  if (pct >= 60) return 'Làm tốt lắm. Những từ còn sai Hanni sẽ nhắc bạn ôn lại đúng lúc.';
  return 'Bài đầu luôn khó nhất. Hanni sẽ đưa những từ này quay lại để bạn ôn.';
}

export function SessionComplete({
  session,
  outcome,
  isGuest,
}: {
  session: LessonSession;
  outcome: SessionResult;
  isGuest: boolean;
}) {
  const theme = useTheme();
  const { result } = outcome;
  const next = result?.nextLesson ?? session.nextLesson;
  const total = session.words.length;
  const pct = Math.round(outcome.accuracy * 100);

  function share() {
    void Share.share({
      message: `Mình vừa học xong ${total} từ tiếng Trung (${session.lesson.title}) trên Hanni — học qua âm Hán Việt, nhớ nhanh hơn hẳn. Thử bài 1 miễn phí nhé: https://hanni.dangpham.id.vn`,
    });
  }

  return (
    <Screen safeTop contentStyle={styles.center}>
      <Image source={require('@/assets/images/mascot.png')} style={styles.mascot} contentFit="contain" />
      <AppText variant="label" color="primary">
        Hoàn thành bài {session.lesson.orderIndex}/{session.lesson.totalLessons}
      </AppText>
      <AppText variant="title" center>
        {session.lesson.title}
      </AppText>
      <AppText color="muted" center>
        {praise(pct)}
      </AppText>

      <View style={styles.stats}>
        {[
          { label: 'Từ mới', value: String(result?.newWords ?? total) },
          { label: 'Chính xác', value: `${pct}%` },
          { label: 'Thời gian', value: formatDuration(outcome.durationMs) },
        ].map((s) => (
          <Card key={s.label} style={styles.stat}>
            <AppText variant="caption" color="muted" center>
              {s.label}
            </AppText>
            <AppText variant="heading" center>
              {s.value}
            </AppText>
          </Card>
        ))}
      </View>

      {result && result.currentStreak > 0 && (
        <AppText bold color="danger">
          🔥 Chuỗi {result.currentStreak} ngày học
        </AppText>
      )}
      {outcome.saveError && (
        <AppText variant="small" color="danger" center>
          Chưa lưu được kết quả bài này — bạn kiểm tra kết nối mạng nhé.
        </AppText>
      )}

      <View style={styles.words}>
        {session.words.map((w) => (
          <View key={w.id} style={[styles.wordChip, { borderColor: theme.border, backgroundColor: theme.surface }]}>
            <AppText variant="heading">{w.simplified}</AppText>
            <AppText variant="caption" color="muted">
              {shortMeaning(w.meaningVi ?? '')}
            </AppText>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        {isGuest ? (
          <>
            <Button title="Lưu tiến độ — tạo tài khoản miễn phí" icon="arrow" onPress={() => router.replace('/register')} />
            {next && (
              <Button
                title={`Học tiếp bài ${next.orderIndex}: ${next.title}`}
                variant="secondary"
                onPress={() => router.replace(`/bai-hoc/${next.id}`)}
              />
            )}
            <Button title="Đã có tài khoản? Đăng nhập để lưu" variant="ghost" onPress={() => router.replace('/login')} />
          </>
        ) : (
          <>
            {next ? (
              <Button
                title={`Học bài tiếp theo: ${next.title}`}
                icon="arrow"
                onPress={() => router.replace(`/bai-hoc/${next.id}`)}
              />
            ) : (
              <Button title="Bạn đã học hết cấp này — xem lộ trình" icon="arrow" onPress={goBack} />
            )}
            <Button title="Về lộ trình" variant="ghost" onPress={goBack} />
          </>
        )}
        <Button title="Chia sẻ với bạn bè" variant="secondary" onPress={share} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center' },
  mascot: { width: 180, height: 150 },
  stats: { flexDirection: 'row', gap: Spacing.md, alignSelf: 'stretch' },
  stat: { flex: 1, paddingHorizontal: Spacing.sm, gap: 2 },
  words: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: Spacing.sm },
  wordChip: { borderWidth: 1, borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 6, alignItems: 'center' },
  actions: { alignSelf: 'stretch', gap: Spacing.md },
});
