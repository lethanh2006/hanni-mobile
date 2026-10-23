import { StyleSheet, View } from 'react-native';

import { AppText, Card, SectionTitle } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useRecentQuizzes } from '@/lib/hooks';

/** Kết quả các bài kiểm tra nhanh cuối buổi ôn. */
export function RecentQuizzes() {
  const theme = useTheme();
  const quizzes = useRecentQuizzes();
  if (!quizzes.data?.length) return null;
  return (
    <Card>
      <SectionTitle title="Kiểm tra gần đây" />
      {quizzes.data.map((q) => (
        <View key={q.id} style={[styles.row, { borderColor: theme.border }]}>
          <AppText variant="small" color="muted" style={styles.flex}>
            {q.completedAt ? new Date(q.completedAt).toLocaleDateString('vi-VN') : '—'}
          </AppText>
          <AppText variant="small">
            {q.correctCount}/{q.totalQuestions} câu
          </AppText>
          <AppText variant="small" bold color={q.scorePct >= 80 ? 'good' : q.scorePct >= 50 ? 'warn' : 'danger'}>
            {Math.round(q.scorePct)}%
          </AppText>
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, borderTopWidth: 1, paddingTop: Spacing.sm },
  flex: { flex: 1 },
});
