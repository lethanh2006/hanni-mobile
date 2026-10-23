import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText, Avatar, Button, Card } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Leaderboard, Me } from '@/lib/types';

const number = (value: number) => value.toLocaleString('vi-VN');

/** "Vị trí của bạn"; khách thì thành lời mời tạo tài khoản. */
export function MyRank({ board, user }: { board: Leaderboard; user: Me | null }) {
  if (!user) {
    return (
      <Card>
        <AppText bold>Muốn có tên trên bảng?</AppText>
        <AppText variant="small" color="muted">
          Tạo tài khoản miễn phí — mỗi bài học, mỗi lượt ôn đều được tính, học đều là lên hạng.
        </AppText>
        <Button title="Tạo tài khoản" icon="arrow" onPress={() => router.push('/register')} />
      </Card>
    );
  }
  return (
    <Card>
      <View style={styles.row}>
        <Avatar user={user} size={36} />
        <AppText bold style={styles.flex}>
          Vị trí của bạn
        </AppText>
      </View>
      <View style={styles.row}>
        <View style={styles.flex}>
          <AppText variant="caption" color="muted">
            Thứ hạng
          </AppText>
          <AppText variant="title" color="primary">
            {board.me.rank === null ? '—' : `#${number(board.me.rank)}`}
          </AppText>
          <AppText variant="caption" color="muted">
            trong {number(board.me.totalRanked)} người học
          </AppText>
        </View>
        <View style={styles.flex}>
          <AppText variant="caption" color="muted">
            {board.label}
          </AppText>
          <AppText variant="title">{number(board.me.value)}</AppText>
          <AppText variant="caption" color="muted">
            {board.unit}
          </AppText>
        </View>
      </View>
    </Card>
  );
}

/** Danh sách xếp hạng. */
export function Rankings({ board }: { board: Leaderboard }) {
  const theme = useTheme();
  return (
    <Card>
      {board.rows.map((row) => (
        <View key={row.userId} style={[styles.member, row.isMe && { backgroundColor: theme.primarySoft }]}>
          <AppText bold color={row.rank <= 3 ? 'accent' : 'muted'} style={styles.rank}>
            {row.rank}
          </AppText>
          <Avatar user={{ id: row.userId, displayName: row.displayName, avatarUrl: row.avatarUrl }} size={32} />
          <View style={styles.flex}>
            <AppText variant="small" bold numberOfLines={1}>
              {row.isMe ? `${row.displayName} (bạn)` : row.displayName}
            </AppText>
            {row.title && (
              <AppText variant="caption" color="good" numberOfLines={1}>
                {row.title}
              </AppText>
            )}
          </View>
          <AppText variant="small" bold>
            {number(row.value)} {board.unit}
          </AppText>
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  flex: { flex: 1 },
  member: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.md,
  },
  rank: { width: 24, textAlign: 'center' },
});
