import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { mutate } from 'swr';

import { AppText, AudioButton, Button, Card, Hanzi, Icon, Loading } from '@/components/ui';
import { alpha } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';
import { playWord } from '@/lib/audio';
import { useAuth } from '@/lib/auth';
import type { MinigameQuestion, MinigameResult, MinigameStartResponse } from '@/lib/types';

import { GameLeaderboard } from './game-leaderboard';
import { GAME_DURATION_MS, type GameDef } from './games';

type Phase = 'idle' | 'playing' | 'finished';

/** Làm mới bảng xếp hạng trò chơi sau khi nộp. */
export const refreshBoards = () =>
  void mutate((key) => typeof key === 'string' && key.startsWith('/minigame/leaderboard'));

/** Khách chơi được nhưng điểm không lên bảng xếp hạng — mời tạo tài khoản ngay lúc vừa có điểm. */
export function GuestScoreNote() {
  const { user } = useAuth();
  if (user) return null;
  return (
    <AppText color="muted" center style={styles.guest}>
      <AppText weight="600" color="primary" onPress={() => router.push('/register')}>
        Tạo tài khoản
      </AppText>{' '}
      để điểm của bạn có tên trên bảng xếp hạng.
    </AppText>
  );
}

/**
 * Engine chung cho 3 trò trắc nghiệm (`SoloMinigame` của web — Dịch tốc độ, Nghe đoán từ, Chọn pinyin): 60 giây,
 * chọn xong tự sang câu, hết giờ/hết câu thì nộp. Server chấm (client không biết đáp án).
 */
