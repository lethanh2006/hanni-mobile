import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, Card, Hanzi, Icon, Screen, ShareButton } from '@/components/ui';
import { alpha } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { WEB_ORIGIN } from '@/lib/api';
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

  return (
    <Screen safeTop contentStyle={styles.page}>
      <Image source={require('@/assets/images/mascot.png')} style={styles.mascot} contentFit="contain" />
      <AppText variant="caption" weight="700" color="primary" style={styles.eyebrow}>
        HOÀN THÀNH BÀI {session.lesson.orderIndex}/{session.lesson.totalLessons}
      </AppText>
      <AppText weight="800" center style={styles.title}>
        {session.lesson.title}
      </AppText>
      <AppText color="muted" center style={styles.praise}>
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
            <AppText weight="700" center style={styles.statValue}>
              {s.value}
            </AppText>
          </Card>
        ))}
      </View>

      {result && result.currentStreak > 0 && (
        <View style={[styles.streak, { backgroundColor: alpha(theme.danger, 0.1) }]}>
          <Icon name="flame" size={16} color="danger" />
          <AppText weight="600" color="danger">
            Chuỗi {result.currentStreak} ngày học
          </AppText>
        </View>
      )}
      {outcome.saveError && (
        <AppText color="danger" center style={styles.saveError}>
          Chưa lưu được kết quả bài này — bạn kiểm tra kết nối mạng nhé.
        </AppText>
      )}

      <View style={styles.words}>
        {session.words.map((w) => (
          <View key={w.id} style={[styles.wordChip, { borderColor: theme.border, backgroundColor: theme.surface }]}>
            <AppText>
              <Hanzi size={18}>{w.simplified}</Hanzi>{' '}
              <AppText variant="caption" color="muted">
                {shortMeaning(w.meaningVi ?? '')}
              </AppText>
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
            <AppText variant="caption" color="muted" center>
              Đã có tài khoản?{' '}
              <AppText variant="caption" color="primary" onPress={() => router.replace('/login')}>
                Đăng nhập để lưu
              </AppText>{' '}
              · Toàn bộ bài học miễn phí.
            </AppText>
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
            {/* Web có thêm "Đọc hội thoại dùng N từ vừa học" (Bài đọc AI) — app chưa có màn đó. */}
            <Button title="Về lộ trình" variant="ghost" onPress={goBack} />
          </>
        )}
      </View>

      <ShareButton
        message={`Mình vừa học xong ${total} từ tiếng Trung (${session.lesson.title}) trên Hanni — học qua âm Hán Việt, nhớ nhanh hơn hẳn. Thử bài 1 miễn phí nhé: ${WEB_ORIGIN}`}
        style={styles.share}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { alignItems: 'center', gap: 0, paddingTop: 40 },
  mascot: { width: 171, height: 144 },
  eyebrow: { marginTop: 20, letterSpacing: 0.6 },
  title: { marginTop: 6, fontSize: 24, lineHeight: 32, letterSpacing: -0.6 },
  praise: { marginTop: 8 },
  stats: { marginTop: 28, flexDirection: 'row', gap: 12, alignSelf: 'stretch' },
  stat: { flex: 1, paddingHorizontal: 8, paddingVertical: 16, gap: 0 },
  statValue: { marginTop: 4, fontSize: 20, lineHeight: 28 },
  streak: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveError: { marginTop: 20 },
  words: { marginTop: 28, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  wordChip: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 },
  actions: { marginTop: 32, alignSelf: 'stretch', gap: 12 },
  share: { marginTop: 24, alignSelf: 'center' },
});
