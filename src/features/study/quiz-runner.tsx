import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, AudioButton, Button, Card, ErrorNote, ProgressBar } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';
import { playWord } from '@/lib/audio';
import type { Quiz } from '@/lib/types';

interface AnswerLog {
  wordId: string;
  isCorrect: boolean;
  chosen: string;
  correct: string;
}

/** Kiểm tra nhanh cuối buổi ôn. Câu nghe ẩn Hán tự/pinyin cho tới khi đã chọn đáp án. */
export function QuizRunner({ quiz, onDone }: { quiz: Quiz; onDone: (scorePct: number) => void }) {
  const theme = useTheme();
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [answers, setAnswers] = useState<AnswerLog[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const q = quiz.questions[idx];
  const total = quiz.questions.length;
  const listening = q?.mode === 'listening';

  useEffect(() => {
    if (listening) playWord(q?.audioUrl);
  }, [listening, q?.audioUrl]);

  async function advance() {
    if (!q || picked === null) return;
    const next = [...answers, { wordId: q.wordId, isCorrect: picked === q.answer, chosen: picked, correct: q.answer }];
    if (idx + 1 < total) {
      setAnswers(next);
      setPicked(null);
      setIdx(idx + 1);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await api.post<{ scorePct: number }>('/quiz/submit', { attemptId: quiz.attemptId, answers: next });
      onDone(res.scorePct);
    } catch {
      setError('Chưa lưu được bài làm. Đáp án của bạn vẫn được giữ lại; hãy thử nộp bài lần nữa.');
      setBusy(false);
    }
  }

  if (!q) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <AppText bold style={styles.flex}>
          Câu {idx + 1}/{total}
        </AppText>
        <AppText variant="caption" color="primary">
          {listening ? 'Phần nghe' : 'Phần đọc'}
        </AppText>
      </View>
      <ProgressBar value={(idx / total) * 100} />

      <Card style={styles.prompt}>
        <AppText variant="label" color="muted">
          {listening ? 'Nghe rồi chọn nghĩa đúng' : 'Từ này có nghĩa là gì?'}
        </AppText>
        {listening && <AudioButton src={q.audioUrl} big />}
        {(!listening || picked !== null) && (
          <>
            <AppText style={styles.hanzi}>{q.prompt}</AppText>
            <AppText color="primary">{q.pinyin}</AppText>
          </>
        )}
      </Card>

      {q.options.map((opt, i) => {
        const selected = picked === opt;
        return (
          <Pressable
            key={`${i}-${opt}`}
            disabled={busy}
            onPress={() => setPicked(opt)}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            style={[
              styles.option,
              selected
                ? { borderColor: theme.primary, backgroundColor: theme.primarySoft }
                : { borderColor: theme.border, backgroundColor: theme.surface },
            ]}>
            <AppText bold color={selected ? 'primary' : 'muted'}>
              {String.fromCharCode(65 + i)}
            </AppText>
            <AppText style={styles.flex}>{opt}</AppText>
          </Pressable>
        );
      })}

      {error && <ErrorNote>{error}</ErrorNote>}
      <Button
        title={busy ? 'Đang nộp bài…' : idx + 1 < total ? 'Câu tiếp theo' : error ? 'Thử nộp lại' : 'Nộp bài kiểm tra'}
        icon="arrow"
        loading={busy}
        disabled={picked === null}
        onPress={advance}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.md },
  row: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1 },
  prompt: { alignItems: 'center', paddingVertical: Spacing.xl },
  hanzi: { fontSize: 48, lineHeight: 60, fontWeight: '700' },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    minHeight: 56,
    borderWidth: 1.5,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
  },
});
