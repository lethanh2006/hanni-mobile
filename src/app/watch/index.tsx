import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ProgressiveList } from '@/components/progressive-list';
import { AppText, Button, EmptyState, ErrorNote, Icon, NextStep, PageHeader, Screen, SectionHeading } from '@/components/ui';
import { alpha, Fonts, mix, panelShadow } from '@/constants/theme';
import { VideoCard } from '@/features/video/video-card';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth';
import { useVideos } from '@/lib/hooks';

const KINDS = [
  ['', 'Tất cả'],
  ['PODCAST', 'Podcast'],
  ['STORY', 'Truyện ngắn'],
  ['DIALOGUE', 'Hội thoại'],
  ['SONG', 'Bài hát'],
] as const;

/** Nút chọn cấp (`LevelFilter` của web): viền mảnh, đang chọn viền + nền đỏ nhạt. */
function LevelButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityState={{ selected: active }}
      style={[
        styles.level,
        active
          ? { borderColor: alpha(theme.primary, 0.5), backgroundColor: mix(theme.primary, theme.surface, 0.1) }
          : { borderColor: theme.border, backgroundColor: theme.surface },
      ]}>
      <AppText variant="caption" weight={active ? '700' : '500'} color={active ? 'primary' : 'muted'}>
        {label}
      </AppText>
    </Pressable>
  );
}

/**
 * Học qua video (`/watch` của web ở khổ điện thoại): đầu trang + ghi chú phụ đề, "Tiếp tục khám phá" video đang xem dở,
 * khối lọc (tìm theo tên, cấp độ có video, thể loại), danh sách thẻ video mở dần 6 cái một, NextStep. Khách xem được.
 */
