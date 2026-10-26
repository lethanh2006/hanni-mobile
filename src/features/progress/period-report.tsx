import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import useSWR from 'swr';

import { AppText, Card, ErrorNote, SectionHeading, Skeleton } from '@/components/ui';
import { alpha } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { InsightsPeriod, InsightsReport } from '@/lib/types';

import { ActivityBars, dayMonth } from './activity-bars';
import { CoachCard } from './coach-card';

const PERIODS: { key: InsightsPeriod; label: string; names: [string, string]; next: string }[] = [
  { key: 'week', label: 'Tuần', names: ['Tuần này', 'Tuần trước'], next: 'tuần tới' },
  { key: 'month', label: 'Tháng', names: ['Tháng này', 'Tháng trước'], next: 'tháng tới' },
  { key: 'quarter', label: 'Quý', names: ['Quý này', 'Quý trước'], next: 'quý tới' },
];

const dayCount = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000) + 1;

/** Nhóm nút chọn trong khung xám (`Segmented` của web): mục đang chọn nền trắng chữ đỏ. */
function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.segmented, { backgroundColor: theme.surface2 }]} accessibilityRole="tablist">
      {options.map((o) => {
        const on = value === o.value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            style={[
              styles.segment,
              on && { backgroundColor: theme.surface, boxShadow: `0 1px 2px ${alpha(theme.text, 0.05)}` },
            ]}>
            <AppText variant="caption" weight="600" color={on ? 'primary' : 'muted'}>
              {o.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

/** 1 ô số liệu kèm ▲/▼ so với CÙNG SỐ NGÀY đầu kỳ trước. */
function Kpi({ label, value, unit, before, hint }: { label: string; value: number; unit?: string; before: number; hint?: ReactNode }) {
  const theme = useTheme();
  const diff = value - before;
  return (
    <View style={[styles.kpi, { borderColor: theme.border, backgroundColor: alpha(theme.surface2, 0.4) }]}>
      <AppText variant="caption" weight="500" color="muted">
        {label}
      </AppText>
      <AppText weight="800" style={styles.kpiValue}>
        {value.toLocaleString('vi-VN')}
        {unit ? (
          <AppText weight="600" color="muted">
            {' '}
            {unit}
          </AppText>
        ) : null}
      </AppText>
      <AppText variant="caption" weight="600" color={diff > 0 ? 'good' : diff < 0 ? 'warn' : 'muted'} style={styles.kpiDiff}>
        {diff === 0 ? '= cùng kỳ trước' : `${diff > 0 ? '▲' : '▼'} ${Math.abs(diff).toLocaleString('vi-VN')} so với cùng kỳ`}
      </AppText>
      {hint && (
        <AppText variant="caption" color="muted" style={styles.kpiHint}>
          {hint}
        </AppText>
      )}
    </View>
  );
}

function StatsCard({ report, name }: { report: InsightsReport; name: string }) {
  const theme = useTheme();
  const c = report.current;
  const p = report.previous;
  const extras = [
    `${c.lessons} bài học xong`,
    c.listening.total > 0 && `Luyện nghe ${c.listening.correct}/${c.listening.total} câu đúng`,
    c.speaking > 0 && `${c.speaking} lượt luyện phát âm`,
    c.mockExams.count > 0 && `${c.mockExams.count} đề thi thử · cao nhất ${c.mockExams.bestPercent}%`,
    `Chuỗi ${report.streak.current} ngày (dài nhất ${report.streak.longest})`,
  ].filter(Boolean) as string[];

  return (
    <Card style={styles.stats}>
      <View style={styles.grid}>
        <View style={styles.cell}>
          <Kpi
            label="Ngày có học"
            value={c.daysStudied}
            unit="ngày"
            before={p.daysStudied}
            hint={`Trên ${dayCount(report.startIso, report.endIso)} ngày của ${name.toLowerCase()}`}
          />
        </View>
        <View style={styles.cell}>
          <Kpi label="Thời gian học" value={c.minutes} unit="phút" before={p.minutes} />
        </View>
        <View style={styles.cell}>
          <Kpi
            label="Lượt chấm thẻ"
            value={c.reviews}
            before={p.reviews}
            hint={c.retention !== null ? `Nhớ được ${c.retention}% lượt ôn` : undefined}
          />
        </View>
        <View style={styles.cell}>
          <Kpi
            label="Từ mới"
            value={c.newWords}
            before={p.newWords}
            hint={report.familiar.count > 0 ? `${report.familiar.count} từ quen nhờ âm Hán Việt` : undefined}
          />
        </View>
      </View>
      <View style={styles.extras}>
        {extras.map((x) => (
          <View key={x} style={[styles.extra, { backgroundColor: theme.surface2 }]}>
            <AppText variant="caption" color="muted">
              {x}
            </AppText>
          </View>
        ))}
      </View>
      <View>
        <AppText weight="600" style={styles.chartTitle}>
          Phút học mỗi {report.period === 'quarter' ? 'tuần' : 'ngày'}
        </AppText>
        <ActivityBars series={report.series} period={report.period} endIso={report.endIso} />
      </View>
    </Card>
  );
}

/** Báo cáo tuần/tháng/quý (`PeriodReport` của web): số liệu so với kỳ trước, biểu đồ phút học, Hanni Coach. */
export function PeriodReport() {
  const [period, setPeriod] = useState<InsightsPeriod>('week');
  const [offset, setOffset] = useState<0 | 1>(0);
  const { data, error, isLoading, mutate } = useSWR<InsightsReport>(`/insights/report?period=${period}&offset=${offset}`, {
    keepPreviousData: true,
  });
  const meta = PERIODS.find((p) => p.key === period)!;
  const name = meta.names[offset];

  return (
    <View style={styles.wrap}>
      <SectionHeading
        icon="chart"
        title="Báo cáo học tập"
        description="Nhìn lại một tuần, tháng hoặc quý — so với cùng kỳ trước, kèm việc nên làm tiếp."
      />
      <View style={styles.controls}>
        <Segmented value={period} options={PERIODS.map((p) => ({ value: p.key, label: p.label }))} onChange={setPeriod} />
        <Segmented
          value={String(offset)}
          options={[
            { value: '0', label: meta.names[0] },
            { value: '1', label: meta.names[1] },
          ]}
          onChange={(v) => setOffset(v === '1' ? 1 : 0)}
        />
        {data && (
          <AppText variant="caption" color="muted">
            {dayMonth(data.startIso)} – {dayMonth(data.endIso)} · so với {dayMonth(data.prevStartIso)} –{' '}
            {dayMonth(data.prevEndIso)}
          </AppText>
        )}
      </View>
      {error && !data ? (
        <ErrorNote>
          Chưa tải được báo cáo.{' '}
          <AppText weight="600" color="danger" style={styles.underline} onPress={() => void mutate()}>
            Thử lại
          </AppText>
        </ErrorNote>
      ) : !data ? (
        <Skeleton height={288} radius={16} />
      ) : (
        <View style={[styles.wrap, isLoading && styles.loading]}>
          <StatsCard report={data} name={name} />
          <CoachCard report={data} name={name} next={meta.next} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 16 },
  loading: { opacity: 0.6 },
  controls: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  segmented: { flexDirection: 'row', gap: 4, borderRadius: 12, padding: 4 },
  segment: { minHeight: 36, justifyContent: 'center', borderRadius: 8, paddingHorizontal: 14 },
  stats: { gap: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6, rowGap: 12 },
  cell: { width: '50%', paddingHorizontal: 6 },
  kpi: { flex: 1, borderWidth: 1, borderRadius: 16, padding: 14 },
  kpiValue: { marginTop: 4, fontSize: 24, lineHeight: 30, letterSpacing: -0.6 },
  kpiDiff: { marginTop: 2 },
  kpiHint: { marginTop: 4, lineHeight: 20 },
  extras: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  extra: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  chartTitle: { marginBottom: 12 },
  underline: { textDecorationLine: 'underline' },
});
