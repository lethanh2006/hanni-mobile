import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText, Avatar, Card, Icon, TextLink } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useWeeklyLeague } from '@/lib/hooks';

/**
 * Giải đấu tuần: xếp theo số lượt ôn trong tuần với người CÙNG bậc, hết tuần thì
 * đầu bảng lên bậc, cuối bảng xuống bậc. Bảng còn thưa thì giải thích luật chơi.
 */
export function WeeklyLeague() {
  const theme = useTheme();
  const { data } = useWeeklyLeague();
  if (!data) return null;

  return (
    <Card>
      <View style={styles.row}>
        <Icon name="trophy" size={18} color="primary" />
        <AppText bold style={styles.flex}>
          Giải đấu tuần ·{' '}
          <AppText bold style={{ color: data.tier.color }}>
            {data.tier.name}
          </AppText>
        </AppText>
        <AppText variant="caption" color="muted">
          Còn {data.daysRemaining} ngày
        </AppText>
      </View>

      {data.rows.length === 0 ? (
        <AppText variant="small" color="muted">
          Ôn tập vài từ hôm nay để bắt đầu tham gia giải đấu tuần này.
        </AppText>
      ) : (
        data.rows.slice(0, 5).map((row) => (
          <View
            key={row.userId}
            style={[styles.member, row.isMe && { backgroundColor: theme.primarySoft }]}>
            <AppText bold color="muted" style={styles.rank}>
              {row.rank}
            </AppText>
            <Avatar user={{ id: row.userId, displayName: row.displayName, avatarUrl: row.avatarUrl }} size={28} />
            <AppText variant="small" bold numberOfLines={1} style={styles.flex}>
              {row.isMe ? 'Bạn' : row.displayName}
            </AppText>
            {row.zone !== 'safe' && (
              <AppText variant="caption" bold color={row.zone === 'promote' ? 'good' : 'danger'}>
                {row.zone === 'promote' ? 'Sắp lên' : 'Sắp xuống'}
              </AppText>
            )}
            <AppText variant="small" bold color="primary">
              {row.points} lượt
            </AppText>
          </View>
        ))
      )}

      {data.rows.length < 4 && (
        <View style={[styles.rules, { backgroundColor: theme.surface2 }]}>
          <View style={styles.tiers}>
            {data.tiers.map((t, i) => (
              <View
                key={t.name}
                style={[styles.tier, { backgroundColor: t.color, opacity: i === data.tierIndex ? 1 : 0.4 }]}
              />
            ))}
          </View>
          <AppText variant="caption" color="muted">
            Bậc {data.tierIndex + 1}/{data.tiers.length}
            {data.tierIndex + 1 < data.tiers.length ? ` — lên tiếp là ${data.tiers[data.tierIndex + 1].name}` : ''}.
            {'\n'}• Mỗi lượt ôn từ (ôn tập, học bài mới) = 1 điểm tuần.
            {'\n'}• Hết tuần, nhóm đầu bảng lên bậc, cuối bảng xuống bậc (khi nhóm có từ 5 người).
          </AppText>
        </View>
      )}
      <TextLink title="Ôn tập ngay để giữ hạng →" onPress={() => router.navigate('/study')} />
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  flex: { flex: 1 },
  member: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 6,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.md,
  },
  rank: { width: 20, textAlign: 'center' },
  rules: { borderRadius: Radius.md, padding: Spacing.md, gap: Spacing.sm },
  tiers: { flexDirection: 'row', gap: 4 },
  tier: { flex: 1, height: 8, borderRadius: 4 },
});