export default function WatchScreen() {
  const theme = useTheme();
  const { loading } = useAuth();
  const [kind, setKind] = useState('');
  const [level, setLevel] = useState<number | undefined>();
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const { data, isLoading, error, mutate } = useVideos({ kind: kind || undefined, level });
  // Chỉ bày những cấp thật sự có video (kho hiện toàn HSK 4–5 — các chip khác bấm vào là trống).
  const { data: allVideos } = useVideos();
  const levelsWithVideos = [...new Set((allVideos ?? []).map((v) => v.hskLevel).filter((l): l is number => !!l))].sort(
    (a, b) => a - b,
  );
  const updating = Boolean(data) && isLoading;
  const term = query.trim().toLocaleLowerCase('vi');
  const list = (data ?? []).filter((v) => `${v.title} ${v.titleZh ?? ''}`.toLocaleLowerCase('vi').includes(term));
  // Chỉ gợi ý xem tiếp khi có tiến độ thực, và không lọc thư viện.
  const resume = !kind && !level && !term ? data?.find((v) => v.progressPct > 0 && v.progressPct < 100) : undefined;
  const filtered = Boolean(kind || level || query);

  function clearFilters() {
    setKind('');
    setLevel(undefined);
    setQuery('');
  }

  return (
    <Screen onRefresh={() => void mutate()}>
      <Stack.Screen options={{ title: 'Học qua video' }} />
      <View style={styles.head}>
        <PageHeader
          icon="play"
          tone="good"
          title="Học qua video"
          description="Phụ đề song ngữ chạy theo lời thoại, bấm từ để tra và lưu."
        />
        <View style={[styles.captionNote, { borderColor: theme.border, backgroundColor: alpha(theme.surface, 0.8) }]}>
          <Icon name="headphones" size={17} color="muted" />
          <AppText variant="caption" color="muted">
            Hán tự · Pinyin · Nghĩa tiếng Việt
          </AppText>
        </View>
      </View>

      {resume && !error && (
        <Pressable
          onPress={() => router.push(`/watch/${resume.id}`)}
          style={[
            styles.resume,
            {
              borderColor: mix(theme.primary, theme.border, 0.14),
              backgroundColor: mix(theme.primary, theme.surface, 0.03),
              boxShadow: `0 3px 14px ${alpha(theme.text, 0.03)}`,
            },
          ]}>
          <View style={[styles.resumeIcon, { backgroundColor: theme.primary }]}>
            <Icon name="play" size={20} color="primaryText" />
          </View>
          <View style={styles.flex}>
            <AppText variant="caption" weight="500" color="primary">
              Tiếp tục khám phá
            </AppText>
            <AppText weight="600" numberOfLines={1} style={styles.resumeTitle}>
              {resume.title}
            </AppText>
          </View>
          <Icon name="arrow" size={18} color="primary" />
        </Pressable>
      )}

      <View style={styles.library}>
        <View
          style={[
            styles.toolbar,
            {
              borderColor: theme.border,
              backgroundColor: theme.surface,
              backgroundImage: `radial-gradient(ellipse at top right, ${alpha(theme.primary, 0.04)}, transparent 65%)`,
              boxShadow: panelShadow(theme),
            },
          ]}>
          <SectionHeading
            icon="play"
            title="Khám phá video"
            tone="good"
            description={
              updating
                ? 'Đang cập nhật danh sách…'
                : isLoading || loading
                  ? 'Đang tìm nội dung cho bạn…'
                  : error
                    ? data
                      ? 'Đang hiển thị danh sách đã tải trước đó'
                      : 'Thư viện tạm thời chưa tải được'
                    : `${list.length} video${level ? ` · HSK ${level}` : ' cho mọi cấp độ'}`
            }
            right={
              <View
                style={[
                  styles.search,
                  focused
                    ? { borderColor: theme.primary, outlineColor: alpha(theme.primary, 0.12), outlineWidth: 3, outlineStyle: 'solid' }
                    : { borderColor: theme.border },
                  { backgroundColor: theme.surface },
                ]}>
                <Icon name="search" size={17} color="muted" />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  placeholder="Tìm video bạn muốn xem…"
                  placeholderTextColor={theme.muted}
                  accessibilityLabel="Tìm video theo tên"
                  returnKeyType="search"
                  // Web: chữ gõ 16px (iOS khỏi phóng to), chữ gợi ý 13px.
                  style={[styles.searchInput, { color: theme.text, fontSize: query ? 16 : 13 }]}
                />
              </View>
            }
          />
          <View style={styles.filter}>
            <AppText variant="caption" weight="500" color="muted">
              Cấp độ
            </AppText>
            <View style={styles.levels}>
              <LevelButton label="Mọi cấp" active={level === undefined} onPress={() => setLevel(undefined)} />
              {levelsWithVideos.map((l) => (
                <LevelButton key={l} label={`HSK ${l}`} active={level === l} onPress={() => setLevel(l)} />
              ))}
            </View>
          </View>
          <View style={styles.filter}>
            <AppText variant="caption" weight="500" color="muted">
              Thể loại
            </AppText>
            <View style={[styles.kinds, { backgroundColor: theme.surface2 }]} accessibilityLabel="Lọc thể loại video">
              {KINDS.map(([value, label]) => {
                const on = kind === value;
                return (
                  <Pressable
                    key={value}
                    onPress={() => setKind(value)}
                    accessibilityState={{ selected: on }}
                    style={[
                      styles.kind,
                      on && { borderColor: alpha(theme.primary, 0.5), backgroundColor: mix(theme.primary, theme.surface, 0.1) },
                    ]}>
                    <AppText variant="caption" weight={on ? '700' : '400'} color={on ? 'primary' : 'muted'}>
                      {label}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
            {filtered && (
              <Pressable onPress={clearFilters} style={styles.clear}>
                <Icon name="close" size={13} color="muted" />
                <AppText variant="caption" color="muted">
                  Xóa bộ lọc
                </AppText>
              </Pressable>
            )}
          </View>
        </View>

        <View style={[styles.results, updating && styles.updating]}>
          {error && (
            <ErrorNote>
              {data ? 'Chưa cập nhật được danh sách. Các video trước vẫn được giữ lại.' : 'Chưa tải được video.'}{' '}
              <AppText weight="600" color="danger" style={styles.underline} onPress={() => void mutate()}>
                Thử lại
              </AppText>
            </ErrorNote>
          )}
          {loading || (isLoading && !data) ? (
            <View style={styles.grid} accessibilityLabel="Đang tải video">
              {Array.from({ length: 3 }, (_, i) => (
                <View key={i} style={[styles.skeleton, { borderColor: theme.border }]}>
                  <View style={[styles.skeletonThumb, { backgroundColor: theme.surface2 }]} />
                  <View style={[styles.skeletonLine, { backgroundColor: theme.surface2 }]} />
                  <View style={[styles.skeletonLine, styles.skeletonShort, { backgroundColor: theme.surface2 }]} />
                </View>
              ))}
            </View>
          ) : error && !data ? null : list.length ? (
            <ProgressiveList
              key={`${kind}:${level ?? ''}:${term}:${list.length}`}
              items={list}
              itemLabel="video"
              renderItems={(visible) => (
                <View style={styles.grid}>
                  {visible.map((v) => (
                    <VideoCard key={v.id} video={v} />
                  ))}
                </View>
              )}
            />
          ) : updating ? (
            <View style={styles.pending}>
              <Icon name="search" size={24} color="muted" />
              <AppText color="muted">Đang tìm video phù hợp…</AppText>
            </View>
          ) : (
            <EmptyState
              title="Chưa có video phù hợp"
              description="Thử một từ khóa, cấp độ hoặc thể loại khác để tìm câu chuyện tiếp theo.">
              {filtered && <Button title="Xem tất cả video" variant="secondary" onPress={clearFilters} />}
            </EmptyState>
          )}
        </View>
      </View>

      {/* Video là cách học phụ — gốc vẫn là lộ trình + ôn tập. */}
      <NextStep
        title="Xem video là để gặp lại từ đã học"
        description="Bấm vào từ trong bản chép để lưu vào danh sách ôn. Nhưng vốn từ nền vẫn đến từ lộ trình bài học."
        actions={[
          { href: '/', label: 'Lộ trình HSK', icon: 'route' },
          { href: '/study', label: 'Ôn tập flashcard', icon: 'cards' },
        ]}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  head: { gap: 12 },
  captionNote: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  resume: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 16, padding: 16 },
  resumeIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  resumeTitle: { marginTop: 4 },
  library: { gap: 20 },
  toolbar: { gap: 12, borderWidth: 1, borderRadius: 16, padding: 16 },
  search: {
    width: '100%',
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
  },
  searchInput: { flex: 1, minWidth: 0, minHeight: 42, fontFamily: Fonts.sans, padding: 0 },
  filter: { gap: 8 },
  levels: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  level: { minHeight: 44, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9, justifyContent: 'center' },
  kinds: { flexDirection: 'row', flexWrap: 'wrap', gap: 2, padding: 4, borderRadius: 11 },
  kind: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    justifyContent: 'center',
  },
  clear: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-end' },
  results: { minHeight: 260, gap: 18 },
  updating: { opacity: 0.68 },
  underline: { textDecorationLine: 'underline' },
  grid: { gap: 26 },
  skeleton: { borderWidth: 1, borderRadius: 16, padding: 7, paddingBottom: 22, gap: 10 },
  skeletonThumb: { aspectRatio: 16 / 9, borderRadius: 12 },
  skeletonLine: { height: 12, borderRadius: 6, width: '70%' },
  skeletonShort: { width: '40%' },
  pending: { minHeight: 260, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
});
