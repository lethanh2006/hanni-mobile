import { router, type Href } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, type ScrollViewInstance } from 'react-native';

import { AppText, Card, Icon } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { LessonNode } from '@/lib/types';
import { lessonMinutes, toUnits } from '@/lib/units';

/** `learn`: lộ trình ở Trang chủ (bấm bài → học). `review`: chọn bộ thẻ ở tab Ôn tập (đã học → ôn, chưa → học trước). */
type Variant = 'learn' | 'review';

const isDone = (l: LessonNode, v: Variant) => (v === 'learn' ? l.status === 'COMPLETED' : l.startedWords > 0);

function lessonHref(l: LessonNode, v: Variant): Href {
  if (v === 'review' && l.startedWords > 0) return { pathname: '/review', params: { lesson: l.id } };
  return `/bai-hoc/${l.id}`;
}

/**
 * Chọn bài theo CHỦ ĐỀ: dải chủ đề cuộn ngang (mặc định mở chủ đề chứa bài nên học tiếp)
 * + danh sách bài của chủ đề đang chọn. Dùng chung cho Trang chủ và tab Ôn tập.
 */
export function TopicExplorer({
  lessons,
  currentLessonId,
  variant = 'learn',
}: {
  lessons: LessonNode[];
  currentLessonId: string | null;
  variant?: Variant;
}) {
  const theme = useTheme();
  const units = toUnits(lessons);
  const currentUnit = Math.max(
    0,
    units.findIndex((u) => u.lessons.some((l) => l.lesson.id === currentLessonId)),
  );
  const [picked, setPicked] = useState<number | null>(null);
  const chipsRef = useRef<ScrollViewInstance>(null);
  const active = units[picked ?? currentUnit] ?? units[0];
  if (!active) return null;
  const activeDone = active.lessons.filter((l) => isDone(l.lesson, variant)).length;

  return (
    <View style={styles.wrap}>
      <ScrollView ref={chipsRef} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {units.map((u, i) => {
          const done = u.lessons.filter((l) => isDone(l.lesson, variant)).length;
          const selected = u === active;
          const finished = done === u.lessons.length;
          return (
            <Pressable
              key={`${u.title}-${i}`}
              onPress={() => setPicked(i)}
              // Đưa chủ đề đang học vào tầm nhìn ngay lần đầu hiện ra.
              onLayout={(e) => {
                if (i === currentUnit && picked === null) {
                  chipsRef.current?.scrollTo({ x: Math.max(0, e.nativeEvent.layout.x - Spacing.lg), animated: false });
                }
              }}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              style={[
                styles.chip,
                selected
                  ? { backgroundColor: theme.primarySoft, borderColor: theme.primary }
                  : { backgroundColor: theme.surface, borderColor: theme.border },
              ]}>
              <Icon name={finished ? 'check' : u.icon} size={16} color={finished ? 'good' : selected ? 'primary' : 'muted'} />
              <AppText variant="small" bold color={selected ? 'primary' : 'text'} numberOfLines={1} style={styles.chipTitle}>
                {u.title}
              </AppText>
              <AppText variant="caption" color="muted">
                {done}/{u.lessons.length}
              </AppText>
            </Pressable>
          );
        })}
      </ScrollView>

      <AppText variant="small" color="muted">
        {active.title} · {active.lessons.length} bài · {activeDone} {variant === 'review' ? 'bài đã học' : 'đã hoàn thành'}
      </AppText>

      {active.lessons.map(({ lesson, part }) => {
        const done = isDone(lesson, variant);
        const isCurrent = variant === 'learn' && lesson.id === currentLessonId;
        return (
          <Card
            key={lesson.id}
            onPress={() => router.push(lessonHref(lesson, variant))}
            style={isCurrent && { borderColor: theme.primary, backgroundColor: theme.primarySoft }}>
            <View style={styles.row}>
              <View
                style={[
                  styles.circle,
                  { backgroundColor: done ? theme.good : isCurrent ? theme.primary : theme.surface2 },
                ]}>
                {done ? (
                  <Icon name="check" size={18} color="surface" />
                ) : (
                  <AppText bold color={isCurrent ? 'primaryText' : 'muted'}>
                    {lesson.orderIndex}
                  </AppText>
                )}
              </View>
              <View style={styles.flex}>
                <AppText bold>
                  Bài {lesson.orderIndex}
                  {part ? ` · phần ${part}` : ''}
                  {isCurrent ? '  · HỌC TIẾP' : ''}
                </AppText>
                <AppText color="primary" numberOfLines={1}>
                  {lesson.previewWords.join(' · ')}
                </AppText>
                <AppText variant="caption" color="muted">
                  {variant === 'review'
                    ? done
                      ? `Đã học ${lesson.startedWords}/${lesson.wordCount} từ · Ôn flashcard`
                      : 'Chưa học · Học trước'
                    : `${lesson.wordCount} từ · ~${lessonMinutes(lesson.wordCount)} phút`}
                </AppText>
              </View>
              <Pressable
                onPress={() => router.push(`/learn/${lesson.id}`)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`Xem từ vựng bài ${lesson.orderIndex}`}
                style={styles.wordsButton}>
                <Icon name="book" size={18} color="muted" />
              </Pressable>
            </View>
          </Card>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.md },
  chips: { gap: Spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipTitle: { maxWidth: 180 },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  flex: { flex: 1, gap: 2 },
  circle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  wordsButton: { padding: 6 },
});
