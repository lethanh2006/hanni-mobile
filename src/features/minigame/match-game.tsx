import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';
import type { MatchCard, MinigameResult } from '@/lib/types';

import { GameResult } from './game-result';

/** Ghép cặp: lật 2 thẻ mỗi lượt, cùng `wordId` là 1 cặp; sai thì úp lại sau 0,7 giây. */
export function MatchGame({
  sessionId,
  cards,
  isGuest,
  onReplay,
  onFinished,
}: {
  sessionId: string;
  cards: MatchCard[];
  isGuest: boolean;
  onReplay: () => void;
  onFinished: () => void;
}) {
  const theme = useTheme();
  const [open, setOpen] = useState<string[]>([]);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [mistakes, setMistakes] = useState(0);
  const [result, setResult] = useState<MinigameResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const startedAt = useRef(0);
  const pairs = cards.length / 2;
  const finished = matched.size === pairs && pairs > 0;

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  // Ghép xong hết thì nộp.
  useEffect(() => {
    if (!finished) return;
    api
      .post<MinigameResult>(`/minigame/${sessionId}/finish`, { mistakes, durationMs: Date.now() - startedAt.current })
      .then((r) => {
        setResult(r);
        onFinished();
      })
      .catch(() => setError('Chưa nộp được kết quả. Kiểm tra mạng và thử lại.'));
    // Chỉ chạy đúng 1 lần lúc ghép xong.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  function flip(card: MatchCard) {
    if (open.length === 2 || open.includes(card.cardId) || matched.has(card.wordId)) return;
    const next = [...open, card.cardId];
    setOpen(next);
    if (next.length < 2) return;
    const [a, b] = next.map((id) => cards.find((c) => c.cardId === id)!);
    if (a.wordId === b.wordId) {
      setMatched(new Set(matched).add(a.wordId));
      setOpen([]);
    } else {
      setMistakes((m) => m + 1);
      setTimeout(() => setOpen([]), 700);
    }
  }

  if (finished) {
    return <GameResult result={result} error={error} unit={`cặp · lật sai ${mistakes} lần`} onReplay={onReplay} isGuest={isGuest} />;
  }

  return (
    <View style={styles.wrap}>
      <AppText bold>
        Đã ghép {matched.size}/{pairs} cặp · lật sai {mistakes}
      </AppText>
      <View style={styles.grid}>
        {cards.map((card) => {
          const shown = open.includes(card.cardId) || matched.has(card.wordId);
          return (
            <Pressable
              key={card.cardId}
              onPress={() => flip(card)}
              style={[
                styles.card,
                matched.has(card.wordId)
                  ? { backgroundColor: theme.goodSoft, borderColor: theme.good }
                  : shown
                    ? { backgroundColor: theme.surface, borderColor: theme.primary }
                    : { backgroundColor: theme.primarySoft, borderColor: theme.primarySoft },
              ]}>
              {shown ? (
                <AppText variant={card.kind === 'hanzi' ? 'title' : 'caption'} bold center numberOfLines={3}>
                  {card.content}
                </AppText>
              ) : (
                <AppText variant="title" color="primary">
                  ?
                </AppText>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: Spacing.sm },
  // 4 thẻ mỗi hàng.
  card: {
    width: '23.5%',
    aspectRatio: 0.8,
    borderWidth: 1.5,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
});
