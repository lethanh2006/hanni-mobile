import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, Card, ErrorNote, Loading, ProgressBar, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { Flashcard } from '@/features/study/flashcard';
import { QuizRunner } from '@/features/study/quiz-runner';
import { useReviewSession, type ReviewSource } from '@/features/study/use-review-session';
import { api } from '@/lib/api';
import { useRequireAuth } from '@/lib/auth';
import { useLesson, useStreak } from '@/lib/hooks';
import { goBack } from '@/lib/navigation';
import type { Quiz } from '@/lib/types';

/** Buổi ôn flashcard: `?review=1` từ đến hạn, `?lesson=<id>` cả 1 bài, `?leeches=1` từ hay quên. */
export default function ReviewScreen() {
  const { lesson, leeches } = useLocalSearchParams<{ lesson?: string; leeches?: string }>();
  const { user } = useRequireAuth();
  const source: ReviewSource = lesson
    ? { kind: 'lesson', lessonId: lesson }
    : leeches === '1'
      ? { kind: 'leeches' }
      : { kind: 'due' };

  if (!user) {
    return (
      <Screen>
        <Loading />
      </Screen>
    );
  }
  return <ReviewSession key={lesson ?? leeches ?? 'due'} source={source} />;
}

function ReviewSession({ source }: { source: ReviewSource }) {
  const session = useReviewSession(source);
  const lesson = useLesson(source.kind === 'lesson' ? source.lessonId : null);
  const streak = useStreak();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [creatingQuiz, setCreatingQuiz] = useState(false);
  const [quizError, setQuizError] = useState<string | null>(null);

  const title =
    source.kind === 'leeches' ? 'Từ khó nhớ' : (lesson.data?.lesson.title ?? 'Ôn tập flashcard');
  const { items, pos, correct } = session;
  const newCount = items.filter((i) => i.isNew).length;

  async function startQuiz() {
    setCreatingQuiz(true);
    setQuizError(null);
    const ids = session.reviewedIds();
    try {
      setQuiz(
        await api.post<Quiz>('/quiz/generate', {
          wordIds: ids.length ? ids : undefined,
          size: Math.min(10, Math.max(4, ids.length)),
        }),
      );
    } catch {
      setQuizError('Chưa tạo được bài kiểm tra. Vui lòng thử lại.');
    } finally {
      setCreatingQuiz(false);
    }
  }

  const header = <Stack.Screen options={{ title }} />;

  if (quizScore !== null) {
    return (
      <Screen>
        {header}
        <Card style={styles.center}>
          <AppText variant="label" color="primary">
            Buổi học đã hoàn thành
          </AppText>
          <AppText variant="title">Một ngày học thật tốt!</AppText>
          <AppText style={styles.score} color="primary">
            {quizScore}%
          </AppText>
          <AppText color="muted" center>
            Điểm ghi nhớ của buổi này. Hẹn gặp lại bạn trong lần ôn tiếp theo!
          </AppText>
        </Card>
        <Button title="Xong" onPress={goBack} />
      </Screen>
    );
  }

  if (quiz) {
    return (
      <Screen>
        {header}
        <QuizRunner quiz={quiz} onDone={setQuizScore} />
      </Screen>
    );
  }

  if (session.phase === 'loading') {
    return (
      <Screen>
        {header}
        {session.error ? <ErrorNote>{session.error}</ErrorNote> : <Loading label="Đang chuẩn bị thẻ…" />}
      </Screen>
    );
  }

  if (session.phase === 'intro') {
    return (
      <Screen>
        {header}
        <AppText variant="title">{title}</AppText>
        <AppText color="muted">
          {source.kind === 'leeches'
            ? 'Đây là những từ bạn sai nhiều nhất. Gặp lại thêm vài lần là nhớ được thôi.'
            : 'Lật một tấm thẻ, nhớ thêm một từ. Thử nhớ nghĩa trước rồi mới lật thẻ nhé.'}
        </AppText>
        <View style={styles.stats}>
          <Card style={styles.stat}>
            <AppText variant="title">{items.length - newCount}</AppText>
            <AppText variant="caption" color="muted">
              thẻ ôn lại
            </AppText>
          </Card>
          <Card style={styles.stat}>
            <AppText variant="title">{newCount}</AppText>
            <AppText variant="caption" color="muted">
              từ mới
            </AppText>
          </Card>
        </View>
        <Button
          title={items.length - newCount > 0 ? 'Bắt đầu ôn tập' : 'Bắt đầu học từ mới'}
          icon="arrow"
          onPress={session.start}
        />
        <AppText variant="small" color="muted" center>
          Nhìn chữ → thử nhớ nghĩa → lật thẻ → chọn mức nhớ. Hanni hẹn bạn ôn lại đúng lúc.
        </AppText>
      </Screen>
    );
  }

  if (session.phase === 'review' && items[pos]) {
    return (
      <Screen>
        {header}
        <View style={styles.progress}>
          <ProgressBar value={(pos / items.length) * 100} />
          <AppText variant="caption" color="muted">
            {pos + 1}/{items.length} thẻ · đã nhớ {correct}
          </AppText>
        </View>
        {session.error && <ErrorNote>{session.error}</ErrorNote>}
        <Flashcard
          key={items[pos].word.id}
          word={items[pos].word}
          isNew={items[pos].isNew}
          busy={session.busy}
          onRate={(r, d) => void session.rate(r, d)}
          onKnown={() => void session.markKnown()}
        />
      </Screen>
    );
  }

  // Xong buổi ôn (hoặc không có thẻ nào).
  const empty = items.length === 0;
  return (
    <Screen>
      {header}
      <Card style={styles.center}>
        <AppText variant="title" center>
          {empty ? 'Không có từ nào cần ôn lúc này' : 'Bạn đã hoàn thành buổi ôn!'}
        </AppText>
        <AppText color="muted" center>
          {empty
            ? 'Từ bạn đã học sẽ tự quay lại đây đúng lúc sắp quên. Trong lúc chờ, học thêm một bài mới nhé.'
            : `Bạn nhớ được ${correct}/${items.length} thẻ (${Math.round((correct / items.length) * 100)}%). Mỗi lần ôn là một lần nhớ lâu hơn.`}
        </AppText>
        {!empty && !!streak.data?.currentStreak && (
          <AppText bold color="danger">
            🔥 Chuỗi {streak.data.currentStreak} ngày
            {streak.data.goal.met ? ' · đã đạt mục tiêu hôm nay' : ' · học tiếp để giữ chuỗi nhé'}
          </AppText>
        )}
      </Card>
      {quizError && <ErrorNote>{quizError}</ErrorNote>}
      {items.length >= 4 && (
        <Button title="Kiểm tra nhanh những từ vừa học" loading={creatingQuiz} onPress={startQuiz} />
      )}
      {empty && <Button title="Học bài mới" icon="play" onPress={() => router.dismissTo('/')} />}
      <Button title="Về trang trước" variant="ghost" onPress={goBack} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', gap: Spacing.sm },
  score: { fontSize: 48, lineHeight: 56, fontWeight: '800' },
  stats: { flexDirection: 'row', gap: Spacing.md },
  stat: { flex: 1, alignItems: 'center' },
  progress: { gap: 4 },
});
