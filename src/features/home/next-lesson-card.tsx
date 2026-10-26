import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AppText, Button, ErrorNote, ProgressRing, Skeleton } from '@/components/ui';
import { alpha, Fonts, mix, panelShadow, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { hskLabel } from '@/lib/hsk';
import type { LearnPath } from '@/lib/types';
import { lessonMinutes, toUnits } from '@/lib/units';

/** Khung `.panel.tint-primary` của thẻ Học tiếp: nền đỏ 7% nhạt dần xuống trắng. */
function useHeroStyle() {
  const theme = useTheme();
  return {
    backgroundColor: theme.surface,
    backgroundImage: `linear-gradient(180deg, ${mix(theme.primary, theme.surface, 0.07)}, ${theme.surface})`,
    borderColor: alpha(theme.border, 0.8),
    boxShadow: panelShadow(theme),
  };
}

/**
 * Thẻ "Học tiếp" đầu Trang chủ (như `/learn` của web ở khổ điện thoại): vòng tiến độ · LỘ TRÌNH HSK N · TÊN CẤP ·
 * "Bài N: tên bài" · chữ Hán của bài · số từ, phút · nút BẮT ĐẦU HỌC / HỌC TIẾP (+ "Học phát âm trước" cho người
 * mới hoàn toàn ở HSK 1). Xem cấp khác cấp đang học thì có nút đổi sang học cấp đó; học hết cấp thì mời lên cấp.
 */
export function NextLessonCard({
  path,
  isCourse,
  loggedIn,
  switching,
  onChooseLevel,
}: {
  path: LearnPath;
  /** Cấp đang xem cũng là cấp đang học. */
  isCourse: boolean;
  loggedIn: boolean;
  switching: boolean;
  onChooseLevel: (level: number) => void;
}) {
  const theme = useTheme();
  const hero = useHeroStyle();
  const current = path.lessons.find((l) => l.id === path.currentLessonId) ?? null;
  const pct = path.totalLessons ? (path.completedLessons / path.totalLessons) * 100 : 0;
  const units = toUnits(path.lessons);
  const unitsDone = units.filter((u) => u.lessons.every((l) => l.lesson.status === 'COMPLETED')).length;
  const nextLevel = path.levels.find((l) => l > path.level);
  const levelName = path.level === 7 ? 'Cao cấp' : path.levelName;

  return (
    <View style={[styles.hero, hero]}>
      <ProgressRing value={pct} size={96} stroke={9.6}>
        <AppText weight="800" style={styles.pct}>
          {Math.round(pct)}%
        </AppText>
      </ProgressRing>
      <View>
        <AppText variant="caption" weight="700" color="primary" style={styles.eyebrow}>
          LỘ TRÌNH {hskLabel(path.level).toUpperCase()} · {levelName.toUpperCase()}
        </AppText>
        {current ? (
          <>
            <AppText weight="800" style={styles.title}>
              Bài {current.orderIndex}: {current.title}
            </AppText>
            <AppText color="muted" style={styles.meta}>
              <Text style={[styles.hanzi, { color: theme.primary }]}>{current.previewWords.join(' · ')}</Text>
              {` · ${current.wordCount} từ · ~${lessonMinutes(current.wordCount)} phút`}
            </AppText>
            <AppText variant="caption" color="muted" style={styles.done}>
              Đã xong {path.completedLessons}/{path.totalLessons} bài · {unitsDone}/{units.length} chủ đề
            </AppText>
            <View style={styles.actions}>
              <Button
                title={path.completedLessons === 0 ? 'BẮT ĐẦU HỌC' : 'HỌC TIẾP'}
                leftIcon="play"
                onPress={() => router.push(`/bai-hoc/${current.id}`)}
                style={styles.primary}
              />
              {path.level === 1 && path.completedLessons === 0 && (
                <Button
                  title="Học phát âm trước (10 phút)"
                  variant="secondary"
                  leftIcon="sound"
                  onPress={() => router.push('/phien-am')}
                />
              )}
              {loggedIn && !isCourse && (
                <Button
                  title={`Chọn học ${hskLabel(path.level)}`}
                  variant="secondary"
                  disabled={switching}
                  onPress={() => onChooseLevel(path.level)}
                />
              )}
            </View>
          </>
        ) : (
          <>
            <AppText weight="800" style={styles.title}>
              Bạn đã học hết {path.totalLessons} bài!
            </AppText>
            <AppText color="muted" style={styles.meta}>
              Từ đã học vẫn quay lại ở phần Ôn tập để bạn nhớ lâu.
            </AppText>
            {nextLevel && (
              <Button
                title={`Lên ${hskLabel(nextLevel)}`}
                icon="arrow"
                disabled={switching}
                onPress={() => onChooseLevel(nextLevel)}
                style={styles.next}
              />
            )}
          </>
        )}
      </View>
    </View>
  );
}

/** Khung chờ cùng bố cục với thẻ thật (vòng 96px + chữ + nút) để tải xong không đẩy các khối bên dưới. */
export function NextLessonSkeleton({ guest }: { guest: boolean }) {
  const hero = useHeroStyle();
  return (
    <View style={[styles.hero, hero]}>
      <Skeleton width={96} height={96} radius={48} />
      <View style={styles.skeletonText}>
        <Skeleton width={176} height={16} radius={4} />
        <Skeleton width={288} height={56} radius={4} style={styles.maxFull} />
        <Skeleton width={224} height={20} radius={4} style={styles.maxFull} />
        <Skeleton width={160} height={16} radius={4} />
        <Skeleton width={208} height={48} style={styles.skeletonButton} />
        {guest && <Skeleton width={208} height={48} />}
      </View>
    </View>
  );
}

/** Lỗi tải lộ trình: báo + nút tải lại, trong cùng khung thẻ. */
export function NextLessonError({ onRetry }: { onRetry: () => void }) {
  const hero = useHeroStyle();
  return (
    <View style={[styles.hero, hero]}>
      <ErrorNote>Chưa tải được lộ trình. Vui lòng thử lại.</ErrorNote>
      <Button title="Tải lại" variant="secondary" leftIcon="refresh" onPress={onRetry} style={styles.retry} />
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { borderWidth: 1, borderRadius: Radius.lg, padding: 20, gap: 20, overflow: 'hidden' },
  pct: { fontSize: 18 },
  eyebrow: { letterSpacing: 0.6 },
  title: { marginTop: 6, fontSize: 20, lineHeight: 28, letterSpacing: -0.5 },
  meta: { marginTop: 4 },
  hanzi: { fontFamily: Fonts.hanzi, fontSize: 16 },
  done: { marginTop: 4 },
  actions: { marginTop: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  primary: { minWidth: 208 },
  next: { marginTop: 16, alignSelf: 'flex-start' },
  skeletonText: { gap: 8 },
  skeletonButton: { marginTop: 8 },
  maxFull: { maxWidth: '100%' },
  retry: { alignSelf: 'flex-start' },
});
