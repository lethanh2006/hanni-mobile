import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Card, Icon, SectionTitle } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Word } from '@/lib/types';

import type { CharBreakdown, RelatedWord } from './types';
import { firstMeaning } from './word-row';

const openWord = (s: string) => router.push(`/tu-dien/${encodeURIComponent(s)}`);

/**
 * Thế mạnh riêng của Hanni: ghép âm Hán Việt từng chữ ra nghĩa (电脑 = điện + não).
 * Từ 1 chữ thì chỉ ra chữ đó trong những từ ghép người Việt hay gặp (书 thư → 读书 độc thư).
 */
export function HanVietSection({
  word,
  characters,
  compounds,
}: {
  word: Word;
  characters: CharBreakdown[];
  compounds: RelatedWord[];
}) {
  const theme = useTheme();
  const multiChar = Array.from(word.simplified).filter((c) => /\p{Script=Han}/u.test(c)).length > 1;
  const withHanViet = compounds.filter((c) => c.hanViet).slice(0, 4);

  if (!(multiChar && characters.length) && !(word.hanViet && withHanViet.length) && !word.mnemonicVi) return null;

  return (
    <Card>
      <SectionTitle title="Nhớ bằng Hán Việt" />
      {multiChar && characters.length > 0 ? (
        <View style={styles.chars}>
          {characters.map((c, i) => (
            <View key={`${c.char}-${i}`} style={styles.charRow}>
              {i > 0 && <Icon name="plus" size={14} color="muted" />}
              <Pressable
                onPress={() => openWord(c.char)}
                style={[styles.char, { borderColor: theme.border, backgroundColor: theme.surface }]}>
                <AppText variant="title" color="primary">
                  {c.char}
                </AppText>
                <View>
                  <AppText variant="small" bold color="hanviet">
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
              <AppText bold color="hanviet">
                {word.hanViet.toUpperCase()}
              </AppText>
            </View>
          )}
        </View>
      ) : word.hanViet && withHanViet.length > 0 ? (
        <AppText variant="small">
          Âm Hán Việt{' '}
          <AppText variant="small" bold color="hanviet">
            {word.hanViet.toUpperCase()}
          </AppText>{' '}
          — cũng là chữ đó trong{' '}
          {withHanViet.map((c, i) => (
            <AppText key={c.simplified} variant="small" onPress={() => openWord(c.simplified)}>
              {i > 0 ? ' · ' : ''}
              {c.simplified}{' '}
              <AppText variant="small" bold color="hanviet">
                {c.hanViet}
              </AppText>
            </AppText>
          ))}
        </AppText>
      ) : null}
      {word.mnemonicVi && (
        <View style={[styles.mnemonic, { borderColor: theme.accent }]}>
          <AppText variant="small">
            <AppText variant="small" bold color="accent">
              Mẹo nhớ:{' '}
            </AppText>
            {word.mnemonicVi}
          </AppText>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  chars: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Spacing.sm },
  charRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  char: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 6,
    maxWidth: 220,
  },
  mnemonic: { borderLeftWidth: 3, paddingLeft: Spacing.md, marginTop: Spacing.xs },
});
