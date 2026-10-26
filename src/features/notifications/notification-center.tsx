import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { AppText, Button, Icon } from '@/components/ui';
import { alpha } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useNotificationSocket } from '@/lib/notifications';
import { onStreakMilestone } from '@/lib/streak-celebration';

/** Mỗi mốc 1 câu riêng — màn này HIẾM (mỗi mốc 1 lần trong đời tài khoản) nên nói đúng ý nghĩa của nó. */
const MILESTONE_COPY: Record<number, { eyebrow: string; body: string }> = {
  1: {
    eyebrow: 'Bước đầu tiên',
    body: 'Buổi học đầu tiên luôn khó bắt đầu nhất — bạn vừa làm được rồi. Quay lại ngày mai để bắt đầu một chuỗi ngày học thật.',
  },
  3: {
    eyebrow: 'Đang thành thói quen',
    body: '3 ngày liên tục không phải ngẫu nhiên — đó là một lựa chọn được lặp lại. Giữ nhịp này thêm vài hôm nữa để cán mốc 1 tuần.',
  },
  7: {
    eyebrow: 'Cột mốc quan trọng nhất',
    body: 'Một tuần không bỏ lỡ ngày nào — đây là lúc việc học thật sự bám rễ thành thói quen, khó bỏ hơn hẳn những ngày đầu. Cứ giữ nhịp này.',
  },
  30: {
    eyebrow: 'Một tháng tròn',
    body: '30 ngày liền không đứt quãng. Tiếng Trung đã thành một phần thói quen hằng ngày của bạn.',
  },
  100: {
    eyebrow: 'Rất ít người đi được tới đây',
    body: '100 ngày liên tục là một con số hiếm. Riêng sự đều đặn này đã là một thành tựu thật.',
  },
};

/**
 * Lắng nghe thông báo realtime (mở socket) và hiện màn ăn mừng khi vừa cán mốc chuỗi ngày.
 * Mount 1 lần ở layout gốc để bắt được sự kiện dù đang ở màn nào.
 */
export function NotificationCenter() {
  useNotificationSocket();
  const theme = useTheme();
  const [milestone, setMilestone] = useState<number | null>(null);
  useEffect(() => onStreakMilestone(setMilestone), []);

  const copy = milestone
    ? (MILESTONE_COPY[milestone] ?? { eyebrow: 'Cột mốc mới', body: 'Cứ giữ nhịp học đều đặn nhé.' })
    : null;

  return (
    <Modal visible={milestone !== null} transparent animationType="fade" onRequestClose={() => setMilestone(null)}>
      <View style={styles.backdrop}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              boxShadow: `0 25px 50px -12px ${alpha('#000000', 0.25)}`,
            },
          ]}>
          <Pressable
            onPress={() => setMilestone(null)}
            accessibilityLabel="Đóng"
            style={({ pressed }) => [styles.close, pressed && { backgroundColor: theme.surface2 }]}>
            <Icon name="close" size={16} color="muted" />
          </Pressable>
          <View style={[styles.flame, { backgroundColor: alpha(theme.danger, 0.1), borderColor: theme.border }]}>
            <Icon name="flame" size={40} color="danger" />
          </View>
          <AppText variant="caption" weight="700" color="danger" style={styles.eyebrow}>
            {copy?.eyebrow}
          </AppText>
          <AppText weight="800" center style={styles.title}>
            Chuỗi {milestone} ngày!
          </AppText>
          <AppText color="muted" center style={styles.body}>
            {copy?.body}
          </AppText>
          <Button title="Tiếp tục học" icon="arrow" onPress={() => setMilestone(null)} style={styles.button} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  card: { width: '100%', maxWidth: 384, borderWidth: 1, borderRadius: 16, padding: 28, alignItems: 'center' },
  close: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flame: { width: 80, height: 80, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { marginTop: 20, textTransform: 'uppercase', letterSpacing: 0.6 },
  title: { marginTop: 6, fontSize: 24, lineHeight: 32, letterSpacing: -0.6 },
  body: { marginTop: 12, lineHeight: 24 },
  button: { alignSelf: 'stretch', marginTop: 24 },
});
