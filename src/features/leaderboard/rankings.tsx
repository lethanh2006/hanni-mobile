import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Avatar, Button, Card, Icon, SectionHeading, type IconName } from '@/components/ui';
import { alpha, mix, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Leaderboard, LeaderboardMetricKey, Me } from '@/lib/types';

/** 2 tiêu chí như `LEADERBOARD_METRICS` của web. */
export const METRICS: {
  key: LeaderboardMetricKey;
  label: string;
  icon: IconName;
  description: string;
  href: Href;
  action: string;
}[] = [
  {
    key: 'streak',
    label: 'Chuỗi hiện tại',
    icon: 'flame',
    description: 'Xếp hạng theo chuỗi ngày học liên tiếp hiện tại.',
    href: '/study',
    action: 'Học tiếp hôm nay',
  },
  {
    key: 'lessons',
    label: 'Bài đã xong',
    icon: 'check',
    description: 'Xếp hạng theo số bài học đã hoàn thành.',
    href: '/',
    action: 'Tiếp tục học bài',
  },
];

export const metricDetails = (key: LeaderboardMetricKey) => METRICS.find((m) => m.key === key) ?? METRICS[0];

const number = (value: number) => value.toLocaleString('vi-VN');

/** Màu huy chương theo hạng: 1 vàng đồng, 2 xám, 3 cam. */
const MEDAL: Record<number, ThemeColor> = { 1: 'accent', 2: 'muted', 3: 'warn' };

