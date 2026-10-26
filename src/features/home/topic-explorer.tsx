import { router, type Href } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, type ScrollViewInstance } from 'react-native';

import { AppText, AudioButton, Card, Hanzi, Icon, Skeleton } from '@/components/ui';
import { alpha } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useLesson } from '@/lib/hooks';
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
 * Chọn bài theo CHỦ ĐỀ (`TopicExplorer` của web ở khổ điện thoại): khung trên là dải chủ đề cuộn ngang (mở sẵn chủ
 * đề chứa bài nên học tiếp), khung dưới là các bài của chủ đề đang chọn + từ vựng của 1 bài.
 * Dùng chung cho Trang chủ và tab Ôn tập.
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
  const listRef = useRef<ScrollViewInstance>(null);
  const active = units[picked ?? currentUnit] ?? units[0];
  if (!active) return null;
  const activeDone = active.lessons.filter((l) => isDone(l.lesson, variant)).length;
  // Bài để xem trước từ vựng: lộ trình → bài nên học tiếp (hoặc bài đầu chưa xong); ôn tập → bài đầu đã học.
  const featured =
    variant === 'review'
      ? (active.lessons.find((l) => l.lesson.startedWords > 0) ??
        active.lessons.find((l) => l.lesson.id === currentLessonId) ??
        active.lessons[0])
      : (active.lessons.find((l) => l.lesson.id === currentLessonId) ??
        active.lessons.find((l) => l.lesson.status !== 'COMPLETED') ??
        active.lessons[0]);

  return (
    <View style={styles.wrap}>
      <Card style={styles.topics}>
        <ScrollView ref={listRef} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.topicRow}>
          {units.map((u, i) => {
            const done = u.lessons.filter((l) => isDone(l.lesson, variant)).length;
            const selected = u === active;
            const finished = done === u.lessons.length;
            return (
              <Pressable
                key={`${u.title}-${i}`}
                onPress={() => setPicked(i)}
                // Đưa chủ đề đang học vào tầm nhìn TRONG dải (không kéo cả trang).
                onLayout={(e) => {
                  if (i === currentUnit && picked === null)
                    listRef.current?.scrollTo({ x: Math.max(0, e.nativeEvent.layout.x - 8), animated: false });
                }}
                accessibilityState={{ selected }}
                style={({ pressed }) => [
                  styles.topic,
                  selected
                    ? { backgroundColor: alpha(theme.primary, 0.1) }
                    : pressed && { backgroundColor: theme.surface2 },
                ]}>
                <View
                  style={[
                    styles.topicIcon,
                    {
                      backgroundColor: finished ? theme.good : selected ? theme.primary : theme.surface2,
                    },
                  ]}>
                  <Icon
                    name={finished ? 'check' : u.icon}
                    size={17}
                    rawColor={finished ? '#ffffff' : selected ? theme.primaryText : theme.muted}
                  />
                </View>
                <AppText
                  weight={selected ? '700' : '600'}
                  color={selected ? 'primary' : 'text'}
                  numberOfLines={1}
                  style={styles.topicTitle}>
                  {u.title}
                </AppText>
                <AppText variant="caption" weight="600" color="muted">
                  {done}/{u.lessons.length}
                </AppText>
              </Pressable>
            );
          })}
        </ScrollView>
      </Card>

      <Card style={styles.panel}>
        <View style={[styles.panelHead, { borderColor: alpha(theme.border, 0.7) }]}>
          <View style={[styles.headIcon, { backgroundColor: alpha(theme.primary, 0.1) }]}>
            <Icon name={active.icon} size={19} color="primary" />
          </View>
          <View style={styles.flex}>
            <AppText weight="700" numberOfLines={1}>
              {active.title}
            </AppText>
            <AppText variant="caption" color="muted">
              {active.lessons.length} bài · {activeDone} {variant === 'review' ? 'bài đã học' : 'đã hoàn thành'}
            </AppText>
          </View>
          <View style={[styles.countPill, { borderColor: theme.border }]}>
            <AppText variant="caption" weight="600">
              {activeDone}/{active.lessons.length}
            </AppText>
          </View>
        </View>

        <View style={styles.lessons}>
          {active.lessons.map(({ lesson, part }) => {
            const done = isDone(lesson, variant);
            const isCurrent = variant === 'learn' && lesson.id === currentLessonId;
            return (
              <Pressable
                key={lesson.id}
                onPress={() => router.push(lessonHref(lesson, variant))}
                style={({ pressed }) => [
                  styles.lesson,
                  isCurrent
                    ? {
                        borderColor: alpha(theme.primary, 0.5),
                        backgroundColor: alpha(theme.primary, 0.05),
                        boxShadow: `0 1px 3px ${alpha(theme.text, 0.1)}`,
                      }
                    : { borderColor: theme.border, backgroundColor: theme.surface },
                  pressed && { transform: [{ scale: 0.99 }] },
                ]}>
                <View
                  style={[
                    styles.lessonNo,
                    done
                      ? { backgroundColor: theme.good }
                      : isCurrent
                        ? { backgroundColor: theme.primary, boxShadow: `0 4px 6px -1px ${alpha(theme.primary, 0.3)}` }
                        : { backgroundColor: theme.surface2 },
                  ]}>
                  {done ? (
                    <Icon name="check" size={18} rawColor="#ffffff" />
                  ) : (
                    <AppText weight="700" color={isCurrent ? 'primaryText' : 'muted'}>
                      {lesson.orderIndex}
                    </AppText>
                  )}
                </View>
                <View style={styles.flex}>
                  <View style={styles.lessonTitle}>
                    <AppText weight="700">
                      Bài {lesson.orderIndex}
                      {part ? ` · phần ${part}` : ''}
                    </AppText>
                    {isCurrent && (
                      <View style={[styles.badge, { backgroundColor: theme.primary }]}>
                        <AppText variant="caption" weight="700" color="primaryText">
                          HỌC TIẾP
                        </AppText>
                      </View>
                    )}
                    {variant === 'review' && (
                      <View
                        style={[
                          styles.badge,
                          { backgroundColor: done ? alpha(theme.good, 0.12) : theme.surface2 },
                        ]}>
                        <AppText variant="caption" color={done ? 'good' : 'muted'}>
                          {done ? `Đã học ${lesson.startedWords}/${lesson.wordCount}` : 'Chưa học'}
                        </AppText>
                      </View>
                    )}
                  </View>
                  <Hanzi size={16} color="primary" numberOfLines={1} style={styles.preview}>
                    {lesson.previewWords.join(' · ')}
                  </Hanzi>
                  <View style={styles.tags}>
                    <View style={[styles.tag, { backgroundColor: theme.surface2 }]}>
                      <AppText variant="caption" color="muted">
                        {lesson.wordCount} từ vựng
                      </AppText>
                    </View>
                    <View style={[styles.tag, { backgroundColor: theme.surface2 }]}>
                      <AppText variant="caption" color="muted">
                        ~{lessonMinutes(lesson.wordCount)} phút
                      </AppText>
                    </View>
                  </View>
                </View>
                <Icon name="arrow" size={16} color="muted" />
              </Pressable>
            );
          })}
        </View>

        {featured && (
          <LessonWords key={featured.lesson.id} lesson={featured.lesson} part={featured.part} variant={variant} />
        )}
      </Card>
    </View>
  );
}

