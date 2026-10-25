import { ActivityIndicator, StyleSheet, View } from 'react-native';
import useSWR from 'swr';

import { AppText, Card, ErrorNote, SectionTitle } from '@/components/ui';
import { Spacing, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';
import type { CoachResult, InsightsReport, PeriodStats } from '@/lib/types';

const hasActivity = (s: PeriodStats) => s.daysStudied > 0 || s.reviews > 0 || s.lessons > 0 || s.mockExams.count > 0;

function CoachList({ title, items, color }: { title: string; items: string[]; color: ThemeColor }) {
  if (items.length === 0) return null;
  return (
    <View style={styles.list}>
      <AppText variant="small" bold color={color}>
        {title}
      </AppText>
      {items.map((it) => (
        <AppText key={it} variant="small">
          • {it}
        </AppText>
      ))}
    </View>
  );
}

/**
 * Hanni Coach (Premium): AI đọc số liệu của kỳ rồi viết nhận xét, mẹo nhớ từ hay quên theo âm Hán Việt,
 * kế hoạch kỳ tới. Server cache theo số liệu nên mở lại không tốn lượt AI.
 */
export function CoachCard({ report, name }: { report: InsightsReport; name: string }) {
  const theme = useTheme();
  const active = hasActivity(report.current);
  const canCoach = report.ai.premium && report.ai.enabled && active;
  const coach = useSWR<CoachResult>(
    canCoach ? ['coach', report.period, report.offset] : null,
    () => api.post<CoachResult>('/insights/report/coach', { period: report.period, offset: report.offset }),
    { revalidateOnFocus: false, shouldRetryOnError: false },
  );
  const summary = coach.data?.summary ?? null;

  return (
    <Card>
      <SectionTitle title="Hanni Coach · Premium" />
      {!report.ai.premium ? (
        <AppText variant="small" color="muted">
          Với Premium, Hanni Coach đọc số liệu {name.toLowerCase()} rồi viết riêng cho bạn: điều làm tốt, điều cần chú ý,
          mẹo nhớ từ hay quên theo âm Hán Việt và kế hoạch kỳ tới.
        </AppText>
      ) : !report.ai.enabled ? (
        <AppText variant="small" color="muted">
          Hanni Coach tạm chưa bật trên máy chủ.
        </AppText>
      ) : !active ? (
        <AppText variant="small" color="muted">
          {name} chưa có buổi học nào nên Hanni Coach chưa có gì để nhận xét. Học 1 bài là có ngay số liệu đầu tiên.
        </AppText>
      ) : coach.error ? (
        <ErrorNote>Hanni Coach đang bận, chưa viết được nhận xét. Thử lại sau nhé.</ErrorNote>
      ) : !summary ? (
        <View style={styles.row}>
          <ActivityIndicator color={theme.accent} />
          <AppText variant="small" color="muted">
            Hanni Coach đang đọc số liệu của bạn… (khoảng 10–15 giây)
          </AppText>
        </View>
      ) : (
        <View style={styles.list}>
          <AppText variant="small">{summary.overview}</AppText>
          <CoachList title="Làm tốt" items={summary.wins} color="good" />
          <CoachList title="Cần chú ý" items={summary.watch} color="warn" />
          <CoachList title="Mẹo nhớ từ hay quên" items={summary.mnemonics.map((m) => `${m.zh}: ${m.tip}`)} color="hanviet" />
          <CoachList title="Kế hoạch kỳ tới" items={summary.plan} color="primary" />
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  list: { gap: 4, marginTop: Spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
});