/** "Vị trí của bạn" (khách: lời mời tạo tài khoản) + bục 3 người "Những gương mặt nổi bật" (`LeaderboardOverview` của web). */
export function LeaderboardOverview({ board, user }: { board: Leaderboard; user: Me | null }) {
  const theme = useTheme();
  const details = metricDetails(board.metric);
  const leaders = board.rows.filter((r) => r.rank >= 1 && r.rank <= 3).slice(0, 3);
  // Bục: hạng 2 · hạng 1 · hạng 3.
  const podium = [2, 1, 3].map((rank) => leaders.find((r) => r.rank === rank)).filter((r) => r !== undefined);

  return (
    <View style={styles.overview}>
      {!user ? (
        <Card style={[styles.me, { borderColor: alpha(theme.primary, 0.15) }]}>
          <AppText weight="600">Muốn có tên trên bảng?</AppText>
          <AppText color="muted" style={styles.meText}>
            Tạo tài khoản miễn phí — mỗi bài học, mỗi lượt ôn đều được tính, học đều là lên hạng.
          </AppText>
          <Button title="Tạo tài khoản" icon="arrow" onPress={() => router.push('/register')} style={styles.meButton} />
        </Card>
      ) : (
        <Card style={[styles.me, { borderColor: alpha(theme.primary, 0.15) }]}>
          <View style={styles.meHead}>
            <Avatar user={user} size={34} />
            <View style={styles.flex}>
              <AppText weight="600">Vị trí của bạn</AppText>
              <AppText variant="caption" color="muted" numberOfLines={1}>
                {user.displayName}
              </AppText>
            </View>
            <Icon name={details.icon} size={19} color="primary" />
          </View>
          <View style={styles.dl}>
            <View style={[styles.dlCell, styles.dlLeft, { borderColor: theme.border }]}>
              <AppText variant="caption" color="muted">
                Thứ hạng
              </AppText>
              {board.me.rank === null ? (
                <AppText weight="600" color="primary" style={styles.unranked}>
                  Chưa xếp hạng
                </AppText>
              ) : (
                <AppText weight="700" color="primary" style={styles.bigNo}>
                  <AppText weight="500" color="primary" style={styles.hash}>
                    #
                  </AppText>
                  {number(board.me.rank)}
                </AppText>
              )}
              <AppText variant="caption" color="muted" style={styles.dlSub}>
                trong {number(board.me.totalRanked)} người học
              </AppText>
            </View>
            <View style={[styles.dlCell, styles.dlRight]}>
              <AppText variant="caption" color="muted">
                {board.label}
              </AppText>
              <AppText weight="700" style={styles.bigNo}>
                {number(board.me.value)}
              </AppText>
              <AppText variant="caption" color="muted" style={styles.dlSub}>
                {board.unit}
              </AppText>
            </View>
          </View>
          <Button title={details.action} icon="arrow" onPress={() => router.navigate(details.href)} />
        </Card>
      )}

      {podium.length > 0 && (
        <Card
          style={[
            styles.spotlight,
            { backgroundImage: `radial-gradient(ellipse at 50% 85%, ${alpha(theme.accent, 0.09)}, transparent 65%)` },
          ]}>
          <View style={styles.spotHead}>
            <View style={styles.spotTitle}>
              <Icon name="trophy" size={18} color="accent" />
              <AppText weight="600" style={styles.spotText}>
                Những gương mặt nổi bật
              </AppText>
            </View>
            <AppText variant="caption" color="muted" style={styles.spotSub}>
              Cùng lan tỏa tinh thần học mỗi ngày.
            </AppText>
          </View>
          <View style={styles.podium}>
            {podium.map((row) => {
              const medal = theme[MEDAL[row.rank]];
              const first = row.rank === 1;
              return (
                <Pressable key={row.userId} onPress={() => router.push(`/u/${row.userId}`)} style={styles.entry}>
                  <View
                    style={[
                      styles.avatarRing,
                      {
                        borderColor: alpha(medal, 0.35),
                        backgroundColor: theme.surface,
                        boxShadow: `0 4px 16px -8px ${alpha(medal, 0.45)}`,
                      },
                    ]}>
                    {first && (
                      <View style={styles.winner}>
                        <Icon name="trophy" size={22} color="accent" />
                      </View>
                    )}
                    <Avatar user={{ id: row.userId, displayName: row.displayName, avatarUrl: row.avatarUrl }} size={first ? 64 : 52} />
                    <View style={[styles.medal, { borderColor: theme.surface, backgroundColor: mix(medal, theme.surface, 0.18) }]}>
                      <AppText variant="caption" weight="700">
                        {row.rank}
                      </AppText>
                    </View>
                  </View>
                  <AppText variant="caption" weight="600" center numberOfLines={2} style={styles.podiumName}>
                    {row.displayName}
                  </AppText>
                  <AppText variant="caption" weight="600" color={row.isMe ? 'primary' : 'muted'} style={styles.podiumRank}>
                    {row.isMe ? 'Bạn' : `Hạng ${row.rank}`}
                  </AppText>
                  <View
                    style={[
                      styles.step,
                      {
                        minHeight: first ? 84 : row.rank === 3 ? 56 : 64,
                        borderColor: alpha(medal, 0.16),
                        backgroundImage: `linear-gradient(180deg, ${mix(medal, theme.surface, 0.13)}, ${mix(medal, theme.surface, 0.03)})`,
                      },
                    ]}>
                    <AppText weight="700" center style={styles.stepNo}>
                      {number(row.value)}
                    </AppText>
                    <AppText variant="caption" color="muted" center>
                      {board.unit}
                    </AppText>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </Card>
      )}
    </View>
  );
}

/** Bảng "Cộng đồng cùng tiến bộ" (`LeaderboardRankings` của web): Hạng · Người học · chỉ số; dòng của mình tô đỏ nhạt. */
export function Rankings({ board }: { board: Leaderboard }) {
  const theme = useTheme();
  const limited = board.rows.length < board.me.totalRanked;
  return (
    <Card style={styles.table}>
      <View style={styles.tableHead}>
        <SectionHeading
          icon="trophy"
          tone="accent"
          title={limited ? 'Người học dẫn đầu' : 'Cộng đồng cùng tiến bộ'}
          right={
            <View style={[styles.count, { backgroundColor: theme.surface2 }]}>
              <AppText variant="caption" weight="500" color="muted">
                {number(board.me.totalRanked)} người học
              </AppText>
            </View>
          }
        />
      </View>
      <View style={[styles.thead, { borderColor: theme.border, backgroundColor: mix(theme.surface2, theme.surface, 0.6) }]}>
        <AppText variant="caption" weight="500" color="muted" style={styles.rankCol}>
          Hạng
        </AppText>
        <AppText variant="caption" weight="500" color="muted" style={styles.flex}>
          Người học
        </AppText>
        <AppText variant="caption" weight="500" color="muted" style={styles.scoreCol}>
          {board.label}
        </AppText>
      </View>
      {board.rows.map((row, i) => {
        const tone = row.rank === 1 ? theme.accent : row.rank === 3 ? theme.warn : null;
        return (
          <View
            key={row.userId}
            style={[
              styles.tr,
              i > 0 && { borderTopWidth: 1, borderColor: theme.border },
              row.isMe && { backgroundColor: mix(theme.primary, theme.surface, 0.05), boxShadow: `inset 3px 0 0 ${theme.primary}` },
            ]}>
            <View style={styles.rankCol}>
              <View
                style={[
                  styles.tableRank,
                  tone ? { backgroundColor: alpha(tone, row.rank === 1 ? 0.12 : 0.1) } : row.rank === 2 && { backgroundColor: theme.surface2 },
                ]}>
                {row.rank === 1 ? (
                  <Icon name="trophy" size={17} color="accent" />
                ) : (
                  <AppText variant="caption" weight="600" color={row.rank === 3 ? 'warn' : 'muted'}>
                    {row.rank}
                  </AppText>
                )}
              </View>
            </View>
            <Pressable onPress={() => router.push(`/u/${row.userId}`)} style={styles.person}>
              <Avatar user={{ id: row.userId, displayName: row.displayName, avatarUrl: row.avatarUrl }} size={36} />
              <View style={styles.flex}>
                <View style={styles.nameRow}>
                  <AppText weight="600">{row.displayName}</AppText>
                  {row.isMe && (
                    <View style={[styles.tag, { backgroundColor: alpha(theme.primary, 0.1) }]}>
                      <AppText variant="caption" weight="600" color="primary">
                        Bạn
                      </AppText>
                    </View>
                  )}
                </View>
                {board.metric !== 'streak' && row.currentStreak > 0 && (
                  <View style={styles.streak}>
                    <Icon name="flame" size={12} color="primary" />
                    <AppText variant="caption" color="muted">
                      Chuỗi {number(row.currentStreak)} ngày
                    </AppText>
                  </View>
                )}
              </View>
            </Pressable>
            <View style={styles.scoreCol}>
              <AppText weight="600" color={row.isMe ? 'primary' : 'text'} style={styles.score}>
                {number(row.value)}
              </AppText>
              <AppText variant="caption" color="muted">
                {board.unit}
              </AppText>
            </View>
          </View>
        );
      })}
      <View style={[styles.foot, { borderColor: theme.border }]}>
        <Icon name="spark" size={14} color="primary" />
        <AppText variant="caption" color="muted" style={styles.flex}>
          {limited
            ? `Hiển thị ${number(board.rows.length)} người dẫn đầu. Vị trí riêng của bạn luôn ở phía trên.`
            : 'Mỗi người một nhịp học. Mỗi ngày một bước tiến.'}
        </AppText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  overview: { gap: 16 },
  flex: { flex: 1, minWidth: 0 },
  me: { gap: 0 },
  meText: { marginTop: 8, lineHeight: 24 },
  meButton: { marginTop: 16 },
  meHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dl: { marginVertical: 16, flexDirection: 'row' },
  dlCell: { flex: 1 },
  dlLeft: { paddingRight: 12, borderRightWidth: 1 },
  dlRight: { paddingLeft: 16 },
  bigNo: { marginTop: 4, fontSize: 24, lineHeight: 30, letterSpacing: -0.6, fontVariant: ['tabular-nums'] },
  hash: { fontSize: 18 },
  unranked: { marginTop: 4, fontSize: 16 },
  dlSub: { marginTop: 4 },
  spotlight: { padding: 0, gap: 0, overflow: 'hidden' },
  spotHead: { paddingHorizontal: 20, paddingTop: 20 },
  spotTitle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  spotText: { fontSize: 16 },
  spotSub: { marginTop: 4 },
  podium: { marginTop: 30, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 8, paddingHorizontal: 16 },
  entry: { flex: 1, maxWidth: 160, minWidth: 0, alignItems: 'center' },
  avatarRing: { marginBottom: 15, padding: 4, borderWidth: 1, borderRadius: 999 },
  winner: { position: 'absolute', top: -28, alignSelf: 'center', left: '50%', marginLeft: -11, transform: [{ rotate: '-10deg' }] },
  medal: {
    position: 'absolute',
    bottom: -10,
    left: '50%',
    marginLeft: -12,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  podiumName: { width: '100%', lineHeight: 18 },
  podiumRank: { marginTop: 4 },
  step: {
    width: '100%',
    marginTop: 12,
    paddingHorizontal: 4,
    paddingVertical: 10,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  stepNo: { fontSize: 18, lineHeight: 24, fontVariant: ['tabular-nums'] },
  table: { padding: 0, gap: 0, overflow: 'hidden' },
  tableHead: { paddingHorizontal: 16, paddingVertical: 16 },
  count: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  thead: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderBottomWidth: 1, paddingVertical: 10 },
  rankCol: { width: 60, alignItems: 'center', textAlign: 'center' },
  scoreCol: { width: 110, paddingLeft: 8, paddingRight: 16, alignItems: 'flex-end', textAlign: 'right' },
  tr: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15 },
  tableRank: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  person: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 10 },
  nameRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 8, rowGap: 2 },
  tag: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  streak: { marginTop: 4, flexDirection: 'row', alignItems: 'center', gap: 4 },
  score: { fontSize: 16, fontVariant: ['tabular-nums'] },
  foot: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderTopWidth: 1, paddingHorizontal: 16, paddingVertical: 12 },
});
