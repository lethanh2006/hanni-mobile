import { Image } from 'expo-image';
import { router } from 'expo-router';
import type { LayoutChangeEvent } from 'react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Hanzi, Icon } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';

import type { VideoUsage } from './types';
import { WordSection } from './word-header';

/** "Nghe 学 trong video" (mục Video ở trang từ của web): video có câu thoại chứa từ này, bấm mở màn xem video. */
export function VideoSection({
  word,
  videos,
  onLayout,
}: {
  word: string;
  videos: VideoUsage[];
  onLayout?: (e: LayoutChangeEvent) => void;
}) {
  const theme = useTheme();
  if (videos.length === 0) return null;
  return (
    <WordSection
      icon="play"
      title={
        <AppText weight="700" style={styles.title}>
          Nghe <Hanzi size={16}>{word}</Hanzi> trong video
        </AppText>
      }
      onLayout={onLayout}>
      <View style={styles.list}>
        {videos.map((v) => (
          <Pressable
            key={v.id}
            onPress={() => router.push(`/watch/${v.id}`)}
            style={({ pressed }) => [
              styles.row,
              { borderColor: theme.border, backgroundColor: pressed ? theme.surface2 : theme.surface },
            ]}>
            {v.thumbnailUrl && <Image source={v.thumbnailUrl} style={styles.thumb} contentFit="cover" />}
            <View style={styles.flex}>
              <AppText weight="500" numberOfLines={1}>
                {v.title}
              </AppText>
              <AppText variant="caption" color="muted">
                {v.lineCount} câu có từ này
              </AppText>
            </View>
            <View style={styles.play}>
              <Icon name="play" size={16} color="primary" />
            </View>
          </Pressable>
        ))}
      </View>
    </WordSection>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 16, lineHeight: 24 },
  list: { gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 12, padding: 8 },
  thumb: { width: 80, height: 48, borderRadius: 8 },
  flex: { flex: 1, minWidth: 0 },
  play: { marginRight: 8 },
});
