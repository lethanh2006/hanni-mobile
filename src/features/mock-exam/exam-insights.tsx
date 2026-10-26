import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import useSWR from 'swr';

import { AppText, Card, Icon, Skeleton } from '@/components/ui';
import { alpha } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth';
import type { MockAnalysis, MockAttempt, MockExamMeta } from '@/lib/types';

import { partInfo, practiceSlug, SECTION_SHORT, weakest } from './part-info';

/**
 * Điểm mạnh/yếu từng phần + lịch sử làm bài (`MockExamInsights` của web). Khách thì mời đăng nhập để được ghi lại.
 */
export function ExamInsights() {
  const theme = useTheme();
  const { user, loading } = useAuth();
  const { data: exams } = useSWR<MockExamMeta[]>('/mock-exams');
  const { data: analysis } = useSWR<MockAnalysis>(user ? '/mock-exams/analysis/me' : null);
  const { data: attempts } = useSWR<MockAttempt[]>(user ? '/mock-exams/attempts/me' : null);
  if (loading) return null;

  const heading = <AppText weight="700">Phân tích điểm mạnh, yếu</AppText>;
  if (!user)
    return (
      <Card style={styles.card}>
        {heading}
        <AppText color="muted" style={styles.text}>
          Đăng nhập để Hanni ghi lại điểm từng phần qua mỗi lần làm và chỉ ra dạng câu bạn hay sai.
        </AppText>
        <Pressable onPress={() => router.push('/login')} style={styles.link} hitSlop={6}>
          <AppText weight="600" color="primary">
            Đăng nhập
          </AppText>
          <Icon name="arrow" size={14} color="primary" />
        </Pressable>
      </Card>
    );
  if (!analysis || !attempts) return <Skeleton height={160} radius={16} />;
  if (analysis.attempts === 0)
    return (
      <Card style={styles.card}>
        {heading}
        <AppText color="muted" style={styles.text}>
          Làm ít nhất 1 đề để xem phân tích điểm mạnh, điểm yếu của bạn.
        </AppText>
      </Card>
    );

  const weak = weakest(analysis.parts, 1)[0];
  const titleOf = (slug: string) => exams?.find((e) => e.slug === slug)?.title ?? slug;
  const levels = [...new Set(analysis.parts.map((p) => p.level))].sort((a, b) => a - b);
  const levelTag = (level: number) => (levels.length > 1 ? `HSK ${level} · ` : '');

  return (
    <Card style={styles.card}>
      <View style={styles.head}>
        {heading}
        <AppText variant="caption" color="muted">
          Cộng dồn {analysis.attempts} lượt làm
        </AppText>
      </View>
      {levels.map((level) => (
        <View key={level} style={styles.level}>
          {levels.length > 1 && (
            <AppText variant="caption" weight="700" color="muted" style={styles.levelTitle}>
              HSK {level}
            </AppText>
          )}
          <View style={styles.parts}>
            {analysis.parts
              .filter((p) => p.level === level)
              .map((p) => {
                const ratio = p.correct / Math.max(1, p.total);
                const color = ratio >= 0.8 ? theme.good : ratio >= 0.6 ? theme.warn : theme.danger;
                return (
                  <View key={`${p.level}-${p.section}-${p.part}`}>
                    <View style={styles.partRow}>
                      <AppText variant="caption" style={styles.flex}>
                        <AppText variant="caption" weight="600">
                          {SECTION_SHORT[p.section]} {p.part}
                        </AppText>
                        <AppText variant="caption" color="muted">
                          {' '}
                          · {partInfo(p.section, p.type).label}
                        </AppText>
                      </AppText>
                      <AppText variant="caption" weight="700" style={styles.tabular}>
                        {Math.round(ratio * 100)}%
                      </AppText>
                    </View>
                    <View style={[styles.track, { backgroundColor: theme.surface2 }]}>
                      <View
                        style={[styles.fill, { backgroundColor: color, width: `${Math.max(ratio * 100, 2)}%` }]}
                      />
                    </View>
                  </View>
                );
              })}
          </View>
        </View>
      ))}
      {weak ? (
        <View style={[styles.weak, { borderColor: alpha(theme.warn, 0.3), backgroundColor: alpha(theme.warn, 0.08) }]}>
          <AppText weight="600">
            Yếu nhất: {levelTag(weak.level)}
            {SECTION_SHORT[weak.section]} {weak.part} · {partInfo(weak.section, weak.type).label}
          </AppText>
          <AppText color="muted" style={styles.weakTip}>
            {partInfo(weak.section, weak.type).tip}
          </AppText>
          <Pressable
            onPress={() => router.push(`/thi-thu-hsk/dang-bai/${practiceSlug(weak.level, weak.section, weak.part)}`)}
            style={[styles.link, styles.weakLink]}
            hitSlop={6}>
            <AppText weight="600" color="primary">
              Luyện riêng dạng này
            </AppText>
            <Icon name="arrow" size={14} color="primary" />
          </Pressable>
        </View>
      ) : (
        <AppText weight="600" color="good" style={styles.allGood}>
          Phần nào cũng đúng từ 80% trở lên — đều tay!
        </AppText>
      )}
      <AppText weight="700" style={styles.historyTitle}>
        Lịch sử làm bài
      </AppText>
      <View>
        {attempts.slice(0, 5).map((a, i) => (
          <Pressable
            key={a.id}
            onPress={() => router.push(`/thi-thu-hsk/${a.examSlug}`)}
            style={[styles.attempt, i > 0 && { borderTopWidth: 1, borderColor: theme.border }]}>
            <AppText numberOfLines={1} style={styles.flex}>
              {titleOf(a.examSlug)}
            </AppText>
            <AppText variant="caption" color="muted">
              {new Date(a.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
            </AppText>
            <View
              style={[
                styles.score,
                { backgroundColor: a.passed ? alpha(theme.good, 0.15) : alpha(theme.danger, 0.1) },
              ]}>
              <AppText variant="caption" weight="700" color={a.passed ? 'good' : 'danger'} style={styles.tabular}>
                {a.score}/{a.maxScore}
              </AppText>
            </View>
          </Pressable>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 0 },
  text: { marginTop: 8, lineHeight: 24 },
  link: { marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 4 },
  head: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 },
  level: { marginTop: 12 },
  levelTitle: { marginBottom: 8 },
  parts: { gap: 12 },
  partRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 },
  flex: { flex: 1, minWidth: 0 },
  tabular: { fontVariant: ['tabular-nums'] },
  track: { marginTop: 4, height: 6, borderRadius: 999, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 999 },
  weak: { marginTop: 16, borderWidth: 1, borderRadius: 16, padding: 12 },
  weakTip: { marginTop: 4, lineHeight: 24 },
  weakLink: { marginTop: 6 },
  allGood: { marginTop: 16 },
  historyTitle: { marginTop: 20 },
  attempt: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  score: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
});