export function SoloGame({ game }: { game: GameDef }) {
  const theme = useTheme();
  const listening = game.mode === 'LISTENING';
  // Chọn pinyin: pinyin đúng chính là đáp án — không được hiện dưới chữ.
  const hidePinyin = game.mode === 'PINYIN';
  const [phase, setPhase] = useState<Phase>('idle');
  const [questions, setQuestions] = useState<MinigameQuestion[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION_MS);
  const [result, setResult] = useState<MinigameResult | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  const sessionId = useRef<string | null>(null);
  const answers = useRef<{ wordId: string; chosenIndex: number }[]>([]);
  const startedAt = useRef(0);
  // Chặn nộp 2 lần (vừa trả lời câu cuối đúng lúc hết giờ).
  const done = useRef(false);
  const current = questions[qIndex];

  async function finish() {
    if (done.current) return;
    done.current = true;
    setPhase('finished');
    if (!sessionId.current) return;
    try {
      setResult(
        await api.post<MinigameResult>(`/minigame/${sessionId.current}/finish`, {
          answers: answers.current,
          durationMs: Date.now() - startedAt.current,
        }),
      );
      refreshBoards();
    } catch {
      setError('Chưa nộp được kết quả. Kiểm tra mạng và thử lại.');
    }
  }

  async function start() {
    setStarting(true);
    setError('');
    try {
      const res = await api.post<MinigameStartResponse>('/minigame/start', { mode: game.mode });
      sessionId.current = res.sessionId;
      answers.current = [];
      done.current = false;
      startedAt.current = Date.now();
      setQuestions(res.questions ?? []);
      setQIndex(0);
      setResult(null);
      setTimeLeft(GAME_DURATION_MS);
      setPhase('playing');
    } catch {
      setError('Chưa bắt đầu được, thử lại nhé.');
    } finally {
      setStarting(false);
    }
  }

  // Đồng hồ 60 giây; hết giờ thì nộp.
  const finishRef = useRef(finish);
  useEffect(() => {
    finishRef.current = finish;
  });
  useEffect(() => {
    if (phase !== 'playing') return;
    const id = setInterval(() => {
      const remain = GAME_DURATION_MS - (Date.now() - startedAt.current);
      setTimeLeft(Math.max(0, remain));
      if (remain <= 0) {
        clearInterval(id);
        void finishRef.current();
      }
    }, 200);
    return () => clearInterval(id);
  }, [phase]);

  // Trò nghe: tự phát âm mỗi câu mới.
  useEffect(() => {
    if (listening && phase === 'playing' && current) playWord(current.audioUrl);
  }, [listening, phase, current]);

  function choose(i: number) {
    if (!current || phase !== 'playing') return;
    answers.current = [...answers.current, { wordId: current.wordId, chosenIndex: i }];
    if (qIndex + 1 >= questions.length) void finish();
    else setQIndex(qIndex + 1);
  }

  return (
    <>
      <Card>
        {phase === 'idle' && (
          <View style={styles.idle}>
            <Icon name="clock" size={36} color="accent" />
            <AppText color="muted" center style={styles.idleText}>
              Bạn có 60 giây để trả lời càng nhiều câu hỏi trắc nghiệm càng tốt — mỗi câu đúng 1 điểm.
            </AppText>
            <Button title={starting ? 'Đang chuẩn bị…' : 'Bắt đầu chơi'} disabled={starting} onPress={() => void start()} />
            {error ? (
              <AppText color="danger" style={styles.error}>
                {error}
              </AppText>
            ) : null}
          </View>
        )}

        {phase === 'playing' && current && (
          <View>
            <View style={styles.status}>
              <AppText color="muted">
                Câu {qIndex + 1}/{questions.length}
              </AppText>
              <AppText weight="700" color={timeLeft < 10_000 ? 'danger' : 'primary'} style={styles.tabular}>
                {Math.ceil(timeLeft / 1000)}s
              </AppText>
            </View>
            {listening ? (
              <View style={styles.listen}>
                <AudioButton src={current.audioUrl} size={40} />
                <AppText variant="caption" color="muted">
                  Nghe rồi chọn đúng nghĩa
                </AppText>
              </View>
            ) : (
              <View style={styles.prompt}>
                <Hanzi size={48} style={styles.center}>
                  {current.prompt}
                </Hanzi>
                {!hidePinyin && (
                  <AppText color="muted" center style={styles.pinyin}>
                    {current.pinyin}
                  </AppText>
                )}
              </View>
            )}
            <View style={styles.options}>
              {current.options.map((opt, i) => (
                <Pressable
                  key={`${qIndex}-${i}`}
                  onPress={() => choose(i)}
                  style={({ pressed }) => [
                    styles.option,
                    pressed
                      ? { borderColor: alpha(theme.primary, 0.4), backgroundColor: alpha(theme.primary, 0.05) }
                      : { borderColor: theme.border },
                  ]}>
                  <AppText weight="500">{opt}</AppText>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {phase === 'finished' && (
          <View style={styles.finished}>
            {!result ? (
              error ? (
                <AppText color="danger">{error}</AppText>
              ) : (
                <Loading />
              )
            ) : (
              <>
                <Icon name="trophy" size={40} color="primary" />
                <AppText weight="700" style={styles.score}>
                  {result.score}/{result.totalAsked} câu đúng
                </AppText>
                <GuestScoreNote />
                <Button title="Chơi lại" onPress={() => setPhase('idle')} style={styles.again} />
              </>
            )}
          </View>
        )}
      </Card>
      <GameLeaderboard mode={game.mode} />
    </>
  );
}

const styles = StyleSheet.create({
  center: { textAlign: 'center' },
  idle: { alignItems: 'center', paddingVertical: 32 },
  idleText: { marginTop: 16, marginBottom: 20, lineHeight: 24 },
  error: { marginTop: 12 },
  status: { marginBottom: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tabular: { fontVariant: ['tabular-nums'] },
  listen: { marginBottom: 24, alignItems: 'center', gap: 12, paddingVertical: 16 },
  prompt: { marginBottom: 24 },
  pinyin: { marginTop: 8 },
  options: { gap: 12 },
  option: { borderWidth: 1, borderRadius: 12, padding: 16 },
  finished: { alignItems: 'center', paddingVertical: 24 },
  score: { marginTop: 12, fontSize: 24, lineHeight: 32 },
  guest: { marginTop: 8, maxWidth: 384 },
  again: { marginTop: 20 },
});
