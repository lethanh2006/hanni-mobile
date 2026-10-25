import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Icon, type IconName } from '@/components/ui';
import { Radius, Spacing, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { appHref, markNotificationsRead } from '@/lib/notifications';
import { timeAgo } from '@/lib/time';
import type { AppNotification, NotificationType } from '@/lib/types';

/** Mỗi loại thông báo 1 biểu tượng/màu + chỗ mở mặc định khi server không gửi `href`. */
const LOOK: Record<NotificationType, { icon: IconName; color: ThemeColor; href: Href }> = {
  ACHIEVEMENT_UNLOCKED: { icon: 'trophy', color: 'primary', href: '/achievements' },
  CLASS_ASSIGNMENT: { icon: 'users', color: 'lavender', href: '/lop-hoc' },
  LEAGUE_RESULT: { icon: 'flag', color: 'accent', href: '/leaderboard' },
  STREAK_SAVED: { icon: 'shield', color: 'good', href: '/' },
};

/** Huy hiệu mở cùng lúc (xong bài đầu thường mở 2–3 cái) gộp thành 1 dòng. */
const GROUP_WINDOW_MS = 2 * 60_000;

export function groupRows(items: AppNotification[]): AppNotification[][] {
  const rows: AppNotification[][] = [];
  for (const n of items) {
    const row = rows.at(-1);
    const prev = row?.at(-1);
    const sameBurst =
      prev?.type === 'ACHIEVEMENT_UNLOCKED' &&
      n.type === 'ACHIEVEMENT_UNLOCKED' &&
      Date.parse(prev.createdAt) - Date.parse(n.createdAt) <= GROUP_WINDOW_MS;
    if (row && sameBurst) row.push(n);
    else rows.push([n]);
  }
  return rows;
}

function rowText(row: AppNotification[]): string {
  const first = row[0];
  if (first.type !== 'ACHIEVEMENT_UNLOCKED') return first.message ?? 'Bạn có thông báo mới.';
  const names = row.map((n) => `“${n.achievement?.nameVi ?? 'Huy hiệu mới'}”`);
  return row.length === 1
    ? `Bạn vừa đạt huy hiệu ${names[0]}.`
    : `Bạn vừa đạt ${row.length} huy hiệu: ${names.join(', ')}.`;
}

/** 1 dòng thông báo: bấm là đánh dấu đã đọc cả dòng rồi mở đúng chỗ. */
export function NotificationRow({ row }: { row: AppNotification[] }) {
  const theme = useTheme();
  const first = row[0];
  const look = LOOK[first.type];
  const unread = row.some((n) => !n.readAt);

  function open() {
    void markNotificationsRead(row.filter((n) => !n.readAt).map((n) => n.id));
    router.push(appHref(first.href, look.href));
  }

  return (
    <Pressable
      onPress={open}
      style={[styles.row, { borderColor: theme.border }, unread && { backgroundColor: theme.primarySoft }]}>
      <View style={[styles.icon, { backgroundColor: theme.surface2 }]}>
        <Icon name={look.icon} size={18} color={look.color} />
      </View>
      <View style={styles.flex}>
        <AppText variant="small">{rowText(row)}</AppText>
        <AppText variant="caption" color="muted">
          {timeAgo(first.createdAt)}
        </AppText>
      </View>
      {unread && <View style={[styles.dot, { backgroundColor: theme.primary }]} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.md, padding: Spacing.md, borderBottomWidth: 1, borderRadius: Radius.md },
  icon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1, gap: 2 },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
});
