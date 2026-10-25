import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, AudioButton, Card, ProgressBar } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';
import { playWord } from '@/lib/audio';
import type { GameMode, MinigameQuestion, MinigameResult } from '@/lib/types';

import { GAME_DURATION_MS } from './games';
import { GameResult } from './game-result';

/**
 * Engine chung cho 3 trò trắc nghiệm (Dịch tốc độ, Nghe đoán từ, Chọn pinyin): 60 giây,
 * chọn xong tự sang câu, hết giờ/hết câu thì nộp. Server chấm (client không biết đáp án).
 */
export function SoloGame({
  mode,
  sessionId,
  questions,
  isGuest,
  onReplay,
  onFinished,
}: {
  mode: GameMode;
  sessionId: string;
  questions: MinigameQuestion[];
  isGuest: boolean;
  onReplay: () => void;
  onFinished: () => void;
}) {
  const theme = useTheme();
  const listening = mode === 'LISTENING';
  // Chọn pinyin: pinyin đúng chính là đáp án — không được hiện dưới chữ.
  const hidePinyin = mode === 'PINYIN';
  const [qIndex, setQIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION_MS);
  const [finished, setFinished] = useState(false);
  const [result, setResult] = useState<MinigameResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const answers = useRef<{ wordId: string; chosenIndex: number }[]>([]);
  const startedAt = useRef(0);
  // Chặn nộp 2 lần (vừa trả lời câu cuối đúng lúc hết giờ).
  const done = useRef(false);
  const q = questions[qIndex];

  async function finish() {
    if (done.current) return;
    done.current = true;
    setFinished(true);
    try {
      setResult(
        await api.post<MinigameResult>(`/minigame/${sessionId}/finish`, {
          answers: answers.current,
          durationMs: Date.now() - startedAt.current,
        }),
      );
      onFinished();
    } catch {
      setError('Chưa nộp được kết quả. Kiểm tra mạng và thử lại.');
    }
  }

  // Đồng hồ 60 giây; hết giờ thì nộp.
  const finishRef = useRef(finish);
  useEffect(() => {
    finishRef.current = finish;
  });
  useEffect(() => {
    startedAt.current = Date.now();
    const id = setInterval(() => {
      const remain = GAME_DURATION_MS - (Date.now() - startedAt.current);
      setTimeLeft(Math.max(0, remain));
      if (remain <= 0) {
        clearInterval(id);
        void finishRef.current();
      }
    }, 250);
    return () => clearInterval(id);
  }, []);

  // Trò nghe: tự phát âm mỗi câu mới.
  useEffect(() => {
    if (listening && q && !finished) playWord(q.audioUrl);
  }, [listening, q, finished]);

  function pick(i: number) {
    if (!q || finished) return;
    answers.current = [...answers.current, { wordId: q.wordId, chosenIndex: i }];
    if (qIndex + 1 < questions.length) setQIndex(qIndex + 1);
    else void finish();
  }

  if (finished || !q) {
    return <GameResult result={result} error={error} unit="câu đã trả lời" onReplay={onReplay} isGuest={isGuest} />;
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <AppText bold style={styles.flex}>
          Câu {qIndex + 1}
        </AppText>
        <AppText bold color={timeLeft < 10_000 ? 'danger' : 'text'}>
          {Math.ceil(timeLeft / 1000)} giây
        </AppText>
      </View>
      <ProgressBar value={(timeLeft / GAME_DURATION_MS) * 100} color={timeLeft < 10_000 ? 'danger' : 'primary'} />
      <Card style={styles.prompt}>
        {listening ? (
          <AudioButton src={q.audioUrl} big />
        ) : (
          <>
            <AppText style={styles.hanzi}>{q.prompt}</AppText>
            {!hidePinyin && <AppText color="primary">{q.pinyin}</AppText>}
          </>
        )}
      </Card>
      {q.options.map((opt, i) => (
        <Pressable
          key={`${qIndex}-${i}`}
          onPress={() => pick(i)}
          style={({ pressed }) => [
            styles.option,
            { borderColor: theme.border, backgroundColor: pressed ? theme.surface2 : theme.surface },
          ]}>
          <AppText bold>{opt}</AppText>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.md },
  row: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1 },
  prompt: { alignItems: 'center', paddingVertical: Spacing.xl },
  hanzi: { fontSize: 48, lineHeight: 60 },
  option: { borderWidth: 1.5, borderRadius: Radius.md, minHeight: 56, justifyContent: 'center', paddingHorizontal: Spacing.lg },
});
