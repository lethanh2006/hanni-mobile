import { router, type Href } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import useSWR from 'swr';

import { AppText, Button, Card, ErrorNote, Hanzi, Icon, Skeleton, type IconName } from '@/components/ui';
import { alpha, type ThemeColor } from '@/constants/theme';
import { partInfo, SECTION_SHORT } from '@/features/mock-exam/part-info';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';
import type { CoachResult, InsightsReport, PeriodStats } from '@/lib/types';

const hasActivity = (s: PeriodStats) => s.daysStudied > 0 || s.reviews > 0 || s.lessons > 0 || s.mockExams.count > 0;

/** Việc nên làm tiếp — tính thẳng từ số liệu (không qua AI) nên ai cũng có. */
function nextSteps(r: InsightsReport): { href: Href; label: string; icon: IconName }[] {
  const steps: { href: Href; label: string; icon: IconName }[] = r.weakParts.map((w) => ({
    href: `/thi-thu-hsk/dang-bai/${w.slug}`,
    label: `Luyện HSK ${w.level} · ${SECTION_SHORT[w.section]} ${w.part}: ${partInfo(w.section, w.type).label}`,
    icon: 'target',
  }));
  if (r.dueNow > 0) steps.push({ href: { pathname: '/review', params: { review: '1' } }, label: `Ôn ${r.dueNow} từ đến hạn`, icon: 'cards' });
  if (r.leechCount > 0)
    steps.push({ href: { pathname: '/review', params: { leeches: '1' } }, label: `Ôn riêng ${r.leechCount} từ khó nhớ`, icon: 'refresh' });
  steps.push({ href: '/', label: 'Học bài tiếp theo trong lộ trình', icon: 'route' });
  return steps.slice(0, 4);
}

function CoachList({ title, icon, tone, items }: { title: string; icon: IconName; tone: ThemeColor; items: string[] }) {
  if (!items.length) return null;
  return (
    <View>
      <AppText weight="600" style={styles.h4}>
        {title}
      </AppText>
      <View style={styles.items}>
        {items.map((x) => (
          <View key={x} style={styles.item}>
            <View style={styles.itemIcon}>
              <Icon name={icon} size={16} color={tone} />
            </View>
            <AppText style={styles.itemText}>{x}</AppText>
          </View>
        ))}
      </View>
    </View>
  );
}

/**
 * Hanni Coach (`CoachCard` của web): Premium thấy nhận xét AI (tổng quan, làm tốt, cần chú ý, kế hoạch kỳ tới); bản
 * thường thấy mô tả + ví dụ làm mờ. "Từ bạn hay quên" và "Việc nên làm ngay" tính từ số liệu nên ai cũng có.
 * App không bán Premium nên nút mở phần Premium ở Tài khoản.
 */
