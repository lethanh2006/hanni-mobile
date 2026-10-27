import { router } from 'expo-router';
import { Modal, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Icon } from '@/components/ui';
import { alpha } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { markAllNotificationsRead, useNotifications } from '@/lib/notifications';

import { groupRows, NotificationRow } from './notification-row';

/**
 * Khung thông báo thả xuống dưới chuông (`NotificationBell` của web ở khổ điện thoại): trải gần hết bề ngang,
 * cách mép 12px, ngay dưới thanh trên 64px; chân khung dẫn tới giờ nhắc học. Bấm ra ngoài là đóng.
 */
export function NotificationPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { data } = useNotifications();
  const unread = data?.unreadCount ?? 0;
  const rows = groupRows(data?.items ?? []);

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Đóng thông báo" />
      <View
        style={[
          styles.panel,
          {
            top: insets.top + 72,
            borderColor: theme.border,
            backgroundColor: theme.surface,
            boxShadow: `0 20px 25px -5px ${alpha(theme.text, 0.1)}, 0 8px 10px -6px ${alpha(theme.text, 0.1)}`,
          },
        ]}>
        <View style={[styles.head, { borderColor: theme.border }]}>
          <AppText weight="700">Thông báo</AppText>
          {unread > 0 && (
            <Pressable onPress={() => void markAllNotificationsRead()} hitSlop={8}>
              <AppText variant="caption" weight="500" color="primary">
                Đánh dấu đã đọc
              </AppText>
            </Pressable>
          )}
        </View>
        <ScrollView style={{ maxHeight: Math.min(384, height - insets.top - insets.bottom - 132) }}>
          {rows.length === 0 ? (
            <AppText color="muted" center style={styles.empty}>
              Hanni báo ở đây khi bạn đạt huy hiệu, có bài tập mới từ lớp học, có kết quả giải đấu tuần hoặc khi lá
              chắn giữ chuỗi cho bạn.
            </AppText>
          ) : (
            rows.map((row, i) => (
              <NotificationRow key={row[0].id} row={row} last={i === rows.length - 1} onOpen={onClose} />
            ))
          )}
        </ScrollView>
        <Pressable
          onPress={() => {
            onClose();
            router.push('/settings');
          }}
          style={({ pressed }) => [styles.foot, { borderColor: theme.border }, pressed && { backgroundColor: theme.surface2 }]}>
          <Icon name="settings" size={14} color="muted" />
          <AppText variant="caption" weight="500" color="muted">
            Nhận thông báo trên điện thoại, giờ nhắc học
          </AppText>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  panel: { position: 'absolute', left: 12, right: 12, borderWidth: 1, borderRadius: 16, overflow: 'hidden' },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  empty: { paddingHorizontal: 20, paddingVertical: 32, lineHeight: 24 },
  foot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
});
