import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Button, Card, Hanzi, Icon, Loading } from '@/components/ui';
import { alpha } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';
import type { MatchCard, MinigameResult, MinigameStartResponse } from '@/lib/types';

import { GameLeaderboard } from './game-leaderboard';
import { GuestScoreNote, refreshBoards } from './solo-game';

type Phase = 'idle' | 'playing' | 'finished';

/** Ghép cặp (`MatchMinigame` của web): lật 2 thẻ mỗi lượt, cùng `wordId` là 1 cặp; sai thì úp lại sau 0,7 giây. */
export function MatchGame() {
  const theme = useTheme();
  const [phase, setPhase] = useState<Phase>('idle');
  const [cards, setCards] = useState<MatchCard[]>([]);
  const [flipped, setFlipped] = useState<string[]>([]);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [mistakes, setMistakes] = useState(0);
  const [locked, setLocked] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState<MinigameResult | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  const sessionId = useRef<string | null>(null);
  const startedAt = useRef(0);
  const done = useRef(false);

  async function start() {
    setStarting(true);
    setError('');
    try {
      const res = await api.post<MinigameStartResponse>('/minigame/start', { mode: 'MATCH' });
      sessionId.current = res.sessionId;
      done.current = false;
      startedAt.current = Date.now();
      setCards(res.cards ?? []);
      setFlipped([]);
      setMatched(new Set());
      setMistakes(0);
      setResult(null);
      setElapsed(0);
      setPhase('playing');
    } catch {
      setError('Chưa bắt đầu được, thử lại nhé.');
    } finally {
      setStarting(false);
    }
  }

  useEffect(() => {
    if (phase !== 'playing') return;
    const id = setInterval(() => setElapsed(Date.now() - startedAt.current), 200);
    return () => clearInterval(id);
  }, [phase]);

  // Ghép đủ mọi cặp thì nộp — trong effect để không gọi Date.now() ngay trong luồng lật thẻ.
  useEffect(() => {
    if (phase !== 'playing' || cards.length === 0 || matched.size !== cards.length / 2 || done.current) return;
    done.current = true;
    const durationMs = Date.now() - startedAt.current;
    setElapsed(durationMs);
    setPhase('finished');
    if (!sessionId.current) return;
    api
      .post<MinigameResult>(`/minigame/${sessionId.current}/finish`, { mistakes, durationMs })
      .then((r) => {
        setResult(r);
        refreshBoards();
      })
      .catch(() => setError('Chưa nộp được kết quả. Kiểm tra mạng và thử lại.'));
    // Chỉ chạy đúng 1 lần lúc ghép xong.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matched, phase]);

  function flip(card: MatchCard) {
    if (locked || phase !== 'playing' || flipped.includes(card.cardId) || matched.has(card.wordId)) return;
    const next = [...flipped, card.cardId];
    setFlipped(next);
    if (next.length < 2) return;
    setLocked(true);
    const [a, b] = next.map((id) => cards.find((c) => c.cardId === id));
    if (a && b && a.wordId === b.wordId) {
      setMatched(new Set(matched).add(a.wordId));
      setFlipped([]);
      setLocked(false);
    } else {
      setMistakes((m) => m + 1);
      setTimeout(() => {
        setFlipped([]);
        setLocked(false);
      }, 700);
    }
  }

  const rows: MatchCard[][] = [];
  for (let i = 0; i < cards.length; i += 4) rows.push(cards.slice(i, i + 4));

  return (
    <>
      <Card>
        {phase === 'idle' && (
          <View style={styles.idle}>
            <Icon name="cards" size={36} color="good" />
            <AppText color="muted" center style={styles.idleText}>
              Lật 2 thẻ mỗi lượt để tìm đúng cặp Hán tự ↔ nghĩa. Không lật sai lần nào được tối đa 8 điểm, mỗi lần lật sai
              trừ 1 điểm.
            </AppText>
            <Button title={starting ? 'Đang chuẩn bị…' : 'Bắt đầu chơi'} disabled={starting} onPress={() => void start()} />
            {error ? (
              <AppText color="danger" style={styles.error}>
                {error}
              </AppText>
            ) : null}
          </View>
        )}

        {phase === 'playing' && (
          <View>
            <View style={styles.status}>
              <AppText color="muted">
                Đã ghép {matched.size}/{cards.length / 2} cặp
              </AppText>
              <View style={styles.statusRight}>
                <AppText color="danger">Sai {mistakes} lần</AppText>
                <AppText weight="700" color="primary" style={styles.tabular}>
                  {Math.floor(elapsed / 1000)}s
                </AppText>
              </View>
            </View>
            <View style={styles.grid}>
              {rows.map((row) => (
                <View key={row[0].cardId} style={styles.gridRow}>
                  {row.map((card) => {
                    const isMatched = matched.has(card.wordId);
                    const shown = isMatched || flipped.includes(card.cardId);
                    return (
                      <Pressable
                        key={card.cardId}
                        disabled={isMatched}
                        onPress={() => flip(card)}
                        style={[
                          styles.card,
                          isMatched
                            ? { borderColor: theme.good, backgroundColor: alpha(theme.good, 0.1) }
                            : shown
                              ? { borderColor: alpha(theme.primary, 0.4), backgroundColor: alpha(theme.primary, 0.05) }
                              : { borderColor: theme.border, backgroundColor: theme.surface2 },
                        ]}>
                        {shown ? (
                          card.kind === 'hanzi' ? (
                            <Hanzi size={18}>{card.content}</Hanzi>
                          ) : (
                            <AppText variant="caption" weight="500" center numberOfLines={4} style={styles.meaning}>
                              {card.content}
                            </AppText>
                          )
                        ) : (
                          <Icon name="spark" size={18} rawColor={alpha(theme.muted, 0.5)} />
                        )}
                      </Pressable>
                    );
                  })}
                </View>
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
                  Hoàn thành!
                </AppText>
                <AppText color="muted" style={styles.sub}>
                  Sai {mistakes} lần · {Math.floor(elapsed / 1000)} giây
                </AppText>
                <GuestScoreNote />
                <Button title="Chơi lại" onPress={() => setPhase('idle')} style={styles.again} />
              </>
            )}
          </View>
        )}
      </Card>
      <GameLeaderboard mode="MATCH" />
    </>
  );
}

const styles = StyleSheet.create({
  idle: { alignItems: 'center', paddingVertical: 32 },
  idleText: { marginTop: 16, marginBottom: 20, lineHeight: 24 },
  error: { marginTop: 12 },
  status: { marginBottom: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tabular: { fontVariant: ['tabular-nums'] },
  grid: { gap: 10 },
  gridRow: { flexDirection: 'row', gap: 10 },
  card: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 6,
  },
  meaning: { lineHeight: 15 },
  finished: { alignItems: 'center', paddingVertical: 24 },
  score: { marginTop: 12, fontSize: 24, lineHeight: 32 },
  sub: { marginTop: 8 },
  again: { marginTop: 20 },
});
