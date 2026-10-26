import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';

import { AppText, Hanzi, Icon } from '@/components/ui';
import { alpha, Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Word } from '@/lib/types';

import type { CharBreakdown, RelatedWord } from './types';
import { WordSection } from './word-header';
import { firstMeaning } from './word-row';

const openWord = (s: string) => router.push(`/tu-dien/${encodeURIComponent(s)}`);

/**
 * "Nhớ bằng Hán Việt" — thế mạnh riêng của Hanni: ghép âm Hán Việt từng chữ ra nghĩa (电脑 = điện + não);
 * từ 1 chữ thì chỉ ra chữ đó trong những từ ghép hay gặp. Có mẹo nhớ (đã có sẵn) thì hiện khung vàng như web.
 */
export function HanVietSection({
  word,
  characters,
  compounds,
  onLayout,
}: {
  word: Word;
  characters: CharBreakdown[];
  compounds: RelatedWord[];
  onLayout?: (e: LayoutChangeEvent) => void;
}) {
  const theme = useTheme();
  const multiChar = Array.from(word.simplified).filter((c) => /\p{Script=Han}/u.test(c)).length > 1;
  const withHanViet = compounds.filter((c) => c.hanViet).slice(0, 4);
  if (!(multiChar && characters.length) && !(word.hanViet && withHanViet.length) && !word.mnemonicVi) return null;

  return (
    <WordSection icon="spark" title="Nhớ bằng Hán Việt" onLayout={onLayout}>
      {multiChar && characters.length > 0 ? (
        <View style={styles.chars}>
          {characters.map((c, i) => (
            <View key={`${c.char}-${i}`} style={styles.charRow}>
              {i > 0 && <Icon name="plus" size={14} color="muted" />}
              <Pressable
                onPress={() => openWord(c.char)}
                style={({ pressed }) => [
                  styles.char,
                  { borderColor: pressed ? alpha(theme.primary, 0.3) : theme.border, backgroundColor: theme.surface },
                ]}>
                <Hanzi size={24} color="primary">
                  {c.char}
                </Hanzi>
                <View style={styles.charText}>
                  <AppText weight="700" color="hanviet">
                    {c.hanViet?.toUpperCase() ?? '—'}
                  </AppText>
                  <AppText variant="caption" color="muted" numberOfLines={1}>
                    {firstMeaning(c.meaningVi) || 'không đứng riêng'}
                  </AppText>
                </View>
              </Pressable>
            </View>
          ))}
          {word.hanViet && (
            <View style={styles.charRow}>
              <Icon name="arrow" size={16} color="muted" />
              <View style={[styles.result, { backgroundColor: alpha(theme.hanviet, 0.1) }]}>
                <AppText weight="700" color="hanviet">
                  {word.hanViet.toUpperCase()}
                </AppText>
              </View>
            </View>
          )}
        </View>
      ) : word.hanViet && withHanViet.length > 0 ? (
        <AppText style={styles.sentence}>
          Âm Hán Việt{' '}
          <AppText weight="700" color="hanviet">
            {word.hanViet.toUpperCase()}
          </AppText>{' '}
          — cũng là chữ{' '}
          <AppText weight="700" color="hanviet">
            {word.hanViet.toUpperCase()}
          </AppText>{' '}
          trong{' '}
          {withHanViet.map((c, i) => (
            <Text key={c.simplified} onPress={() => openWord(c.simplified)}>
              {i > 0 ? ' · ' : ''}
              <Text style={{ fontFamily: Fonts.hanzi, fontSize: 16 }}>{c.simplified}</Text>{' '}
              <Text style={{ color: theme.hanviet, fontWeight: '600' }}>{c.hanViet}</Text>
            </Text>
          ))}
        </AppText>
      ) : null}
      {word.mnemonicVi && (
        <View style={[styles.mnemonic, { borderColor: alpha(theme.accent, 0.25), backgroundColor: alpha(theme.accent, 0.05) }]}>
          <View style={styles.mnemonicHead}>
            <Icon name="spark" size={13} color="accent" />
            <AppText variant="caption" weight="600" color="accent">
              Mẹo nhớ
            </AppText>
          </View>
          <AppText style={styles.mnemonicText}>{word.mnemonicVi}</AppText>
          <AppText variant="caption" color="muted" style={styles.mnemonicNote}>
            AI gợi ý từ âm Hán Việt và nghĩa từng chữ.
          </AppText>
        </View>
      )}
    </WordSection>
  );
}

const styles = StyleSheet.create({
  chars: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  charRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  char: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  charText: { maxWidth: 144 },
  result: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  sentence: { lineHeight: 28 },
  mnemonic: { marginTop: 12, borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12 },
  mnemonicHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  mnemonicText: { marginTop: 4, lineHeight: 24 },
  mnemonicNote: { marginTop: 4 },
});
