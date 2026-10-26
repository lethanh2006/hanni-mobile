import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { AppText, AudioButton, Card, Hanzi } from '@/components/ui';
import { alpha } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { POS_VI } from '@/lib/hsk';
import type { Word } from '@/lib/types';

/**
 * 1 từ trong danh sách từ vựng của bài (`/learn/[lessonId]` của web): số thứ tự, chữ to + loa + từ loại, pinyin +
 * âm Hán Việt, nghĩa, câu ví dụ đầu tiên. `showMeaning = false` để tự ôn: ẩn nghĩa và cả âm Hán Việt (âm Hán Việt
 * hay để lộ luôn nghĩa, vd 时间 = thời gian).
 */
export function WordCard({ word, index, showMeaning }: { word: Word; index: number; showMeaning: boolean }) {
  const theme = useTheme();
  const example = word.examples?.[0];
  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <View style={[styles.index, { backgroundColor: theme.surface2 }]}>
          <AppText variant="caption" weight="600" color="muted">
            {String(index + 1).padStart(2, '0')}
          </AppText>
        </View>
        {word.imageUrl && <Image source={word.imageUrl} style={styles.image} contentFit="cover" />}
        <View style={styles.flex}>
          <View style={styles.head}>
            <Hanzi size={30}>{word.simplified}</Hanzi>
            <AudioButton src={word.audioUrl} tint />
            {word.pos.length > 0 && (
              <View style={[styles.pos, { backgroundColor: theme.surface2 }]}>
                <AppText variant="caption" color="muted">
                  {word.pos.map((p) => POS_VI[p] ?? p).join(' · ')}
                </AppText>
              </View>
            )}
          </View>
          <View style={styles.pinyin}>
            <AppText color="primary">{word.pinyin}</AppText>
            {showMeaning && word.hanViet && (
              <View style={[styles.hanviet, { backgroundColor: alpha(theme.hanviet, 0.1) }]}>
                <AppText variant="caption" weight="600" color="hanviet">
                  Hán Việt: {word.hanViet}
                </AppText>
              </View>
            )}
          </View>
          {showMeaning ? (
            <AppText weight="500" style={styles.meaning}>
              {word.meaningVi ?? word.meaningEn ?? 'Nghĩa đang được cập nhật'}
            </AppText>
          ) : (
            <AppText color="muted" style={[styles.meaning, styles.italic]}>
              Thử nhớ nghĩa của từ này
            </AppText>
          )}
          {example && (
            <View style={[styles.example, { borderColor: alpha(theme.primary, 0.2) }]}>
              <Hanzi size={18} style={styles.exampleZh}>
                {example.zh}
              </Hanzi>
              {showMeaning && (example.vi || example.en) && (
                <AppText variant="caption" color="muted" style={styles.exampleVi}>
                  {example.vi ?? example.en}
                </AppText>
              )}
            </View>
          )}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 0 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
  index: { marginTop: 4, width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  image: { marginTop: 2, width: 64, height: 64, borderRadius: 12 },
  flex: { flex: 1, minWidth: 0 },
  head: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12 },
  pos: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  pinyin: { marginTop: 8, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 8, rowGap: 4 },
  hanviet: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  meaning: { marginTop: 8, lineHeight: 24 },
  italic: { fontStyle: 'italic' },
  example: { marginTop: 16, borderLeftWidth: 2, paddingLeft: 16 },
  exampleZh: { lineHeight: 28 },
  exampleVi: { marginTop: 4, lineHeight: 20 },
});
