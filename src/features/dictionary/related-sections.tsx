import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';

import { AppText, Hanzi } from '@/components/ui';
import { alpha } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { hskLabel } from '@/lib/hsk';
import type { Word } from '@/lib/types';

import type { Measure, RelatedWord, Topic } from './types';
import { WordSection } from './word-header';
import { firstMeaning } from './word-row';

const openWord = (s: string) => router.push(`/tu-dien/${encodeURIComponent(s)}`);

/** Viền khung bấm được — đỏ nhạt khi đang bấm (như `.hover-card`). */
function useTile() {
  const theme = useTheme();
  return (pressed: boolean) => ({
    borderColor: pressed ? alpha(theme.primary, 0.3) : theme.border,
    backgroundColor: theme.surface,
  });
}

/** Mục "Lượng từ": ô lượng từ + dòng "Dùng như: 一个人 · 一本书". */
export function MeasuresSection({
  measures,
  word,
  onLayout,
}: {
  measures: Measure[];
  word: Word;
  onLayout?: (e: LayoutChangeEvent) => void;
}) {
  const tile = useTile();
  if (measures.length === 0) return null;
  const form = word.simplified.replace(/[（(][^）)]*[）)]/g, '');
  return (
    <WordSection icon="cards" title="Lượng từ" onLayout={onLayout}>
      <View style={styles.wrapRow}>
        {measures.map((m) => (
          <Pressable
            key={m.char}
            disabled={!m.inDictionary}
            onPress={() => openWord(m.char)}
            style={({ pressed }) => [styles.measure, tile(pressed)]}>
            <Hanzi size={20} color="primary">
              {m.char}
            </Hanzi>
            <AppText>
              {m.pinyin}
              {m.hanViet ? (
                <AppText variant="caption" weight="700" color="hanviet">
                  {'  '}
                  {m.hanViet.toUpperCase()}
                </AppText>
              ) : null}
            </AppText>
          </Pressable>
        ))}
      </View>
      <AppText color="muted" style={styles.usage}>
        Dùng như:{' '}
        {measures.slice(0, 3).map((m, i) => (
          <Text key={m.char}>
            {i > 0 && ' · '}
            <Hanzi size={16}>
              一{m.char}
              {form}
            </Hanzi>
          </Text>
        ))}
      </AppText>
    </WordSection>
  );
}

/** Mục "Từ ghép có chữ X": danh sách từ, chữ đang tra tô đỏ, ÂM HÁN VIỆT + nghĩa. */
export function CompoundsSection({
  words,
  char,
  onLayout,
}: {
  words: RelatedWord[];
  char: string;
  onLayout?: (e: LayoutChangeEvent) => void;
}) {
  const theme = useTheme();
  const tile = useTile();
  if (words.length === 0) return null;
  return (
    <WordSection
      icon="grid"
      onLayout={onLayout}
      title={
        <AppText weight="700" style={styles.title}>
          Từ ghép có chữ{' '}
          <Hanzi size={16} color="primary">
            {char}
          </Hanzi>
        </AppText>
      }>
      <View style={styles.list}>
        {words.map((c) => (
          <Pressable key={c.simplified} onPress={() => openWord(c.simplified)} style={({ pressed }) => [styles.compound, tile(pressed)]}>
            <Hanzi size={20}>
              {Array.from(c.simplified).map((ch, i) => (
                <Text key={i} style={ch === char ? { color: theme.primary, fontWeight: '600' } : undefined}>
                  {ch}
                </Text>
              ))}
            </Hanzi>
            <View style={styles.flex}>
              {c.hanViet && (
                <AppText variant="caption" weight="700" color="hanviet">
                  {c.hanViet.toUpperCase()}
                </AppText>
              )}
              <AppText numberOfLines={1}>{firstMeaning(c.meaningVi)}</AppText>
            </View>
          </Pressable>
        ))}
      </View>
    </WordSection>
  );
}

/** Mục "Cùng chủ đề": lưới 2 cột chữ Hán đỏ · pinyin + HÁN VIỆT · nghĩa; "Học cả bài →" mở bài của chủ đề. */
export function RelatedSection({
  words,
  topic,
  level,
  onLayout,
}: {
  words: RelatedWord[];
  topic: Topic | null;
  level: number;
  onLayout?: (e: LayoutChangeEvent) => void;
}) {
  const tile = useTile();
  if (words.length === 0) return null;
  return (
    <WordSection
      icon="route"
      onLayout={onLayout}
      title={topic ? `Cùng chủ đề: ${topic.title.replace(/\s*\(\d+\/\d+\)$/, '')}` : `Từ vựng ${hskLabel(level)} khác`}
      aside={
        topic ? (
          <Pressable onPress={() => router.push(`/bai-hoc/${topic.id}`)} hitSlop={6}>
            <AppText variant="caption" weight="600" color="primary">
              Học cả bài →
            </AppText>
          </Pressable>
        ) : undefined
      }>
      <View style={styles.grid}>
        {words.map((r) => (
          <View key={r.simplified} style={styles.cell}>
            <Pressable onPress={() => openWord(r.simplified)} style={({ pressed }) => [styles.related, tile(pressed)]}>
              <Hanzi size={18} color="primary">
                {r.simplified}
              </Hanzi>
              <AppText variant="caption" color="muted" numberOfLines={1}>
                {r.pinyin}
                {r.hanViet ? (
                  <AppText variant="caption" weight="700" color="hanviet">
                    {' '}
                    {r.hanViet.toUpperCase()}
                  </AppText>
                ) : null}
              </AppText>
              <AppText variant="caption" numberOfLines={1}>
                {firstMeaning(r.meaningVi)}
              </AppText>
            </Pressable>
          </View>
        ))}
      </View>
    </WordSection>
  );
}

const styles = StyleSheet.create({
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  measure: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  usage: { marginTop: 12 },
  title: { flex: 1, fontSize: 16, lineHeight: 24 },
  list: { gap: 8 },
  compound: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  flex: { flex: 1, minWidth: 0 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4, rowGap: 8 },
  cell: { width: '50%', paddingHorizontal: 4 },
  related: { flex: 1, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
});
