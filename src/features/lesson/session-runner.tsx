import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, BackHandler, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { mutate } from 'swr';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';
import { playWord } from '@/lib/audio';
import { useAuth } from '@/lib/auth';
import { savePendingLesson } from '@/lib/guest-progress';
import { hskLabel } from '@/lib/hsk';
import { goBack } from '@/lib/navigation';
import type { LessonCompleteResult, LessonSession, SessionStep, SessionWord } from '@/lib/types';

import { AnswerFooter } from './answer-footer';
import { SessionComplete } from './session-complete';
import { SessionHeader } from './session-header';
import { ChoiceStep, IntroStep, MatchStep, SentenceStep } from './steps';

interface QueueItem {
  key: string;
  step: SessionStep;
}

export interface SessionResult {
  durationMs: number;
  accuracy: number;
  result: LessonCompleteResult | null;
  saveError: boolean;
}

/** Mỗi từ được hỏi lại tối đa chừng này lần khi trả lời sai (câu sai quay lại cuối bài). */
const MAX_RETRIES_PER_WORD = 2;

/** Làm mới các số liệu phụ thuộc kết quả bài: lộ trình, chuỗi ngày, ôn tập, nhiệm vụ, tiến độ. */
function refreshAfterLesson() {
  void mutate(
    (key) =>
      typeof key === 'string' &&
      ['/learn', '/streak', '/study', '/quests', '/progress', '/leaderboard'].some((p) => key.startsWith(p)),
  );
}

function confirmExit() {
  Alert.alert('Dừng bài học?', 'Còn một chút nữa thôi. Nếu thoát bây giờ, kết quả bài này sẽ chưa được lưu.', [
    { text: 'Học tiếp', style: 'cancel' },
    { text: 'Thoát', style: 'destructive', onPress: goBack },
  ]);
}

export function SessionRunner({ session }: { session: LessonSession }) {
  const { user } = useAuth();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const words = useMemo(() => new Map(session.words.map((w) => [w.id, w])), [session.words]);
  const [queue, setQueue] = useState<QueueItem[]>(() =>
    session.steps.map((step, i) => ({ key: `s${i}`, step })),
  );
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [finished, setFinished] = useState<SessionResult | null>(null);
  const mistakes = useRef(new Map<string, number>());
  const retries = useRef(new Map<string, number>());
  const startedAt = useRef(0);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  // Nút Back của Android hỏi lại trước khi bỏ bài đang học dở.
  useEffect(() => {
    if (finished) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      confirmExit();
      return true;
    });
    return () => sub.remove();
  }, [finished]);

  const item = queue[index];
  const step = item?.step;
  const word: SessionWord | undefined = step && 'wordId' in step ? words.get(step.wordId) : undefined;
  const answered = picked !== null;
  const correct =
    answered && step && (step.kind === 'choice' || step.kind === 'sentence') ? picked === step.answer : null;

  const addMistake = useCallback((wordId: string) => {
    mistakes.current.set(wordId, (mistakes.current.get(wordId) ?? 0) + 1);
  }, []);

  async function finish() {
    const durationMs = Date.now() - startedAt.current;
    const results = session.words.map((w) => ({ wordId: w.id, mistakes: mistakes.current.get(w.id) ?? 0 }));
    const accuracy = results.filter((r) => r.mistakes === 0).length / (results.length || 1);
    if (!user) {
      // Khách: giữ kết quả, đăng ký xong mới nạp lên (xem lib/guest-progress.ts).
      savePendingLesson({ lessonId: session.lesson.id, hskLevel: session.lesson.hskLevel, results, durationMs });
      setFinished({ durationMs, accuracy, result: null, saveError: false });
      return;
    }
    try {
      const result = await api.post<LessonCompleteResult>(`/learn/lessons/${session.lesson.id}/complete`, {
        results,
        durationMs,
      });
      refreshAfterLesson();
      setFinished({ durationMs, accuracy, result, saveError: false });
    } catch {
      setFinished({ durationMs, accuracy, result: null, saveError: true });
    }
  }

  function advance() {
    setPicked(null);
    if (index + 1 < queue.length) setIndex(index + 1);
    else void finish();
  }

  function answer(i: number) {
    if (!step || (step.kind !== 'choice' && step.kind !== 'sentence')) return;
    setPicked(i);
    if (i === step.answer) {
      if (step.kind === 'choice' && step.prompt !== 'audio') playWord(words.get(step.wordId)?.audioUrl);
      return;
    }
    addMistake(step.wordId);
    const used = retries.current.get(step.wordId) ?? 0;
    if (used < MAX_RETRIES_PER_WORD) {
      retries.current.set(step.wordId, used + 1);
      setQueue((q) => [...q, { key: `${item.key}-r${used + 1}`, step }]);
    }
  }

  if (finished) return <SessionComplete session={session} outcome={finished} isGuest={!user} />;
  if (!step) return null;

  return (
    <View style={[styles.fill, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <SessionHeader
        progress={(index / queue.length) * 100}
        caption={`${hskLabel(session.lesson.hskLevel)} · Bài ${session.lesson.orderIndex}: ${session.lesson.title}`}
        onClose={confirmExit}
      />

      <ScrollView key={item.key} contentContainerStyle={styles.body}>
        {step.kind === 'intro' && word && <IntroStep word={word} />}
        {step.kind === 'choice' && word && <ChoiceStep step={step} word={word} picked={picked} onPick={answer} />}
        {step.kind === 'sentence' && <SentenceStep step={step} picked={picked} onPick={answer} />}
        {step.kind === 'match' && (
          <MatchStep
            words={step.wordIds.map((id) => words.get(id)).filter((w): w is SessionWord => !!w)}
            onMistake={addMistake}
            onDone={advance}
          />
        )}
      </ScrollView>

      {(step.kind === 'intro' || answered) && <AnswerFooter correct={correct} word={word} onNext={advance} />}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  body: { padding: Spacing.lg, paddingBottom: 160 },
});
