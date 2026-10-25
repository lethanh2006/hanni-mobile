import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import useSWR from 'swr';

import { AppText, Card, ChipRow, ErrorNote, Icon, Loading, SectionTitle, type IconName } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { InsightsPeriod, InsightsReport } from '@/lib/types';

import { ActivityBars, dayMonth } from './activity-bars';
import { CoachCard } from './coach-card';

const PERIODS: { value: InsightsPeriod; label: string; names: [string, string] }[] = [
  { value: 'week', label: 'Tuần', names: ['Tuần này', 'Tuần trước'] },
  { value: 'month', label: 'Tháng', names: ['Tháng này', 'Tháng trước'] },
  { value: 'quarter', label: 'Quý', names: ['Quý này', 'Quý trước'] },
];

/** 1 ô số liệu kèm ▲/▼ so với CÙNG SỐ NGÀY đầu kỳ trước. */
function Kpi({ label, value, unit, before, hint }: { label: string; value: number; unit?: string; before: number; hint?: string }) {
  const diff = value - before;
  return (
    <Card style={styles.kpi}>
      <AppText variant="caption" color="muted">
        {label}
      </AppText>
      <AppText variant="title">
        {value.toLocaleString('vi-VN')}
        {unit ? (
          <AppText variant="small" color="muted">
            {' '}
            {unit}
          </AppText>
        ) : null}
      </AppText>
      <AppText variant="caption" bold color={diff > 0 ? 'good' : diff < 0 ? 'warn' : 'muted'}>
        {diff === 0 ? '= cùng kỳ trước' : `${diff > 0 ? '▲' : '▼'} ${Math.abs(diff).toLocaleString('vi-VN')} so với cùng kỳ`}
      </AppText>
      {hint && (
        <AppText variant="caption" color="muted">
          {hint}
        </AppText>
      )}
    </Card>
  );
}

/** Việc nên làm tiếp — tính thẳng từ số liệu (không qua AI) nên ai cũng có. */
function nextSteps(r: InsightsReport): { href: Href; label: string; icon: IconName }[] {
  const steps: { href: Href; label: string; icon: IconName }[] = r.weakParts.map((w) => ({
    href: `/thi-thu-hsk/dang-bai/${w.slug}`,
    label: `Luyện lại dạng bài HSK ${w.level} còn yếu (${w.correct}/${w.total} câu đúng)`,
    icon: 'target',
  }));
  if (r.dueNow > 0) steps.push({ href: { pathname: '/review', params: { review: '1' } }, label: `Ôn ${r.dueNow} từ đến hạn`, icon: 'cards' });
  if (r.leechCount > 0) steps.push({ href: { pathname: '/review', params: { leeches: '1' } }, label: `Ôn riêng ${r.leechCount} từ khó nhớ`, icon: 'refresh' });
  steps.push({ href: '/', label: 'Học bài tiếp theo trong lộ trình', icon: 'route' });
  return steps.slice(0, 4);
}

/** Báo cáo tuần/tháng/quý: 4 ô số liệu so với kỳ trước, biểu đồ phút học, việc nên làm, Hanni Coach. */
export function PeriodReport() {
  const theme = useTheme();
  const [period, setPeriod] = useState<InsightsPeriod>('week');
  const [offset, setOffset] = useState<0 | 1>(0);
  const { data: r, error } = useSWR<InsightsReport>(`/insights/report?period=${period}&offset=${offset}`, {
    keepPreviousData: true,
  });
  const meta = PERIODS.find((p) => p.value === period)!;
  const name = meta.names[offset];

  return (
    <View style={styles.wrap}>
      <SectionTitle title="Báo cáo học tập" />
      <ChipRow options={PERIODS} value={period} onChange={setPeriod} />
      <ChipRow<0 | 1>
        options={[
          { value: 0, label: meta.names[0] },
          { value: 1, label: meta.names[1] },
        ]}
        value={offset}
        onChange={setOffset}
      />
      {error && !r ? (
        <ErrorNote>Chưa tải được báo cáo.</ErrorNote>
      ) : !r ? (
        <Loading />
      ) : (
        <>
          <AppText variant="caption" color="muted">
            {dayMonth(r.startIso)} – {dayMonth(r.endIso)} · so với {dayMonth(r.prevStartIso)} – {dayMonth(r.prevEndIso)}
          </AppText>
          <View style={styles.grid}>
            <Kpi label="Ngày có học" value={r.current.daysStudied} unit="ngày" before={r.previous.daysStudied} />
            <Kpi label="Thời gian học" value={r.current.minutes} unit="phút" before={r.previous.minutes} />
            <Kpi
              label="Lượt chấm thẻ"
              value={r.current.reviews}
              before={r.previous.reviews}
              hint={r.current.retention !== null ? `Nhớ được ${r.current.retention}% lượt ôn` : undefined}
            />
            <Kpi
              label="Từ mới"
              value={r.current.newWords}
              before={r.previous.newWords}
              hint={r.familiar.count > 0 ? `${r.familiar.count} từ quen nhờ âm Hán Việt` : undefined}
            />
          </View>
          <Card>
            <AppText variant="small" bold>
              Phút học mỗi {r.period === 'quarter' ? 'tuần' : 'ngày'}
            </AppText>
            <ActivityBars series={r.series} />
            <AppText variant="caption" color="muted">
              {r.current.lessons} bài học xong · chuỗi {r.streak.current} ngày (dài nhất {r.streak.longest})
              {r.current.mockExams.count > 0
                ? ` · ${r.current.mockExams.count} đề thi thử, cao nhất ${r.current.mockExams.bestPercent}%`
                : ''}
            </AppText>
          </Card>
          <Card>
            <SectionTitle title="Việc nên làm ngay" />
            {nextSteps(r).map((s) => (
              <View key={s.label} style={[styles.step, { borderColor: theme.border }]}>
                <Icon name={s.icon} size={18} color="primary" />
                <AppText variant="small" style={styles.flex} onPress={() => router.push(s.href)}>
                  {s.label}
                </AppText>
                <Icon name="chevron" size={14} color="muted" />
              </View>
            ))}
          </Card>
          <CoachCard report={r} name={name} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: Spacing.md },
  kpi: { width: '48%', gap: 2 },
  step: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, borderTopWidth: 1, paddingVertical: Spacing.sm },
  flex: { flex: 1 },
});
