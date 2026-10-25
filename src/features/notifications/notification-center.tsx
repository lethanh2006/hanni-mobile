import { useEffect, useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';

import { AppText, Button, Icon } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
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
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <View style={[styles.flame, { backgroundColor: theme.dangerSoft }]}>
            <Icon name="flame" size={40} color="danger" />
          </View>
          <AppText variant="label" color="danger">
            {copy?.eyebrow}
          </AppText>
          <AppText variant="title" center>
            Chuỗi {milestone} ngày!
          </AppText>
          <AppText variant="small" color="muted" center>
            {copy?.body}
          </AppText>
          <Button title="Tiếp tục học" icon="arrow" onPress={() => setMilestone(null)} style={styles.button} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: Spacing.lg },
  card: { width: '100%', maxWidth: 360, borderRadius: Radius.lg, padding: Spacing.xl, alignItems: 'center', gap: Spacing.sm },
  flame: { width: 80, height: 80, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
  button: { alignSelf: 'stretch', marginTop: Spacing.md },
});
