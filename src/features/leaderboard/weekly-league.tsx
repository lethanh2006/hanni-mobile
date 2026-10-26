import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Avatar, Card, Icon } from '@/components/ui';
import { alpha, mix } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useWeeklyLeague } from '@/lib/hooks';

const ZONE_LABEL: Record<string, string> = { promote: 'Sắp thăng hạng', demote: 'Sắp rớt hạng' };

/**
 * Thẻ "Giải đấu tuần" (`WeeklyLeagueCard` của web): xếp theo lượt ôn trong tuần cùng người CÙNG bậc, tự thăng/giáng
 * hạng mỗi tuần. Bảng còn thưa thì giải thích luật chơi thay cho khoảng trống.
 */
export function WeeklyLeague() {
  const theme = useTheme();
  const board = useWeeklyLeague();
  const data = board.data;

  return (
    <Card style={styles.card}>
      <View style={styles.heading}>
        <View style={styles.title}>
          <Icon name="trophy" size={18} color="primary" />
          <AppText weight="600">Giải đấu tuần</AppText>
          {data && (
            <View style={[styles.tier, { backgroundColor: alpha(data.tier.color, 0.1) }]}>
              <AppText variant="caption" weight="600" style={{ color: data.tier.color }}>
                {data.tier.name}
              </AppText>
            </View>
          )}
        </View>
        {data && (
          <AppText variant="caption" color="muted">
            Còn {data.daysRemaining} ngày
          </AppText>
        )}
      </View>

      {board.isLoading ? (
        <AppText color="muted" style={styles.note}>
          Đang tải…
        </AppText>
      ) : !data?.rows.length ? (
        <AppText color="muted" style={styles.note}>
          Ôn tập vài từ hôm nay để bắt đầu tham gia giải đấu tuần này.
        </AppText>
      ) : (
        <View style={styles.list}>
          {data.rows.slice(0, 5).map((row, i) => (
            <View
              key={row.userId}
              style={[
                styles.row,
                row.isMe && {
                  borderColor: alpha(theme.primary, 0.09),
                  backgroundImage: `linear-gradient(90deg, ${mix(theme.primary, theme.surface, 0.08)}, ${mix(theme.primary, theme.surface, 0.03)})`,
                },
              ]}>
              <View
                style={[
                  styles.rank,
                  { backgroundColor: i === 0 ? mix(theme.accent, theme.surface, 0.1) : theme.surface2 },
                ]}>
                <AppText variant="caption" weight="600" color={i === 0 ? 'accent' : 'muted'}>
                  {row.rank}
                </AppText>
              </View>
              <Avatar user={{ id: row.userId, displayName: row.displayName, avatarUrl: row.avatarUrl }} size={28} />
              <AppText weight="500" numberOfLines={1} style={styles.flex}>
                {row.isMe ? 'Bạn' : row.displayName}
              </AppText>
              {row.zone !== 'safe' && (
                <AppText variant="caption" weight="600" color={row.zone === 'promote' ? 'good' : 'danger'}>
                  {ZONE_LABEL[row.zone]}
                </AppText>
              )}
              <AppText weight="600" color="primary">
                {row.points} lượt ôn
              </AppText>
            </View>
          ))}
        </View>
      )}
      {data && data.rows.length < 4 && (
        <View style={[styles.rules, { backgroundColor: alpha(theme.surface2, 0.6) }]}>
          <View style={styles.tiers}>
            {data.tiers.map((t, i) => (
              <View
                key={t.name}
                style={[
                  styles.tierBar,
                  { backgroundColor: t.color, opacity: i === data.tierIndex ? 1 : 0.5 },
                  i === data.tierIndex && { boxShadow: `0 0 0 2px ${theme.surface}, 0 0 0 4px ${t.color}` },
                ]}
              />
            ))}
          </View>
          <AppText variant="caption" color="muted" style={styles.rule}>
            Bậc{' '}
            <AppText variant="caption" weight="700" style={{ color: data.tier.color }}>
              {data.tier.name}
            </AppText>{' '}
            · {data.tierIndex + 1}/{data.tiers.length}
            {data.tierIndex + 1 < data.tiers.length ? ` — lên tiếp là ${data.tiers[data.tierIndex + 1].name}` : ''}.
          </AppText>
          {[
            'Mỗi lượt ôn từ (ôn tập, học bài mới) = 1 điểm tuần.',
            'Hết tuần, nhóm đầu bảng lên bậc, cuối bảng xuống bậc (khi nhóm có từ 5 người).',
            'Bạn chỉ đua với người cùng bậc — mời bạn bè cùng học để bảng sôi hơn.',
          ].map((r) => (
            <AppText key={r} variant="caption" color="muted" style={styles.rule}>
              • {r}
            </AppText>
          ))}
        </View>
      )}
      <Pressable onPress={() => router.navigate('/study')} style={styles.link} hitSlop={6}>
        <AppText variant="caption" weight="500" color="primary">
          Ôn tập ngay để giữ hạng
        </AppText>
        <Icon name="arrow" size={13} color="primary" />
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 0 },
  heading: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  title: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tier: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  note: { marginVertical: 16 },
  list: { marginTop: 18, gap: 6 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 45,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 12,
  },
  rank: { width: 22, height: 22, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1, minWidth: 0 },
  rules: { marginTop: 16, borderRadius: 12, padding: 14, gap: 6 },
  tiers: { flexDirection: 'row', gap: 4, marginBottom: 6 },
  tierBar: { flex: 1, height: 10, borderRadius: 999 },
  rule: { lineHeight: 20 },
  link: { marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
});