export function CoachCard({ report, name, next }: { report: InsightsReport; name: string; next: string }) {
  const theme = useTheme();
  const active = hasActivity(report.current);
  const canCoach = report.ai.premium && report.ai.enabled && active;
  const coach = useSWR<CoachResult>(
    canCoach ? ['coach', report.period, report.offset] : null,
    () => api.post<CoachResult>('/insights/report/coach', { period: report.period, offset: report.offset }),
    { revalidateOnFocus: false, shouldRetryOnError: false },
  );
  const summary = coach.data?.summary ?? null;
  const tipFor = (zh: string) => summary?.mnemonics.find((t) => t.zh === zh)?.tip;
  const hasTips = report.hardWords.some((w) => tipFor(w.simplified));

  return (
    <Card style={styles.card}>
      <View style={styles.head}>
        <View style={[styles.tile, { backgroundColor: alpha(theme.accent, 0.1), borderColor: theme.border }]}>
          <Icon name="spark" size={20} color="accent" />
        </View>
        <View style={styles.flex}>
          <View style={styles.titleRow}>
            <AppText weight="600">Hanni Coach</AppText>
            <View style={[styles.badge, { backgroundColor: alpha(theme.accent, 0.1) }]}>
              <AppText variant="caption" weight="700" color="accent">
                PREMIUM
              </AppText>
            </View>
          </View>
          <AppText variant="caption" color="muted">
            Nhận xét {name.toLowerCase()} bằng AI, dựa trên đúng số liệu của bạn
          </AppText>
        </View>
      </View>

      {!report.ai.premium ? (
        <View style={[styles.upsell, { borderColor: alpha(theme.accent, 0.25), backgroundColor: alpha(theme.accent, 0.05) }]}>
          <AppText style={styles.body}>
            Hanni Coach đọc số liệu {name.toLowerCase()} rồi viết riêng cho bạn: điều làm tốt, điều cần chú ý, mẹo nhớ những
            từ bạn hay quên theo <AppText weight="700">âm Hán Việt</AppText> và kế hoạch {next} có con số cụ thể.
          </AppText>
          <AppText variant="caption" weight="600" color="muted" style={styles.example}>
            VÍ DỤ
          </AppText>
          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={[styles.blurBox, { backgroundColor: theme.surface, filter: [{ blur: 2.5 }] }]}>
            <AppText>Tuần này bạn học 4/7 ngày, nhiều hơn 2 ngày so với tuần trước, thêm 32 từ mới.</AppText>
            <AppText>便宜 (tiện nghi): đồ “tiện nghi” mà giá lại “rẻ” — nhớ ngay nghĩa rẻ.</AppText>
            <AppText>Tuần tới: luyện 10 câu nghe ghép tranh, ôn 30 thẻ mỗi ngày.</AppText>
          </View>
          <Button
            title="Mở Hanni Coach với Premium"
            leftIcon="crown"
            onPress={() => router.navigate('/account')}
            style={styles.upgrade}
          />
        </View>
      ) : !report.ai.enabled ? (
        <AppText color="muted">Hanni Coach đang tạm tắt — số liệu bên trên vẫn đầy đủ.</AppText>
      ) : !active ? (
        <View style={[styles.empty, { backgroundColor: alpha(theme.surface2, 0.6) }]}>
          <AppText style={styles.body}>
            {name} chưa có buổi học nào nên Hanni Coach chưa có gì để nhận xét. Học 1 bài là có ngay số liệu đầu tiên.
          </AppText>
        </View>
      ) : coach.error ? (
        <ErrorNote>Hanni Coach đang bận, chưa viết được nhận xét. Thử lại sau nhé.</ErrorNote>
      ) : !summary ? (
        <View style={styles.waiting}>
          <View style={styles.titleRow}>
            <ActivityIndicator size="small" color={theme.accent} />
            <AppText color="muted">Hanni Coach đang đọc số liệu của bạn… (khoảng 10–15 giây)</AppText>
          </View>
          {['92%', '80%', '86%', '60%'].map((w) => (
            <Skeleton key={w} width={w as `${number}%`} height={12} radius={4} />
          ))}
        </View>
      ) : (
        <View style={styles.summary}>
          <AppText style={styles.overview}>{summary.overview}</AppText>
          <CoachList title="Làm tốt" icon="check" tone="good" items={summary.wins} />
          <CoachList title="Cần chú ý" icon="info" tone="warn" items={summary.watch} />
          <View>
            <AppText weight="600" style={styles.h4}>
              Kế hoạch {next}
            </AppText>
            <View style={styles.items}>
              {summary.plan.map((x, i) => (
                <View key={x} style={styles.item}>
                  <View style={[styles.no, { backgroundColor: alpha(theme.primary, 0.1) }]}>
                    <AppText variant="caption" weight="700" color="primary">
                      {i + 1}
                    </AppText>
                  </View>
                  <AppText style={styles.itemText}>{x}</AppText>
                </View>
              ))}
            </View>
          </View>
          {coach.data?.generatedAt && (
            <AppText variant="caption" color="muted">
              Viết lúc{' '}
              {new Date(coach.data.generatedAt).toLocaleString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
                day: '2-digit',
                month: '2-digit',
              })}{' '}
              · AI có thể nhầm — số liệu chính xác ở thẻ bên trên.
            </AppText>
          )}
        </View>
      )}

      {report.hardWords.length > 0 && (
        <View style={styles.block}>
          <AppText weight="600" style={styles.h4}>
            {hasTips ? 'Mẹo nhớ từ bạn hay quên' : `Từ bạn hay quên ${name.toLowerCase()}`}
          </AppText>
          <View style={styles.items}>
            {report.hardWords.map((w) => {
              const tip = tipFor(w.simplified);
              return (
                <Pressable
                  key={w.id}
                  onPress={() => router.push(`/tu-dien/${encodeURIComponent(w.simplified)}`)}
                  style={({ pressed }) => [
                    styles.hard,
                    { borderColor: pressed ? alpha(theme.primary, 0.4) : theme.border },
                  ]}>
                  <View style={styles.hardTop}>
                    <Hanzi size={20}>{w.simplified}</Hanzi>
                    <AppText variant="caption" color="muted">
                      {w.pinyin}
                    </AppText>
                    {w.hanViet && (
                      <AppText variant="caption" weight="600" color="hanviet">
                        {w.hanViet}
                      </AppText>
                    )}
                    <AppText variant="caption" color="muted" style={styles.forgot}>
                      quên {w.forgot} lần
                    </AppText>
                  </View>
                  <AppText variant="caption" color="muted">
                    {w.meaningVi}
                  </AppText>
                  {tip && <AppText style={styles.tip}>{tip}</AppText>}
                </Pressable>
              );
            })}
          </View>
        </View>
      )}
      <View style={styles.block}>
        <AppText weight="600" style={styles.h4}>
          Việc nên làm ngay
        </AppText>
        <View style={styles.items}>
          {nextSteps(report).map((s) => (
            <Pressable
              key={s.label}
              onPress={() => router.push(s.href)}
              style={({ pressed }) => [
                styles.step,
                {
                  borderColor: theme.border,
                  backgroundColor: pressed ? theme.surface2 : theme.surface,
                  boxShadow: `0 ${pressed ? 1 : 3}px 0 ${theme.border}`,
                },
              ]}>
              <Icon name={s.icon} size={16} color="primary" />
              <AppText weight="600" style={styles.flex}>
                {s.label}
              </AppText>
            </Pressable>
          ))}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 0 },
  head: { marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 8 },
  tile: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1, minWidth: 0 },
  titleRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  badge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  upsell: { borderWidth: 1, borderRadius: 16, padding: 16 },
  body: { lineHeight: 24 },
  example: { marginTop: 12, letterSpacing: 0.6 },
  blurBox: { marginTop: 4, gap: 6, borderRadius: 12, padding: 12 },
  upgrade: { marginTop: 16, alignSelf: 'flex-start' },
  empty: { borderRadius: 16, padding: 16 },
  waiting: { gap: 12 },
  summary: { gap: 20 },
  overview: { lineHeight: 28 },
  h4: { marginBottom: 8 },
  items: { gap: 8 },
  item: { flexDirection: 'row', gap: 10 },
  itemIcon: { marginTop: 4 },
  itemText: { flex: 1, lineHeight: 24 },
  no: { marginTop: 2, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  block: { marginTop: 20 },
  hard: { borderWidth: 1, borderRadius: 16, padding: 12 },
  hardTop: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', columnGap: 8 },
  forgot: { marginLeft: 'auto' },
  tip: { marginTop: 6, lineHeight: 24 },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
});
