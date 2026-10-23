import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import useSWR from 'swr';

import { AppText, AudioButton, Card, Icon } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { hskLabel } from '@/lib/hsk';
import type { Word } from '@/lib/types';

/** 1 từ cố định theo ngày trong đúng cấp đang học. Lỗi/chưa tải thì ẩn — đây là nội dung phụ. */
export function WordOfTheDay({ level }: { level?: number }) {
  const theme = useTheme();
  const { data } = useSWR<Word>(`/words/of-the-day${level ? `?level=${level}` : ''}`);
  if (!data) return null;
  const example = data.examples?.[0];

  return (
    <Card>
      <View style={styles.row}>
        <Icon name="spark" size={14} color="primary" />
        <AppText variant="label" color="primary" style={styles.flex}>
          Từ vựng hôm nay
        </AppText>
        <AppText variant="caption" color="muted">
          {hskLabel(data.hskLevel)}
        </AppText>
      </View>
      <View style={styles.row}>
        <AppText style={styles.hanzi}>{data.simplified}</AppText>
        <View style={styles.flex}>
          <View style={styles.row}>
            <AppText color="muted">{data.pinyin}</AppText>
            <AudioButton src={data.audioUrl} />
          </View>
          {data.hanViet && (
            <AppText variant="small" color="muted">
              Hán Việt:{' '}
              <AppText variant="small" bold color="hanviet">
                {data.hanViet}
              </AppText>
            </AppText>
          )}
          <AppText variant="small">{data.meaningVi}</AppText>
        </View>
        {data.imageUrl && <Image source={data.imageUrl} style={styles.image} contentFit="cover" />}
      </View>
      {example && (
        <View style={[styles.example, { backgroundColor: theme.surface2 }]}>
          <AppText>{example.zh}</AppText>
          {example.pinyin && (
            <AppText variant="caption" color="muted">
              {example.pinyin}
            </AppText>
          )}
          {example.vi && <AppText variant="caption">{example.vi}</AppText>}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  flex: { flex: 1 },
  hanzi: { fontSize: 44, lineHeight: 56 },
  image: { width: 64, height: 64, borderRadius: Radius.md },
  example: { borderRadius: Radius.md, padding: Spacing.md, gap: 2 },
});
