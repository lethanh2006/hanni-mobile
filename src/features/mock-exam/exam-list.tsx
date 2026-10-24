import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import useSWR from 'swr';

import { AppText, Card, ChipRow, EmptyState, Icon, Loading } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { hskLabel } from '@/lib/hsk';
import type { MockExamMeta } from '@/lib/types';

import { SECTION_VI } from './labels';
import { readSaved } from './saved-exam';

/** Đề đang làm dở trên máy này: slug → số câu đã làm. Đọc lại mỗi lần quay về tab. */
function useInProgress(exams: MockExamMeta[] | undefined) {
  const [doing, setDoing] = useState<Map<string, number>>(new Map());
  useFocusEffect(
    useCallback(() => {
      const map = new Map<string, number>();
      for (const e of exams ?? []) {
        const saved = readSaved(e.slug, e.durationMin);
        if (saved) map.set(e.slug, saved.answers.filter((a) => a !== null).length);
      }
      setDoing(map);
    }, [exams]),
  );
  return doing;
}

/** Danh sách đề thi thử theo cấp; đề nào cũng hiện trạng thái: đang làm dở, đạt/chưa đạt + điểm cao nhất. */
export function ExamList() {
  const theme = useTheme();
  const { data, error } = useSWR<MockExamMeta[]>('/mock-exams');
  const [level, setLevel] = useState<number | null>(null);
  const doing = useInProgress(data);

  if (error) return <EmptyState title="Chưa tải được danh sách đề" description="Bạn kiểm tra kết nối rồi thử lại nhé." />;
  if (!data) return <Loading />;

  const levels = [...new Set(data.map((e) => e.level))].sort((a, b) => a - b);
  const current = level ?? levels[0];
  const list = data.filter((e) => e.level === current);

  return (
    <View style={styles.wrap}>
      <ChipRow options={levels.map((l) => ({ value: l, label: hskLabel(l) }))} value={current} onChange={setLevel} />
      {list.map((e) => {
        const done = e.best !== undefined && e.best !== null;
        const passed = done && (e.best ?? 0) >= e.passScore;
        const answered = doing.get(e.slug);
        return (
          <Card key={e.slug} onPress={() => router.push(`/thi-thu-hsk/${e.slug}`)}>
            <View style={styles.row}>
              <View style={[styles.icon, { backgroundColor: theme.primarySoft }]}>
                <Icon name="book" size={22} color="primary" />
              </View>
              <View style={styles.flex}>
                <AppText bold>{e.title}</AppText>
                <AppText variant="caption" color="muted">
                  {e.sections.map((s) => `${s.count} câu ${SECTION_VI[s.kind].vi.toLowerCase()}`).join(' · ')}
                </AppText>
                <AppText variant="caption" color="muted">
                  {e.durationMin} phút · {e.maxScore} điểm · đạt {e.passScore}
                </AppText>
                {answered !== undefined ? (
                  <AppText variant="caption" bold color="warn">
                    Đang làm dở {answered}/{e.questionCount} — bấm để làm tiếp
                  </AppText>
                ) : done ? (
                  <AppText variant="caption" bold color={passed ? 'good' : 'danger'}>
                    {passed ? 'Đạt' : 'Chưa đạt'} · cao nhất {e.best}/{e.maxScore}
                    {e.attempts ? ` · ${e.attempts} lần làm` : ''}
                  </AppText>
                ) : null}
              </View>
              <Icon name="chevron" size={18} color="muted" />
            </View>
          </Card>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  flex: { flex: 1, gap: 2 },
  icon: { width: 48, height: 48, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center' },
});
