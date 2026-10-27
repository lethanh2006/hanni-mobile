import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Hanzi, Icon } from '@/components/ui';
import { alpha } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { VideoCard as Video } from '@/lib/types';

export const KIND_VI: Record<string, string> = {
  PODCAST: 'Podcast',
  STORY: 'Truyện ngắn',
  SONG: 'Bài hát',
  DIALOGUE: 'Hội thoại',
  CLIP: 'Clip',
  OTHER: 'Khác',
};

/** Thẻ 1 video (`VideoCard` của web ở khổ điện thoại): ảnh 16:9 có nút phát + số câu + vạch tiến độ, nhãn cấp/thể loại, tên. */
export function VideoCard({ video }: { video: Video }) {
  const theme = useTheme();
  const thumb = video.thumbnailUrl ?? `https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`;
  const progress = Math.min(100, Math.max(0, video.progressPct || 0));

  return (
    <Pressable
      onPress={() => router.push(`/watch/${video.id}`)}
      style={({ pressed }) => [
        styles.card,
        {
          borderColor: pressed ? alpha(theme.primary, 0.26) : theme.border,
          backgroundColor: theme.surface,
          boxShadow: `0 3px 12px ${alpha(theme.text, 0.03)}`,
        },
      ]}>
      {({ pressed }) => (
        <>
          <View style={[styles.thumb, { backgroundColor: theme.surface2 }]}>
            <Image source={thumb} style={StyleSheet.absoluteFill} contentFit="cover" />
            <View style={[styles.play, pressed && { backgroundColor: theme.primary }]}>
              <Icon name="play" size={22} rawColor="#ffffff" />
            </View>
            <View style={styles.count}>
              <AppText variant="caption" style={styles.white}>
                {video.sentenceCount.toLocaleString('vi-VN')} câu
              </AppText>
            </View>
            {progress > 0 && <View style={[styles.progress, { width: `${progress}%`, backgroundColor: theme.primary }]} />}
          </View>
          <View style={styles.body}>
            <View style={styles.meta}>
              {video.hskLevel ? (
                <View style={[styles.level, { borderColor: theme.border, backgroundColor: theme.surface }]}>
                  <AppText variant="caption" weight="500">
                    HSK {video.hskLevel}
                  </AppText>
                </View>
              ) : null}
              <AppText variant="caption" color="muted">
                {KIND_VI[video.kind] ?? video.kind}
              </AppText>
              {video.isFree && (
                <AppText variant="caption" color="good" style={styles.free}>
                  Miễn phí
                </AppText>
              )}
            </View>
            <AppText weight="600" numberOfLines={2} color={pressed ? 'primary' : 'text'} style={styles.title}>
              {video.title}
            </AppText>
            {video.titleZh && (
              <Hanzi size={13} color="muted" numberOfLines={1} style={styles.titleZh}>
                {video.titleZh}
              </Hanzi>
            )}
            {progress > 0 && (
              <AppText variant="caption" color="muted" style={styles.foot}>
                {progress >= 100 ? 'Đã hoàn thành' : `${Math.round(progress)}% đã học`}
              </AppText>
            )}
          </View>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 16, padding: 6 },
  thumb: { aspectRatio: 16 / 9, borderRadius: 12, overflow: 'hidden' },
  play: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 46,
    height: 46,
    marginTop: -23,
    marginLeft: -23,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.33)',
    backgroundColor: 'rgba(16,24,32,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    borderRadius: 5,
    paddingHorizontal: 7,
    paddingVertical: 3,
    backgroundColor: 'rgba(16,24,32,0.75)',
  },
  white: { color: '#ffffff' },
  progress: { position: 'absolute', left: 0, bottom: 0, height: 3 },
  body: { paddingHorizontal: 8, paddingBottom: 10 },
  meta: { marginTop: 13, marginBottom: 9, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  level: { borderWidth: 1, borderRadius: 5, paddingHorizontal: 7, paddingVertical: 3 },
  free: { marginLeft: 'auto' },
  title: { fontSize: 15, lineHeight: 23, letterSpacing: -0.2 },
  titleZh: { marginTop: 5 },
  foot: { paddingTop: 12 },
});
