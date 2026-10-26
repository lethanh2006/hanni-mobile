import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Hanzi, Icon } from '@/components/ui';
import { alpha } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { MockReviewItem } from '@/lib/types';

import { SPEAKER_VI } from './labels';
import { RubyText } from './ruby-text';

/**
 * Phần chữa 1 câu (`ReviewNotes` của web): lời thoại, bản dịch, giải thích, từ vựng kèm âm Hán Việt và (người đã đăng
 * nhập) nút hỏi trợ lý AI đúng câu này.
 */
export function ReviewNotes({ review, pinyin, onAsk }: { review: MockReviewItem; pinyin: boolean; onAsk?: () => void }) {
  const theme = useTheme();
  return (
    <View style={[styles.box, { backgroundColor: theme.surface2 }]}>
      {/* Nhãn người nói cùng dòng với lời — đoạn nghe dài khỏi bị dồn vào cột hẹp. */}
      {review.transcript?.map((line, i) => (
        <View key={i} style={styles.line}>
          <AppText variant="caption" weight="600" color="muted" style={styles.speaker}>
            {SPEAKER_VI[line.s]}:
          </AppText>
          <RubyText ruby={line} pinyin={pinyin} size={16} />
        </View>
      ))}
      <AppText style={styles.vi}>{review.vi}</AppText>
      {review.explain && (
        <View style={styles.explain}>
          <Icon name="info" size={14} color="primary" />
          <AppText variant="caption" color="muted" style={styles.explainText}>
            {review.explain}
          </AppText>
        </View>
      )}
      {!!review.words?.length && (
        <View style={styles.words} accessibilityLabel="Từ vựng trong câu">
          {review.words.map((w) => (
            <View key={w.id} style={[styles.word, { borderColor: theme.border, backgroundColor: theme.surface }]}>
              <Hanzi size={14} style={styles.wordZh}>
                {w.zh}
              </Hanzi>
              <AppText variant="caption" color="muted">
                {w.pinyin}
              </AppText>
              {w.hanViet ? (
                <AppText variant="caption" weight="600" color="hanviet">
                  {w.hanViet}
                </AppText>
              ) : null}
              <AppText variant="caption">· {w.vi}</AppText>
            </View>
          ))}
        </View>
      )}
      {/* Lớp cuối của chữa bài kiểu Migii HSK: hỏi trợ giảng AI đúng câu này. */}
      {onAsk && (
        <Pressable
          onPress={onAsk}
          style={({ pressed }) => [styles.ask, { backgroundColor: alpha(theme.primary, pressed ? 0.15 : 0.1) }]}>
          <Icon name="message" size={14} color="primary" />
          <AppText variant="caption" weight="600" color="primary">
            Hỏi trợ lý Hanni về câu này
          </AppText>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { marginTop: 12, gap: 8, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12 },
  line: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end' },
  speaker: { marginRight: 6, lineHeight: 24 },
  vi: { lineHeight: 24 },
  explain: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  explainText: { flex: 1, lineHeight: 20 },
  words: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingTop: 4 },
  word: {
    maxWidth: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    columnGap: 6,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  wordZh: { fontWeight: '600' },
  ask: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
});