/**
 * Từ vựng của 1 bài ngay trong danh sách: chữ Hán, pinyin, âm Hán Việt, nghĩa, nút nghe — biết trước mình sắp
 * học/ôn gì trước khi bấm vào bài.
 */
function LessonWords({ lesson, part, variant }: { lesson: LessonNode; part: string | null; variant: Variant }) {
  const theme = useTheme();
  const { data, error } = useLesson(lesson.id);
  if (error) return null;
  const cta =
    variant === 'review'
      ? lesson.startedWords > 0
        ? 'Ôn bằng flashcard'
        : 'Học bài này trước'
      : lesson.status === 'COMPLETED'
        ? 'Học lại bài này'
        : 'Học bài này';
  return (
    <View style={[styles.words, { borderColor: alpha(theme.border, 0.7) }]}>
      <View style={styles.wordsHead}>
        <AppText weight="700" style={styles.flex}>
          Từ vựng bài {lesson.orderIndex}
          {part ? ` · phần ${part}` : ''}
          <AppText weight="400" color="muted">
            {' '}
            ({lesson.wordCount} từ)
          </AppText>
        </AppText>
        <Pressable onPress={() => router.push(lessonHref(lesson, variant))} style={styles.link} hitSlop={6}>
          <AppText variant="caption" weight="600" color="primary">
            {cta}
          </AppText>
          <Icon name="arrow" size={13} color="primary" />
        </Pressable>
      </View>
      {!data ? (
        <View style={styles.wordList}>
          {Array.from({ length: Math.min(6, lesson.wordCount) }, (_, i) => (
            <Skeleton key={i} height={56} />
          ))}
        </View>
      ) : (
        <>
          <View style={styles.wordList}>
            {data.words.map((w) => (
              <View key={w.id} style={[styles.word, { borderColor: theme.border, backgroundColor: theme.surface }]}>
                <Hanzi size={20} style={styles.wordHanzi}>
                  {w.simplified}
                </Hanzi>
                <View style={styles.flex}>
                  <AppText variant="caption" numberOfLines={1}>
                    <AppText variant="caption" color="muted">
                      {w.pinyin}
                    </AppText>
                    {w.hanViet ? (
                      <AppText variant="caption" weight="600" color="hanviet">
                        {'  '}
                        {w.hanViet}
                      </AppText>
                    ) : null}
                  </AppText>
                  <AppText variant="caption" numberOfLines={1}>
                    {w.meaningVi?.split(';')[0]}
                  </AppText>
                </View>
                <AudioButton src={w.audioUrl} size={15} />
              </View>
            ))}
          </View>
          <View style={styles.extras}>
            {data.relatedGrammar.length > 0 && (
              <>
                <AppText variant="caption" weight="600" color="muted">
                  Ngữ pháp trong bài:
                </AppText>
                {data.relatedGrammar.map((g) => (
                  <Pressable
                    key={g.slug}
                    onPress={() => router.push(`/ngu-phap/${g.slug}`)}
                    style={[styles.grammar, { borderColor: theme.border, backgroundColor: theme.surface }]}>
                    <AppText variant="caption" weight="600">
                      <Hanzi size={12}>{g.titleZh}</Hanzi> {g.titleVi}
                    </AppText>
                  </Pressable>
                ))}
              </>
            )}
            <Pressable onPress={() => router.push(`/learn/${lesson.id}`)} style={[styles.link, styles.examples]} hitSlop={6}>
              <AppText variant="caption" weight="600" color="muted">
                Xem câu ví dụ
              </AppText>
              <Icon name="arrow" size={12} color="muted" />
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 16 },
  flex: { flex: 1, minWidth: 0 },
  topics: { padding: 8, gap: 0 },
  topicRow: { gap: 8 },
  topic: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8 },
  topicIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  topicTitle: { maxWidth: 160 },
  panel: { padding: 0, gap: 0, overflow: 'hidden' },
  panelHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  countPill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  lessons: { padding: 12, gap: 10 },
  lesson: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  lessonNo: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  lessonTitle: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 8 },
  badge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  preview: { marginTop: 2 },
  tags: { marginTop: 4, flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  words: { borderTopWidth: 1, paddingHorizontal: 12, paddingTop: 14, paddingBottom: 16 },
  wordsHead: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', columnGap: 12, rowGap: 4 },
  link: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  wordList: { marginTop: 12, gap: 8 },
  word: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  wordHanzi: { fontWeight: '600' },
  extras: { marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  grammar: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  examples: { marginLeft: 'auto' },
});
