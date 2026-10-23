import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { AppText, AudioButton, Card } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { POS_VI } from '@/lib/hsk';
import type { Word } from '@/lib/types';

/**
 * 1 từ trong danh sách từ vựng của bài. `showMeaning = false` để tự ôn:
 * ẩn nghĩa và cả âm Hán Việt (âm Hán Việt hay để lộ luôn nghĩa, vd 时间 = thời gian).
 */
export function WordCard({ word, index, showMeaning }: { word: Word; index: number; showMeaning: boolean }) {
  const theme = useTheme();
  const example = word.examples?.[0];
  return (
    <Card>
      <View style={styles.row}>
        <AppText variant="caption" color="muted">
          {String(index + 1).padStart(2, '0')}
        </AppText>
        {word.imageUrl && <Image source={word.imageUrl} style={styles.image} contentFit="cover" />}
        <AppText style={styles.hanzi}>{word.simplified}</AppText>
        <AudioButton src={word.audioUrl} />
        <View style={styles.flex} />
        {word.pos.length > 0 && (
          <AppText variant="caption" color="muted">
            {word.pos.map((p) => POS_VI[p] ?? p).join(' · ')}
          </AppText>
        )}
      </View>
      <AppText color="primary">
        {word.pinyin}
        {showMeaning && word.hanViet ? (
          <AppText variant="small" bold color="hanviet">
            {'  '}Hán Việt: {word.hanViet}
          </AppText>
        ) : null}
      </AppText>
      {showMeaning ? (
        <AppText>{word.meaningVi ?? word.meaningEn ?? 'Nghĩa đang được cập nhật'}</AppText>
      ) : (
        <AppText variant="small" color="muted">
          Thử nhớ nghĩa của từ này
        </AppText>
      )}
      {example && (
        <View style={[styles.example, { borderColor: theme.primarySoft }]}>
          <AppText variant="heading">{example.zh}</AppText>
          {showMeaning && (example.vi || example.en) && (
            <AppText variant="caption" color="muted">
              {example.vi ?? example.en}
            </AppText>
          )}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  flex: { flex: 1 },
  hanzi: { fontSize: 30, lineHeight: 38 },
  image: { width: 48, height: 48, borderRadius: Radius.md },
  example: { borderLeftWidth: 3, paddingLeft: Spacing.md, gap: 2, marginTop: Spacing.xs },
});
