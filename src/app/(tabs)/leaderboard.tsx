import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useState } from 'react';

import { AppText, Button, EmptyState, ErrorNote, Icon, PageHeader, Screen, Skeleton, TourButton, type TourStep } from '@/components/ui';
import { alpha } from '@/constants/theme';
import { LeaderboardOverview, METRICS, metricDetails, Rankings } from '@/features/leaderboard/rankings';
import { WeeklyLeague } from '@/features/leaderboard/weekly-league';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth';
import { useLeaderboard } from '@/lib/hooks';
import type { LeaderboardMetricKey } from '@/lib/types';

const TOUR: TourStep[] = [
  {
    icon: 'flame',
    title: 'Chuỗi ngày học',
    description: 'Bảng mặc định: ai học liên tục nhiều ngày nhất. Mỗi ngày học 1 bài hoặc ôn vài từ là giữ được chuỗi.',
  },
  { icon: 'check', title: 'Bài đã xong', description: 'Đổi tab để xếp theo số bài học đã hoàn thành trên lộ trình.' },
  {
    icon: 'trophy',
    title: 'Giải đấu tuần',
    description:
      'Thi đua theo tuần với người cùng bậc: đầu bảng lên bậc, cuối bảng xuống bậc — thẻ "Giải đấu tuần" ở đầu trang này.',
  },
];

/** Bảng xếp hạng (trang `/leaderboard` của web): giải đấu tuần + bảng theo chuỗi ngày / bài đã xong. Khách xem được. */
export default function LeaderboardScreen() {
  const theme = useTheme();
  const { user } = useAuth();
  const [metric, setMetric] = useState<LeaderboardMetricKey>('streak');
  const board = useLeaderboard(metric);
  const details = metricDetails(metric);

  return (
    <Screen>
      <PageHeader
        icon="trophy"
        tone="accent"
        title="Bảng xếp hạng"
        description="Giải đấu tuần với người cùng bậc, và bảng xếp hạng theo chuỗi ngày học, số bài đã xong."
        right={<TourButton steps={TOUR} />}
      />
      {user && <WeeklyLeague />}

      <View style={styles.tabsWrap}>
        <View style={[styles.tabs, { borderColor: theme.border, backgroundColor: alpha(theme.surface2, 0.7) }]}>
          {METRICS.map((m) => {
            const on = m.key === metric;
            return (
              <Pressable
                key={m.key}
                onPress={() => setMetric(m.key)}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                style={[
                  styles.tab,
                  on
                    ? {
                        borderColor: alpha(theme.primary, 0.15),
                        backgroundColor: theme.surface,
                        boxShadow: `0 1px 3px ${alpha(theme.text, 0.1)}`,
                      }
                    : { borderColor: 'transparent' },
                ]}>
                <Icon name={m.icon} size={17} color={on ? 'primary' : 'muted'} />
                <AppText variant="caption" weight="600" color={on ? 'primary' : 'muted'}>
                  {m.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.note}>
          <Icon name="info" size={14} color="muted" />
          <AppText variant="caption" color="muted" style={styles.noteText}>
            {details.description}
          </AppText>
        </View>
      </View>

      {board.error && (
        <ErrorNote>
          {board.data ? 'Chưa cập nhật được bảng xếp hạng. Đang hiển thị dữ liệu đã tải.' : 'Chưa tải được bảng xếp hạng.'}{' '}
          <AppText weight="600" color="danger" style={styles.underline} onPress={() => void board.mutate()}>
            Thử lại
          </AppText>
        </ErrorNote>
      )}
      {!board.data ? (
        !board.error && (
          <View style={styles.skeleton}>
            <Skeleton height={224} radius={16} />
            <Skeleton height={320} radius={16} />
            <Skeleton height={256} radius={16} />
          </View>
        )
      ) : board.data.rows.length === 0 ? (
        <EmptyState
          title="Hành trình bắt đầu từ bước nhỏ"
          description="Chưa có người học được xếp hạng ở mục này. Bắt đầu học để ghi dấu bước tiến đầu tiên của bạn nhé.">
          <Button title={details.action} icon="arrow" onPress={() => router.navigate(details.href)} />
        </EmptyState>
      ) : (
        <View style={styles.boards}>
          <LeaderboardOverview board={board.data} user={user} />
          <Rankings board={board.data} />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabsWrap: { gap: 12 },
  tabs: { flexDirection: 'row', gap: 6, borderWidth: 1, borderRadius: 16, padding: 6 },
  tab: {
    flex: 1,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
  },
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingHorizontal: 4 },
  noteText: { flex: 1, lineHeight: 20 },
  underline: { textDecorationLine: 'underline' },
  skeleton: { gap: 20 },
  boards: { gap: 20 },
});
