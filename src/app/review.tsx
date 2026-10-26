import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Button, ErrorNote, Icon, Loading, ProgressBar, Screen } from '@/components/ui';
import { Flashcard } from '@/features/study/flashcard';
import { QuizRunner } from '@/features/study/quiz-runner';
import { ResultRow, ReviewFinish, StreakNote } from '@/features/study/review-finish';
import { ReviewIntro } from '@/features/study/review-intro';
import { useReviewSession, type ReviewSource } from '@/features/study/use-review-session';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';
import { useRequireAuth } from '@/lib/auth';
import { useCurrentLesson, useLearnPath, useLesson, useStreak } from '@/lib/hooks';
import type { Quiz } from '@/lib/types';

/** Buổi ôn flashcard (`/study` của web): `?review=1` từ đến hạn, `?lesson=<id>` cả 1 bài, `?leeches=1` từ hay quên. */
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
  const theme = useTheme();
  const session = useReviewSession(source);
  const lessonId = source.kind === 'lesson' ? source.lessonId : null;
  const leech = source.kind === 'leeches';
  const lesson = useLesson(lessonId);
  // Bài đang học dở — để phiên ôn tự do vẫn nói được đang ở chủ đề nào.
  const current = useCurrentLesson(!lessonId);
  const path = useLearnPath(lesson.data?.lesson.hskLevel);
  const streak = useStreak();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [creatingQuiz, setCreatingQuiz] = useState(false);
  const [quizError, setQuizError] = useState<string | null>(null);

  const title = leech ? 'Từ khó nhớ' : (lesson.data?.lesson.title ?? 'Ôn tập flashcard');
  const { items, pos, correct } = session;
  const newCount = items.filter((i) => i.isNew).length;
  const nextLesson =
    lesson.data && path.data?.level === lesson.data.lesson.hskLevel
      ? path.data.lessons.find((l) => l.orderIndex === (lesson.data?.lesson.orderIndex ?? 0) + 1)
      : undefined;
  const toPath = () => router.navigate('/');

  async function startQuiz() {
    if (creatingQuiz) return;
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

  const navigation = (
    <View style={styles.navigation}>
      <Pressable
        onPress={() => (leech ? router.navigate('/progress') : toPath())}
        style={({ pressed }) => [styles.back, pressed && { backgroundColor: theme.surface2 }]}>
        <Icon name="back" size={17} color="muted" />
        <AppText weight="600" color="muted">
          {leech ? 'Tiến độ' : 'Lộ trình'}
        </AppText>
      </Pressable>
      <View style={styles.location}>
        <Icon name={lessonId ? 'route' : 'cards'} size={18} color="muted" />
        <AppText variant="caption" color="muted" numberOfLines={2} style={styles.flex}>
          {leech
            ? 'Ôn riêng những từ bạn hay quên'
            : lessonId
              ? title
              : current.data
                ? `Góc ôn tập · đang học: ${current.data.title}`
                : 'Góc ôn tập'}
        </AppText>
      </View>
    </View>
  );

  let body;
  if (quizScore !== null) {
    body = (
      <ReviewFinish
        icon="trophy"
        eyebrow="Buổi học đã hoàn thành"
        title="Một ngày học thật tốt!"
        score={quizScore}
        description="Điểm ghi nhớ của buổi này. Hẹn gặp lại bạn trong lần ôn tiếp theo!"
        actions={
          nextLesson ? (
            <Button title={nextLesson.title} icon="arrow" onPress={() => router.replace(`/bai-hoc/${nextLesson.id}`)} />
          ) : (
            <Button title="Về lộ trình" onPress={toPath} />
          )
        }
      />
    );
  } else if (quiz) {
    body = <QuizRunner quiz={quiz} onDone={setQuizScore} />;
  } else if (session.phase === 'loading') {
    body = session.error ? <ErrorNote>{session.error}</ErrorNote> : <Loading label="Đang chuẩn bị thẻ…" />;
  } else if (session.phase === 'intro') {
    body = (
      <ReviewIntro
        title={title}
        leech={leech}
        reviewCount={items.length - newCount}
        newCount={newCount}
        previewWord={items[0]?.word}
        newFrom={!lessonId ? current.data : null}
        onStart={session.start}
        onPickLesson={toPath}
      />
    );
  } else if (session.phase === 'review' && items[pos]) {
    body = (
      <>
        <View style={styles.reviewHeading}>
          <View style={styles.headingCopy}>
            <AppText weight="600" color="primary" style={styles.eyebrow}>
              GÓC TẬP TRUNG
            </AppText>
            <AppText weight="600" style={styles.reviewTitle}>
              {title}
            </AppText>
          </View>
          <View style={[styles.counter, { borderColor: theme.border, backgroundColor: theme.surface }]}>
            <AppText color="muted" style={styles.counterText}>
              <AppText weight="700" style={styles.counterValue}>
                {pos + 1}
              </AppText>{' '}
              / {items.length}
            </AppText>
          </View>
        </View>
        <Flashcard
          key={items[pos].word.id}
          word={items[pos].word}
          isNew={items[pos].isNew}
          busy={session.busy}
          onRate={(r, d) => void session.rate(r, d)}
          onKnown={() => void session.markKnown()}
        />
        <View style={[styles.progressCard, { borderColor: theme.border, backgroundColor: theme.surface }]}>
          <AppText weight="600">Nhịp học hôm nay</AppText>
          <AppText variant="caption" color="muted" style={styles.progressText}>
            <AppText weight="600" style={styles.progressValue}>
              {pos}
            </AppText>{' '}
            / {items.length} thẻ đã ôn
          </AppText>
          <ProgressBar value={(pos / items.length) * 100} />
          <View style={styles.progressDetail}>
            <View style={styles.remembered}>
              <View style={[styles.dot, { backgroundColor: theme.good }]} />
              <AppText variant="caption" color="muted">
                Đã nhớ
              </AppText>
            </View>
            <AppText variant="caption" weight="500" color="good">
              {correct} thẻ
            </AppText>
          </View>
        </View>
      </>
    );
  } else {
    // Xong buổi ôn (hoặc không có thẻ nào).
    const empty = items.length === 0;
    body = (
      <ReviewFinish
        icon={empty ? 'cards' : 'check'}
        eyebrow={empty ? 'Ôn tập xong cho bây giờ' : 'Thêm một bước tiến'}
        title={empty ? 'Không có từ nào cần ôn lúc này' : lessonId ? 'Xong bài!' : 'Bạn đã hoàn thành buổi ôn!'}
        description={
          empty
            ? 'Từ bạn đã học sẽ tự quay lại đây đúng lúc sắp quên. Trong lúc chờ, học thêm một bài mới nhé.'
            : `Bạn nhớ được ${correct}/${items.length} thẻ. Mỗi lần ôn là một lần nhớ lâu hơn.`
        }
        actions={
          <>
            {quizError && <ErrorNote>{quizError}</ErrorNote>}
            {items.length >= 4 && (
              <Button
                title={creatingQuiz ? 'Đang tạo…' : 'Kiểm tra nhanh những từ vừa học'}
                disabled={creatingQuiz}
                onPress={() => void startQuiz()}
              />
            )}
            {nextLesson && (
              <Button
                title={nextLesson.title}
                icon="arrow"
                variant="secondary"
                onPress={() => router.replace(`/bai-hoc/${nextLesson.id}`)}
              />
            )}
            {empty && !lessonId && (
              <Button
                title={current.data ? `Học bài tiếp theo: ${current.data.title}` : 'Về lộ trình'}
                icon="arrow"
                onPress={() => (current.data ? router.replace(`/bai-hoc/${current.data.id}`) : toPath())}
              />
            )}
            <Button title="Về lộ trình" variant="ghost" onPress={toPath} />
          </>
        }>
        {!empty && !!streak.data?.currentStreak && (
          <StreakNote
            text={`Chuỗi ${streak.data.currentStreak} ngày${streak.data.goal?.met ? ' · đã đạt mục tiêu hôm nay' : ' · học tiếp để giữ chuỗi nhé'}`}
          />
        )}
        {!empty && (
          <ResultRow
            items={[
              { value: String(items.length), label: 'thẻ đã ôn' },
              { value: String(correct), label: 'thẻ đã nhớ' },
              { value: `${Math.round((correct / items.length) * 100)}%`, label: 'tỉ lệ ghi nhớ' },
            ]}
          />
        )}
      </ReviewFinish>
    );
  }

  return (
    <Screen contentStyle={styles.page}>
      <Stack.Screen options={{ title: leech ? 'Từ khó nhớ' : 'Ôn tập' }} />
      {navigation}
      {session.phase !== 'loading' && session.error && <ErrorNote>{session.error}</ErrorNote>}
      {body}
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { gap: 0, paddingTop: 16 },
  navigation: { marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  location: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'flex-end' },
  flex: { flexShrink: 1, minWidth: 0 },
  reviewHeading: { marginTop: 5, marginBottom: 22, flexDirection: 'row', alignItems: 'center', gap: 16 },
  headingCopy: { flex: 1, minWidth: 0 },
  eyebrow: { fontSize: 12, lineHeight: 16, letterSpacing: 1 },
  reviewTitle: { marginTop: 7, fontSize: 22, lineHeight: 28, letterSpacing: -0.8 },
  counter: { borderWidth: 1, borderRadius: 11, paddingHorizontal: 13, paddingVertical: 9 },
  counterText: { fontSize: 13 },
  counterValue: { fontSize: 18 },
  progressCard: { marginTop: 16, borderWidth: 1, borderRadius: 20, paddingHorizontal: 18, paddingVertical: 16 },
  progressText: { marginTop: 8, marginBottom: 12 },
  progressValue: { fontSize: 24, lineHeight: 30 },
  progressDetail: { paddingTop: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  remembered: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
