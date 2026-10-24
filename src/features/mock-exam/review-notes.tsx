import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { MockReviewItem } from '@/lib/types';

import { SPEAKER_VI } from './labels';
import { RubyText } from './ruby-text';

/** Phần chữa 1 câu: lời thoại, bản dịch, giải thích và từ vựng kèm âm Hán Việt. */
export function ReviewNotes({ review, pinyin }: { review: MockReviewItem; pinyin: boolean }) {
  const theme = useTheme();
  return (
    <View style={[styles.box, { backgroundColor: theme.surface2 }]}>
      {review.transcript?.map((line, i) => (
        <View key={i} style={styles.line}>
          <AppText variant="caption" bold color="muted">
            {SPEAKER_VI[line.s]}:
          </AppText>
          <RubyText ruby={line} pinyin={pinyin} size={17} />
        </View>
      ))}
      <AppText variant="small">{review.vi}</AppText>
      {review.explain && (
        <AppText variant="caption" color="muted">
          💡 {review.explain}
        </AppText>
      )}
      {!!review.words?.length && (
        <View style={styles.words}>
          {review.words.map((w) => (
            <View key={w.id} style={[styles.word, { borderColor: theme.border, backgroundColor: theme.surface }]}>
              <AppText variant="caption">
                <AppText variant="small" bold>
                  {w.zh}
                </AppText>{' '}
                {w.pinyin}
                {w.hanViet ? (
                  <AppText variant="caption" bold color="hanviet">
                    {' '}
                    {w.hanViet}
                  </AppText>
                ) : null}{' '}
                · {w.vi}
              </AppText>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: Radius.lg, padding: Spacing.md, gap: 6, marginTop: Spacing.sm },
  line: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end', gap: 6 },
  words: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingTop: 4 },
  word: { borderWidth: 1, borderRadius: Radius.md, paddingHorizontal: 8, paddingVertical: 4 },
});
