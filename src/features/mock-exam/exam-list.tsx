import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import useSWR from 'swr';

import { AppText, Button, Card, Icon, IconTile, Skeleton } from '@/components/ui';
import { alpha } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth';
import type { MockExamMeta } from '@/lib/types';

import { PracticeSets } from './practice-sets';
import { readSaved } from './saved-exam';

const ALL_LEVELS = [1, 2, 3, 4, 5, 6];
const SECTION_ICON = { listening: 'headphones', reading: 'book', writing: 'pencil' } as const;
const SECTION_VI = { listening: 'nghe', reading: 'đọc', writing: 'viết' } as const;

/** Đề đang làm dở trên máy này: slug → số câu đã làm + số phút còn lại. Đọc lại mỗi lần quay về tab. */
function useInProgress(exams: MockExamMeta[] | undefined) {
  const [doing, setDoing] = useState<Map<string, { answered: number; minutesLeft: number }>>(new Map());
  useFocusEffect(
    useCallback(() => {
      const map = new Map<string, { answered: number; minutesLeft: number }>();
      for (const e of exams ?? []) {
        const saved = readSaved(e.slug, e.durationMin);
        if (saved)
          map.set(e.slug, {
            answered: saved.answers.filter((a) => a !== null).length,
            minutesLeft: Math.max(1, Math.ceil(e.durationMin - (Date.now() - saved.startedAt) / 60_000)),
          });
      }
      setDoing(map);
    }, [exams]),
  );
  return doing;
}

/**
 * Danh sách đề theo cấp (`MockExamList` của web): ô chọn cấp HSK 1–6 (cấp chưa có đề ghi "Sắp có"), thẻ đề có
 * thông tin từng phần + trạng thái (đang làm dở, đạt/chưa đạt, điểm cao nhất) + nút Làm bài/Làm tiếp/Làm lại,
 * rồi "Luyện từng dạng bài" của cấp đang chọn.
 */
export function ExamList() {
  const theme = useTheme();
  const { data, error } = useSWR<MockExamMeta[]>('/mock-exams');
  const [picked, setPicked] = useState<number | null>(null);
  const doing = useInProgress(data);

  if (error)
    return (
      <View style={[styles.empty, { borderColor: theme.border, backgroundColor: theme.surface }]}>
        <AppText color="muted" center>
          Chưa tải được danh sách đề. Bạn thử tải lại nhé.
        </AppText>
      </View>
    );
  if (!data)
    return (
      <View style={styles.wrap}>
        <Skeleton height={60} radius={16} />
        <Skeleton height={140} radius={16} />
        <Skeleton height={140} radius={16} />
      </View>
    );

  const levels = new Set(data.map((e) => e.level));
  const level = picked ?? Math.min(...(levels.size ? [...levels] : [1]));
  const list = data.filter((e) => e.level === level);

  return (
    <View style={styles.wrap}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.levels}>
        {ALL_LEVELS.map((l) => {
          const has = levels.has(l);
          const selected = l === level;
          return (
            <Pressable
              key={l}
              disabled={!has}
              onPress={() => setPicked(l)}
              accessibilityState={{ selected, disabled: !has }}
              style={[
                styles.level,
                selected
                  ? {
                      borderColor: alpha(theme.primary, 0.5),
                      backgroundColor: alpha(theme.primary, 0.1),
                      boxShadow: `0 3px 0 ${alpha(theme.primary, 0.25)}`,
                    }
                  : has
                    ? { borderColor: theme.border, backgroundColor: theme.surface }
                    : { borderColor: theme.border, borderStyle: 'dashed', backgroundColor: theme.surface, opacity: 0.6 },
              ]}>
              <AppText weight="800" color={selected ? 'primary' : 'text'}>
                HSK {l}
              </AppText>
              <AppText variant="caption" color={selected ? 'primary' : 'muted'}>
                {has ? `${data.filter((e) => e.level === l).length} đề` : 'Sắp có'}
              </AppText>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.list}>
        {list.map((e) => {
          const done = e.best !== undefined && e.best !== null;
          const passed = done && (e.best ?? 0) >= e.passScore;
          const now = doing.get(e.slug);
          return (
            <View key={e.slug} style={[styles.exam, { borderColor: theme.border, backgroundColor: theme.surface }]}>
              <View style={styles.examRow}>
                <View style={[styles.examIcon, { backgroundColor: alpha(theme.primary, 0.1) }]}>
                  <Icon name="book" size={22} color="primary" />
                </View>
                <View style={styles.flex}>
                  <View style={styles.titleRow}>
                    <AppText weight="700" style={styles.examTitle}>
                      {e.title}
                    </AppText>
                    {now ? (
                      <Badge text="Đang làm dở" color={theme.warn} />
                    ) : done ? (
                      <Badge text={passed ? 'Đạt' : 'Chưa đạt'} color={passed ? theme.good : theme.danger} />
                    ) : null}
                  </View>
                  <View style={styles.meta}>
                    {e.sections.map((s) => (
                      <View key={s.kind} style={styles.metaItem}>
                        <Icon name={SECTION_ICON[s.kind]} size={13} color="muted" />
                        <AppText variant="caption" color="muted">
                          {s.count} câu {SECTION_VI[s.kind]}
                        </AppText>
                      </View>
                    ))}
                    <View style={styles.metaItem}>
                      <Icon name="clock" size={13} color="muted" />
                      <AppText variant="caption" color="muted">
                        {e.durationMin} phút
                      </AppText>
                    </View>
                    <AppText variant="caption" color="muted">
                      {e.maxScore} điểm · đạt {e.passScore}
                    </AppText>
                  </View>
                  {now ? (
                    <View style={styles.doing}>
                      <View style={[styles.doingTrack, { backgroundColor: theme.surface2 }]}>
                        <View
                          style={[
                            styles.doingFill,
                            {
                              backgroundColor: theme.warn,
                              width: `${(now.answered / Math.max(1, e.questionCount)) * 100}%`,
                            },
                          ]}
                        />
                      </View>
                      <AppText variant="caption" color="muted" style={styles.doingText}>
                        Đã làm {now.answered}/{e.questionCount} câu · còn khoảng {now.minutesLeft} phút
                      </AppText>
                    </View>
                  ) : done ? (
                    <AppText variant="caption" style={styles.best}>
                      <AppText variant="caption" weight="700">
                        Cao nhất {e.best}/{e.maxScore}
                      </AppText>
                      <AppText variant="caption" color="muted">
                        {' '}
                        · đã làm {e.attempts ?? 1} lần
                      </AppText>
                    </AppText>
                  ) : null}
                </View>
              </View>
              <Button
                title={now ? 'Làm tiếp' : done ? 'Làm lại' : 'Làm bài'}
                variant={done && !now ? 'secondary' : 'primary'}
                onPress={() => router.push(`/thi-thu-hsk/${e.slug}`)}
                style={styles.examButton}
              />
            </View>
          );
        })}
      </View>

      <PracticeSets level={level} />
    </View>
  );
}

function Badge({ text, color }: { text: string; color: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: alpha(color, 0.15) }]}>
      <AppText variant="caption" weight="700" style={{ color }}>
        {text}
      </AppText>
    </View>
  );
}

