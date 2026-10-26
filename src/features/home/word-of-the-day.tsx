import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import useSWR from 'swr';

import { AppText, AudioButton, Card, Hanzi, Icon } from '@/components/ui';
import { alpha, mix } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Word } from '@/lib/types';

/**
 * Thẻ "Từ vựng hôm nay" (`WordOfTheDayCard` của web): 1 từ cố định theo ngày trong đúng cấp đang học, chữ Hán trong
 * ô vàng đồng nghiêng, pinyin + loa, Hán Việt, nghĩa, câu ví dụ, "Tìm hiểu 字 →" mở trang của chính từ đó.
 * Lỗi/chưa tải thì ẩn — đây là nội dung phụ.
 */
export function WordOfTheDay({ level }: { level?: number }) {
  const theme = useTheme();
  const { data } = useSWR<Word>(`/words/of-the-day${level ? `?level=${level}` : ''}`);
  if (!data) return null;
  const long = Array.from(data.simplified).length > 2;
  const example = data.examples?.[0];

  return (
    <Card
      style={[
        styles.card,
        { backgroundImage: `linear-gradient(130deg, ${mix(theme.accent, theme.surface, 0.06)}, ${theme.surface} 85%)` },
      ]}>
      {/* 2 vòng tròn trang trí góc dưới phải như ::before/::after của web. */}
      <View style={[styles.ring, { borderColor: alpha(theme.accent, 0.1) }]} pointerEvents="none" />
      <View style={[styles.ring, styles.ringSmall, { borderColor: alpha(theme.accent, 0.1) }]} pointerEvents="none" />

      <View style={styles.topline}>
        <View style={styles.label}>
          <Icon name="spark" size={14} color="accent" />
          <AppText variant="caption" weight="600" color="accent">
            Từ vựng hôm nay
          </AppText>
        </View>
        <View
          style={[
            styles.level,
            { borderColor: mix(theme.accent, theme.border, 0.15), backgroundColor: theme.surface },
          ]}>
          <AppText variant="caption" weight="600" color="accent">
            HSK {data.hskLevel}
          </AppText>
        </View>
      </View>

      <View style={styles.word}>
        <View
          style={[
            styles.character,
            {
              borderColor: mix(theme.accent, theme.border, 0.18),
              backgroundColor: theme.surface,
              boxShadow: `0 5px 0 ${mix(theme.accent, theme.surface, 0.1)}, 0 12px 22px -18px ${alpha(theme.accent, 0.35)}`,
            },
          ]}>
          <Hanzi size={long ? 22 : 31} color="accent" style={styles.characterText}>
            {data.simplified}
          </Hanzi>
        </View>
        <View style={styles.definition}>
          <View style={styles.pinyin}>
            <AppText weight="700" style={styles.pinyinText}>
              {data.pinyin}
            </AppText>
            <AudioButton src={data.audioUrl} size={15} />
          </View>
          {data.hanViet && (
            <AppText variant="caption" color="muted">
              Hán Việt:{' '}
              <AppText variant="caption" weight="700" color="hanviet">
                {data.hanViet}
              </AppText>
            </AppText>
          )}
          <AppText color="muted" style={styles.meaning}>
            {data.meaningVi}
          </AppText>
        </View>
        {data.imageUrl && <Image source={data.imageUrl} style={styles.image} contentFit="cover" />}
      </View>

      {example && (
        <View style={[styles.example, { backgroundColor: alpha(theme.surface2, 0.6) }]}>
          <Hanzi size={16}>{example.zh}</Hanzi>
          {example.pinyin && (
            <AppText variant="caption" color="muted">
              {example.pinyin}
            </AppText>
          )}
          {example.vi && (
            <AppText variant="caption" style={styles.exampleVi}>
              {example.vi}
            </AppText>
          )}
        </View>
      )}

      <Pressable
        onPress={() => router.push(`/tu-dien/${encodeURIComponent(data.simplified)}`)}
        style={[styles.action, { borderColor: mix(theme.accent, theme.border, 0.12) }]}>
        <AppText variant="caption" weight="600" color="primary">
          Tìm hiểu {data.simplified}
        </AppText>
        <View style={[styles.actionIcon, { backgroundColor: mix(theme.primary, theme.surface, 0.06) }]}>
          <Icon name="arrow" size={15} color="primary" />
        </View>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 0, overflow: 'hidden' },
  ring: {
    position: 'absolute',
    right: -72,
    bottom: -92,
    width: 240,
    height: 240,
    borderWidth: 1,
    borderRadius: 120,
  },
  ringSmall: { right: -38, bottom: -58, width: 172, height: 172, borderRadius: 86, borderStyle: 'dashed' },
  topline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  label: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  level: { borderWidth: 1, borderRadius: 7, paddingHorizontal: 7, paddingVertical: 3 },
  word: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 20 },
  character: {
    width: 72,
    minHeight: 72,
    borderWidth: 1,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    transform: [{ rotate: '-6deg' }],
  },
  characterText: { textAlign: 'center' },
  definition: { flex: 1, minWidth: 0 },
  pinyin: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  pinyinText: { fontSize: 17, lineHeight: 24 },
  meaning: { marginTop: 7, lineHeight: 24 },
  image: { width: 64, height: 64, borderRadius: 12 },
  example: { marginTop: 12, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  exampleVi: { marginTop: 2 },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 'auto',
    paddingTop: 13,
    borderTopWidth: 1,
  },
  actionIcon: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
