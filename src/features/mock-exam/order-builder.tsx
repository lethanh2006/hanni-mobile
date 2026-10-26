import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Hanzi, Icon } from '@/components/ui';
import { alpha } from '@/constants/theme';
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
    // Làm đúng theo 1 cách thì chỉ kể các cách KHÁC; làm sai thì kể các cách thay thế.
    const others = review.correct
      ? [String(review.answer), ...(review.alternatives ?? [])].filter(
          (a) => normalizeSentence(a) !== normalizeSentence(mine),
        )
      : (review.alternatives ?? []);
    return (
      <View style={styles.wrap}>
        {mine ? (
          <Hanzi
            size={20}
            color={review.correct ? 'good' : 'danger'}
            style={[styles.mine, !review.correct && styles.strike]}>
            {mine}
          </Hanzi>
        ) : null}
        {!review.correct && (
          <AppText>
            <AppText weight="600" color="good">
              Đáp án:{' '}
            </AppText>
            <Hanzi size={20} color="good">
              {String(review.answer)}
            </Hanzi>
          </AppText>
        )}
        {others.length > 0 && (
          <AppText variant="caption" color="muted">
            Cũng đúng: <Hanzi size={16}>{others.join(' / ')}</Hanzi>
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
          <AppText color="muted" style={styles.placeholder}>
            Bấm các từ bên dưới theo đúng thứ tự…
          </AppText>
        ) : (
          order.map((i, k) => (
            <Pressable
              key={i}
              onPress={() => update(order.filter((_, j) => j !== k))}
              disabled={!onChange}
              accessibilityLabel={`Bỏ "${pieces[i].zh}" khỏi câu`}
              style={[styles.piece, { borderColor: theme.text, backgroundColor: alpha(theme.text, 0.1) }]}>
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
              disabled={!onChange}
              accessibilityLabel={`Thêm "${piece.zh}" vào câu`}
              style={({ pressed }) => [
                styles.piece,
                pressed
                  ? { borderColor: alpha(theme.primary, 0.4), backgroundColor: alpha(theme.primary, 0.05) }
                  : { borderColor: theme.border, backgroundColor: theme.surface },
              ]}>
              <RubyText ruby={piece} pinyin={pinyin} size={18} />
            </Pressable>
          ),
        )}
        {order.length > 0 && onChange && (
          <Pressable onPress={() => update([])} style={styles.reset} hitSlop={6}>
            <Icon name="refresh" size={13} color="muted" />
            <AppText variant="caption" weight="600" color="muted">
              Xếp lại
            </AppText>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  mine: { lineHeight: 34 },
  strike: { textDecorationLine: 'line-through' },
  placeholder: { paddingHorizontal: 4 },
  reset: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4 },
  sentence: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    minHeight: 56,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  pieces: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  piece: { borderWidth: 2, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 },
});
