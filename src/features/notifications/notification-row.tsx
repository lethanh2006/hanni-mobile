import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Icon, type IconName } from '@/components/ui';
import { alpha, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { appHref, markNotificationsRead } from '@/lib/notifications';
import { timeAgo } from '@/lib/time';
import type { AppNotification, NotificationType } from '@/lib/types';

/** Mỗi loại thông báo 1 biểu tượng/màu (nền pha 10–12%) + chỗ mở mặc định khi server không gửi `href`. */
const LOOK: Record<NotificationType, { icon: IconName; color: ThemeColor; tint: number; href: Href }> = {
  ACHIEVEMENT_UNLOCKED: { icon: 'trophy', color: 'primary', tint: 0.1, href: '/achievements' },
  CLASS_ASSIGNMENT: { icon: 'users', color: 'lavender', tint: 0.12, href: '/lop-hoc' },
  LEAGUE_RESULT: { icon: 'flag', color: 'accent', tint: 0.1, href: '/leaderboard' },
  STREAK_SAVED: { icon: 'shield', color: 'good', tint: 0.1, href: '/' },
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

/** 1 dòng trong khung thông báo: bấm là đánh dấu đã đọc cả dòng, đóng khung rồi mở đúng chỗ. */
export function NotificationRow({
  row,
  last,
  onOpen,
}: {
  row: AppNotification[];
  last: boolean;
  onOpen: () => void;
}) {
  const theme = useTheme();
  const first = row[0];
  const look = LOOK[first.type];
  const unread = row.some((n) => !n.readAt);

  function open() {
    void markNotificationsRead(row.filter((n) => !n.readAt).map((n) => n.id));
    onOpen();
    router.push(appHref(first.href, look.href));
  }

  return (
    <Pressable
      onPress={open}
      style={({ pressed }) => [
        styles.row,
        !last && { borderBottomWidth: 1, borderColor: theme.border },
        unread && { backgroundColor: alpha(theme.primary, 0.05) },
        pressed && { backgroundColor: theme.surface2 },
      ]}>
      <View style={[styles.icon, { backgroundColor: alpha(theme[look.color], look.tint) }]}>
        <Icon name={look.icon} size={17} color={look.color} />
      </View>
      <View style={styles.flex}>
        <AppText style={styles.text}>{rowText(row)}</AppText>
        <AppText variant="caption" color="muted" style={styles.time}>
          {timeAgo(first.createdAt)}
        </AppText>
      </View>
      {unread && <View style={[styles.dot, { backgroundColor: theme.primary }]} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  icon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1, minWidth: 0 },
  text: { lineHeight: 20 },
  time: { marginTop: 2 },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
});
