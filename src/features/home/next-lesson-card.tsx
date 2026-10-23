import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, Card, ProgressBar } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { hskLabel } from '@/lib/hsk';
import type { LearnPath } from '@/lib/types';
import { lessonMinutes, toUnits } from '@/lib/units';

/**
 * MỘT lộ trình, MỘT nút "Học tiếp": bài nên học tiếp của cấp đang xem.
 * Xem cấp khác cấp đang học thì có nút đổi sang học cấp đó; học hết cấp thì mời lên cấp.
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
  const current = path.lessons.find((l) => l.id === path.currentLessonId) ?? null;
  const pct = path.totalLessons ? (path.completedLessons / path.totalLessons) * 100 : 0;
  const units = toUnits(path.lessons);
  const unitsDone = units.filter((u) => u.lessons.every((l) => l.lesson.status === 'COMPLETED')).length;
  const nextLevel = path.levels.find((l) => l > path.level);

  return (
    <Card style={{ backgroundColor: theme.primarySoft, borderColor: theme.primarySoft }}>
      <AppText variant="label" color="primary">
        Lộ trình {hskLabel(path.level)} · {path.levelName}
      </AppText>
      {current ? (
        <>
          <AppText variant="title">
            Bài {current.orderIndex}: {current.title}
          </AppText>
          <AppText color="primary">{current.previewWords.join(' · ')}</AppText>
          <AppText variant="small" color="muted">
            {current.wordCount} từ · ~{lessonMinutes(current.wordCount)} phút
          </AppText>
          <View style={styles.progress}>
            <ProgressBar value={pct} />
            <AppText variant="caption" color="muted">
              Đã xong {path.completedLessons}/{path.totalLessons} bài · {unitsDone}/{units.length} chủ đề
            </AppText>
          </View>
          <Button
            title={path.completedLessons === 0 ? 'Bắt đầu học' : 'Học tiếp'}
            icon="play"
            onPress={() => router.push(`/bai-hoc/${current.id}`)}
          />
          {loggedIn && !isCourse && (
            <Button
              title={`Chọn học ${hskLabel(path.level)}`}
              variant="secondary"
              loading={switching}
              onPress={() => onChooseLevel(path.level)}
            />
          )}
        </>
      ) : (
        <>
          <AppText variant="title">Bạn đã học hết {path.totalLessons} bài!</AppText>
          <AppText variant="small" color="muted">
            Từ đã học vẫn quay lại ở phần Ôn tập để bạn nhớ lâu.
          </AppText>
          {nextLevel && (
            <Button
              title={`Lên ${hskLabel(nextLevel)}`}
              icon="arrow"
              loading={switching}
              onPress={() => onChooseLevel(nextLevel)}
            />
          )}
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  progress: { gap: 4, marginVertical: Spacing.xs },
});
