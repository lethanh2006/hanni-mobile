import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Card, SectionTitle } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import type { Measure, RelatedWord } from './types';
import { WordRow } from './word-row';

/** Lượng từ đi kèm (一个人, 一本书…). */
export function MeasuresSection({ measures }: { measures: Measure[] }) {
  const theme = useTheme();
  if (measures.length === 0) return null;
  return (
    <Card>
      <SectionTitle title="Lượng từ" />
      <View style={styles.chips}>
        {measures.map((m) => (
          <Pressable
            key={m.char}
            disabled={!m.inDictionary}
            onPress={() => router.push(`/tu-dien/${encodeURIComponent(m.char)}`)}
            style={[styles.chip, { borderColor: theme.border, backgroundColor: theme.surface }]}>
            <AppText variant="heading" color="primary">
              {m.char}
            </AppText>
            <AppText variant="small">{m.pinyin}</AppText>
            {m.hanViet && (
              <AppText variant="caption" bold color="hanviet">
                {m.hanViet.toUpperCase()}
              </AppText>
            )}
          </Pressable>
        ))}
      </View>
    </Card>
  );
}

/** Danh sách từ liên quan (từ ghép chứa chữ này, từ cùng chủ đề). */
export function RelatedSection({ title, words }: { title: string; words: RelatedWord[] }) {
  if (words.length === 0) return null;
  return (
    <Card>
      <SectionTitle title={title} />
      {words.map((w) => (
        <WordRow key={w.simplified} simplified={w.simplified} pinyin={w.pinyin} meaning={w.meaningVi} hanViet={w.hanViet} />
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
});
