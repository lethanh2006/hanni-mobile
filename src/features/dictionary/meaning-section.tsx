import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, AudioButton, Card, Icon, SectionTitle } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { speakChinese } from '@/lib/audio';
import { hskLabel, POS_VI } from '@/lib/hsk';
import type { Word } from '@/lib/types';

import { senses } from './word-header';

/** Câu ví dụ có từ đang tra tô đậm. */
function Highlight({ text, word }: { text: string; word: string }) {
  const form = word.replace(/[（(][^）)]*[）)]/g, '');
  if (!form || !text.includes(form)) return <AppText variant="heading">{text}</AppText>;
  const parts = text.split(form);
  return (
    <AppText variant="heading">
      {parts.map((p, i) => (
        <AppText key={i} variant="heading">
          {p}
          {i < parts.length - 1 && (
            <AppText variant="heading" color="primary">
              {form}
            </AppText>
          )}
        </AppText>
      ))}
    </AppText>
  );
}

/** Nghĩa đánh số từng nét + câu ví dụ (bấm loa để nghe cả câu). Từ có nhiều cách đọc thì liệt kê lần lượt. */
export function MeaningSection({ words }: { words: Word[] }) {
  const theme = useTheme();
  return (
    <Card>
      <SectionTitle title="Nghĩa" />
      {words.map((w, wi) => {
        const list = senses(w.meaningVi ?? w.meaningEn ?? '');
        return (
          <View key={w.id} style={[styles.reading, wi > 0 && { borderTopWidth: 1, borderColor: theme.border }]}>
            {wi > 0 && (
              <View style={styles.row}>
                <AppText variant="small" bold>
                  Cách đọc khác: {w.pinyin}
                </AppText>
                {w.hanViet && (
                  <AppText variant="small" bold color="hanviet">
                    {w.hanViet.toUpperCase()}
                  </AppText>
                )}
                <AppText variant="caption" color="muted">
                  {hskLabel(w.hskLevel)}
                </AppText>
                <AudioButton src={w.audioUrl} />
              </View>
            )}
            {w.pos.length > 0 && (
              <AppText variant="label" color="primary">
                {w.pos.map((p) => POS_VI[p] ?? p).join(' · ')}
              </AppText>
            )}
            {list.length === 0 ? (
              <AppText color="muted">Đang cập nhật</AppText>
            ) : (
              list.map((m, i) => (
                <AppText key={m} bold>
                  {list.length > 1 ? `${i + 1}. ` : ''}
                  {m}
                </AppText>
              ))
            )}
            {(w.examples ?? []).map((ex) => (
              <View key={ex.id} style={[styles.example, { backgroundColor: theme.surface2 }]}>
                <Pressable onPress={() => speakChinese(ex.zh)} hitSlop={8} accessibilityLabel="Nghe câu ví dụ">
                  <Icon name="sound" size={18} color="primary" />
                </Pressable>
                <View style={styles.flex}>
                  <Highlight text={ex.zh} word={w.simplified} />
                  {ex.pinyin && (
                    <AppText variant="caption" color="muted">
                      {ex.pinyin}
                    </AppText>
                  )}
                  {(ex.vi || ex.en) && <AppText variant="small">{ex.vi ?? ex.en}</AppText>}
                </View>
              </View>
            ))}
          </View>
        );
      })}
    </Card>
  );
}

const styles = StyleSheet.create({
  reading: { gap: 6, paddingTop: Spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: Spacing.sm },
  example: { flexDirection: 'row', gap: Spacing.md, borderRadius: Radius.md, padding: Spacing.md },
  flex: { flex: 1, gap: 2 },
});
