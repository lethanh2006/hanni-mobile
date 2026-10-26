import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, AudioButton, Button, Card, EmptyState, ErrorNote, Hanzi, Icon, ProgressBar } from '@/components/ui';
import { alpha } from '@/constants/theme';
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

/** Kiểm tra nhanh cuối buổi ôn (`QuizRunner` của web). Câu nghe ẩn Hán tự/pinyin cho tới khi đã chọn đáp án. */
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
  const revealed = !listening || picked !== null;

  useEffect(() => {
    if (listening) playWord(q?.audioUrl);
  }, [listening, q?.audioUrl]);

  async function advance() {
    if (!q || picked === null || busy) return;
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

  if (!q || !total) {
    return (
      <EmptyState
        title="Chưa đủ câu hỏi để kiểm tra"
        description="Hãy học thêm từ vựng hoặc chọn một cấp độ khác rồi thử lại."
      />
    );
  }

  return (
    <Card style={styles.card}>
      <View style={styles.head}>
        <AppText weight="600">
          Câu {idx + 1} <AppText color="muted">/ {total}</AppText>
        </AppText>
        <View style={[styles.mode, { backgroundColor: alpha(theme.primary, 0.08) }]}>
          <AppText variant="caption" weight="500" color="primary">
            {listening ? 'Phần nghe' : 'Phần đọc'}
          </AppText>
        </View>
      </View>
      <ProgressBar value={(idx / total) * 100} />
      <View
        style={[
          styles.prompt,
          {
            borderColor: alpha(theme.border, 0.6),
            backgroundImage: `linear-gradient(180deg, ${alpha(theme.surface2, 0.7)}, ${alpha(theme.surface2, 0.3)})`,
          },
        ]}>
        <AppText variant="caption" weight="600" color="muted" style={styles.promptLabel}>
          {listening ? 'NGHE RỒI CHỌN NGHĨA ĐÚNG' : 'TỪ NÀY CÓ NGHĨA LÀ GÌ?'}
        </AppText>
        {listening && <AudioButton src={q.audioUrl} size={44} />}
        <View style={[listening && styles.listenAnswer, { opacity: revealed ? 1 : 0 }]}>
          <Hanzi size={listening ? 36 : 48} style={styles.hanzi}>
            {revealed ? q.prompt : '　'}
          </Hanzi>
          <AppText weight="600" color="primary" style={listening ? styles.pinyinSmall : styles.pinyin}>
            {revealed ? q.pinyin : ''}
          </AppText>
        </View>
      </View>
      <View style={styles.options} accessibilityLabel="Chọn đáp án">
        {q.options.map((opt, i) => {
          const selected = picked === opt;
          return (
            <Pressable
              key={`${i}-${opt}`}
              disabled={busy}
              onPress={() => setPicked(opt)}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              style={({ pressed }) => [
                styles.option,
                selected
                  ? {
                      borderColor: theme.primary,
                      backgroundColor: alpha(theme.primary, 0.1),
                      boxShadow: `0 4px 6px -1px ${alpha(theme.primary, 0.1)}`,
                    }
                  : {
                      borderColor: pressed ? alpha(theme.primary, 0.4) : alpha(theme.border, 0.8),
                      backgroundColor: pressed ? alpha(theme.surface2, 0.8) : theme.surface,
                    },
                busy && styles.dim,
              ]}>
              <View style={[styles.letter, { backgroundColor: selected ? theme.primary : theme.surface2 }]}>
                <AppText variant="caption" weight="700" color={selected ? 'primaryText' : 'muted'}>
                  {String.fromCharCode(65 + i)}
                </AppText>
              </View>
              <AppText weight={selected ? '600' : '500'} style={styles.flex}>
                {opt}
              </AppText>
              {selected && <Icon name="check" size={18} color="primary" />}
            </Pressable>
          );
        })}
      </View>
      {error && <ErrorNote>{error}</ErrorNote>}
      <Button
        title={busy ? 'Đang nộp bài…' : idx + 1 < total ? 'Câu tiếp theo' : error ? 'Thử nộp lại' : 'Nộp bài kiểm tra'}
        icon="arrow"
        disabled={picked === null || busy}
        onPress={() => void advance()}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 24 },
  head: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  mode: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 },
  prompt: { alignItems: 'center', borderWidth: 1, borderRadius: 16, paddingHorizontal: 20, paddingVertical: 36 },
  promptLabel: { marginBottom: 16, letterSpacing: 0.6 },
  listenAnswer: { marginTop: 20, alignItems: 'center' },
  hanzi: { fontWeight: '700', textAlign: 'center' },
  pinyin: { marginTop: 12, fontSize: 18, lineHeight: 28, textAlign: 'center' },
  pinyinSmall: { marginTop: 8, fontSize: 16, lineHeight: 24, textAlign: 'center' },
  options: { gap: 12 },
  option: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  letter: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1, minWidth: 0 },
  dim: { opacity: 0.6 },
});
