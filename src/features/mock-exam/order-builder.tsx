import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, TextLink } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { MockAnswer, MockReviewItem, Ruby } from '@/lib/types';

import { normalizeSentence } from './labels';
import { RubyText } from './ruby-text';

/** Ghép lại thứ tự mảnh từ câu đã lưu (làm tiếp bài dở). */
function restoreOrder(pieces: Ruby[], given: MockAnswer | null): number[] {
  if (typeof given !== 'string') return [];
  const out: number[] = [];
  const go = (rest: string): boolean => {
    if (!rest) return out.length === pieces.length;
    for (let i = 0; i < pieces.length; i++) {
      if (out.includes(i) || !rest.startsWith(pieces[i].zh)) continue;
      out.push(i);
      if (go(rest.slice(pieces[i].zh.length))) return true;
      out.pop();
    }
    return false;
  };
  return go(normalizeSentence(given)) ? out : [];
}

/**
 * Sắp xếp câu: bấm mảnh bên dưới để đưa lên câu, bấm mảnh trên câu để trả lại.
 * Xếp ĐỦ mảnh mới tính là đã làm (`onChange(câu)`), rút bớt thì `onChange(null)`.
 */
export function OrderBuilder({
  pieces,
  given,
  review,
  onChange,
  pinyin,
}: {
  pieces: Ruby[];
  given: MockAnswer | null;
  review?: MockReviewItem;
  onChange?: (v: MockAnswer | null) => void;
  pinyin: boolean;
}) {
  const theme = useTheme();
  const [order, setOrder] = useState<number[]>(() => restoreOrder(pieces, given));

  if (review) {
    const mine = typeof given === 'string' ? given : '';
    return (
      <View style={styles.wrap}>
        {mine ? (
          <AppText variant="heading" color={review.correct ? 'good' : 'danger'}>
            {mine}
          </AppText>
        ) : null}
        {!review.correct && (
          <AppText variant="heading" color="good">
            Đáp án: {String(review.answer)}
          </AppText>
        )}
        {!!review.alternatives?.length && (
          <AppText variant="small" color="muted">
            Cũng đúng: {review.alternatives.join(' / ')}
          </AppText>
        )}
      </View>
    );
  }

  function update(next: number[]) {
    const wasDone = order.length === pieces.length;
    setOrder(next);
    if (next.length === pieces.length) onChange?.(next.map((i) => pieces[i].zh).join(''));
    else if (wasDone) onChange?.(null);
  }

  const placed = new Set(order);
  return (
    <View style={styles.wrap}>
      <View style={[styles.sentence, { borderColor: theme.border }]}>
        {order.length === 0 ? (
          <AppText variant="small" color="muted">
            Bấm các từ bên dưới theo đúng thứ tự…
          </AppText>
        ) : (
          order.map((i, k) => (
            <Pressable
              key={i}
              onPress={() => update(order.filter((_, j) => j !== k))}
              style={[styles.piece, { borderColor: theme.text, backgroundColor: theme.surface2 }]}>
              <RubyText ruby={pieces[i]} pinyin={pinyin} size={18} />
            </Pressable>
          ))
        )}
      </View>
      <View style={styles.pieces}>
        {pieces.map((piece, i) =>
          placed.has(i) ? null : (
            <Pressable
              key={i}
              onPress={() => update([...order, i])}
              style={[styles.piece, { borderColor: theme.border, backgroundColor: theme.surface }]}>
              <RubyText ruby={piece} pinyin={pinyin} size={18} />
            </Pressable>
          ),
        )}
      </View>
      {order.length > 0 && <TextLink title="Xếp lại" color="muted" onPress={() => update([])} />}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.sm },
  sentence: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    minHeight: 56,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: Radius.lg,
    padding: Spacing.sm,
  },
  pieces: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  piece: { borderWidth: 2, borderRadius: Radius.md, paddingHorizontal: 10, paddingVertical: 6 },
});