/** Thẻ tiến độ luyện đề (`MockExamProgress` của web): đã đăng nhập thấy số đề đã làm/đạt/điểm cao nhất; khách thấy lời mời làm thử. */
export function ExamProgress() {
  const { user } = useAuth();
  const { data: exams } = useSWR<MockExamMeta[]>('/mock-exams');
  if (!exams) return <Skeleton height={180} radius={16} />;
  const done = exams.filter((e) => e.best !== undefined && e.best !== null);
  const passed = done.filter((e) => (e.best ?? 0) >= e.passScore);
  const next = exams.find((e) => e.best === undefined || e.best === null) ?? exams[0];

  return (
    <Card style={styles.progress}>
      {user ? (
        <>
          <AppText weight="700">Tiến độ luyện đề</AppText>
          <View style={styles.stats}>
            {[
              ['Đề đã làm', `${done.length}/${exams.length}`],
              ['Đề đã đạt', `${passed.length}`],
              ['Điểm cao nhất', done.length ? `${Math.max(...done.map((e) => e.best ?? 0))}` : '—'],
            ].map(([k, v]) => (
              <View key={k} style={styles.stat}>
                <AppText color="muted">{k}</AppText>
                <AppText weight="700">{v}</AppText>
              </View>
            ))}
          </View>
        </>
      ) : (
        <View style={styles.guest}>
          <IconTile icon="target" iconSize={20} />
          <AppText style={styles.flex}>
            <AppText weight="700">Làm thử ngay</AppText>, không cần tài khoản. Đăng nhập để lưu điểm từng đề.
          </AppText>
        </View>
      )}
      {next && (
        <Button
          title={user && done.length ? 'Làm đề tiếp theo' : `Làm ${next.title}`}
          icon="arrow"
          onPress={() => router.push(`/thi-thu-hsk/${next.slug}`)}
          style={styles.next}
        />
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 16 },
  flex: { flex: 1, minWidth: 0 },
  empty: { borderWidth: 1, borderRadius: 16, padding: 24 },
  levels: { gap: 8, paddingBottom: 4 },
  level: { borderWidth: 2, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 8, alignItems: 'flex-start' },
  list: { gap: 12 },
  exam: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 12 },
  examRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  examIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  examTitle: { fontSize: 16, lineHeight: 24 },
  titleRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 8, rowGap: 4 },
  badge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  meta: { marginTop: 4, flexDirection: 'row', flexWrap: 'wrap', columnGap: 12, rowGap: 4 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  doing: { marginTop: 8 },
  doingTrack: { height: 6, borderRadius: 999, overflow: 'hidden' },
  doingFill: { height: '100%', borderRadius: 999 },
  doingText: { marginTop: 4 },
  best: { marginTop: 6 },
  examButton: { minHeight: 40 },
  progress: { gap: 0 },
  stats: { marginTop: 12, gap: 8 },
  stat: { flexDirection: 'row', justifyContent: 'space-between' },
  guest: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  next: { marginTop: 16 },
});
