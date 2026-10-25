import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import useSWR from 'swr';

import { AppText, Button, Card, ProgressBar, SectionTitle, TextLink } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth';
import { hskLabel } from '@/lib/hsk';
import type { MockAnalysis, MockAttempt, MockExamMeta } from '@/lib/types';

import { partInfo, practiceSlug, SECTION_SHORT, weakest } from './part-info';

/** Điểm mạnh/yếu từng phần đề qua mọi lần làm + lịch sử làm bài. Khách được mời đăng nhập. */
export function ExamInsights() {
  const theme = useTheme();
  const { user } = useAuth();
  const analysis = useSWR<MockAnalysis>(user ? '/mock-exams/analysis/me' : null);
  const attempts = useSWR<MockAttempt[]>(user ? '/mock-exams/attempts/me' : null);
  const exams = useSWR<MockExamMeta[]>('/mock-exams');

  if (!user) {
    return (
      <Card>
        <SectionTitle title="Phân tích điểm mạnh, yếu" />
        <AppText variant="small" color="muted">
          Đăng nhập để Hanni ghi lại điểm từng phần qua mỗi lần làm và chỉ ra dạng câu bạn hay sai.
        </AppText>
        <Button title="Đăng nhập" variant="secondary" onPress={() => router.push('/login')} />
      </Card>
    );
  }
  if (!analysis.data || analysis.data.attempts === 0) return null;

  const parts = analysis.data.parts;
  const weak = weakest(parts, 1)[0];
  const titleOf = (slug: string) => exams.data?.find((e) => e.slug === slug)?.title ?? slug;

  return (
    <Card>
      <SectionTitle title="Phân tích điểm mạnh, yếu" />
      {parts.map((p) => {
        const ratio = p.correct / Math.max(1, p.total);
        return (
          <View key={`${p.level}-${p.section}-${p.part}`} style={styles.part}>
            <View style={styles.row}>
              <AppText variant="small" style={styles.flex}>
                {hskLabel(p.level)} · {SECTION_SHORT[p.section]} {p.part} · {partInfo(p.section, p.type).label}
              </AppText>
              <AppText variant="caption" bold color={ratio >= 0.8 ? 'good' : 'danger'}>
                {p.correct}/{p.total}
              </AppText>
            </View>
            <ProgressBar value={ratio * 100} color={ratio >= 0.8 ? 'good' : 'primary'} />
          </View>
        );
      })}
      {weak && (
        <View style={[styles.weak, { backgroundColor: theme.surface2 }]}>
          <AppText variant="small" bold>
            Yếu nhất: {SECTION_SHORT[weak.section]} {weak.part} · {partInfo(weak.section, weak.type).label}
          </AppText>
          <AppText variant="caption" color="muted">
            {partInfo(weak.section, weak.type).tip}
          </AppText>
          <TextLink
            title="Luyện riêng dạng này →"
            onPress={() => router.push(`/thi-thu-hsk/dang-bai/${practiceSlug(weak.level, weak.section, weak.part)}`)}
          />
        </View>
      )}

      {!!attempts.data?.length && (
        <>
          <SectionTitle title="Lịch sử làm bài" />
          {attempts.data.slice(0, 5).map((a) => (
            <View key={a.id} style={styles.row}>
              <AppText variant="small" style={styles.flex} numberOfLines={1}>
                {titleOf(a.examSlug)}
              </AppText>
              <AppText variant="caption" color="muted">
                {new Date(a.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
              </AppText>
              <AppText variant="small" bold color={a.passed ? 'good' : 'danger'}>
                {a.score}/{a.maxScore}
              </AppText>
            </View>
          ))}
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  part: { gap: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  flex: { flex: 1 },
  weak: { borderRadius: 12, padding: Spacing.md, gap: 4 },
});
