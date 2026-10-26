import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { alpha } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { Button } from './button';
import { IconTile } from './card';
import { Icon, type IconName } from './icon';
import { AppText } from './text';

export interface TourStep {
  icon: IconName;
  title: string;
  description: string;
}

/**
 * Nút "Hướng dẫn" + popup từng bước (`TourButton` + `FeatureTour` của web): trên điện thoại chỉ là ô biểu tượng ⓘ
 * 40px cùng hàng tiêu đề trang; bấm mới mở (không tự bật).
 */
export function TourButton({ steps }: { steps: TourStep[] }) {
  const theme = useTheme();
  const [index, setIndex] = useState<number | null>(null);
  const step = index === null ? null : steps[index];
  const isLast = index === steps.length - 1;
  const close = () => setIndex(null);

  return (
    <>
      <Pressable
        onPress={() => setIndex(0)}
        accessibilityLabel="Hướng dẫn"
        style={({ pressed }) => [
          styles.button,
          { borderColor: pressed ? alpha(theme.primary, 0.4) : theme.border, backgroundColor: theme.surface },
        ]}>
        {({ pressed }) => <Icon name="info" size={16} color={pressed ? 'primary' : 'muted'} />}
      </Pressable>
      <Modal visible={step !== null} transparent animationType="fade" onRequestClose={close} statusBarTranslucent>
        <View style={styles.backdrop}>
          {step && (
            <View
              accessibilityViewIsModal
              style={[
                styles.dialog,
                { borderColor: theme.border, backgroundColor: theme.surface, boxShadow: `0 25px 50px -12px ${alpha('#000000', 0.25)}` },
              ]}>
              <Pressable onPress={close} accessibilityLabel="Bỏ qua hướng dẫn" style={styles.close}>
                <Icon name="close" size={16} color="muted" />
              </Pressable>
              <IconTile size={64} style={styles.tile}>
                <Icon name={step.icon} size={32} color="primary" />
              </IconTile>
              <AppText weight="700" center style={styles.title}>
                {step.title}
              </AppText>
              <AppText color="muted" center style={styles.desc}>
                {step.description}
              </AppText>
              <View style={styles.dots}>
                {steps.map((_, i) => (
                  <View
                    key={i}
                    style={[styles.dot, i === index ? { width: 20, backgroundColor: theme.primary } : { backgroundColor: theme.border }]}
                  />
                ))}
              </View>
              <View style={styles.actions}>
                <Button title="Bỏ qua" variant="ghost" onPress={close} />
                <Button
                  title={isLast ? 'Đã hiểu, bắt đầu thôi!' : 'Tiếp theo'}
                  icon="arrow"
                  onPress={() => (isLast ? close() : setIndex((i) => (i ?? 0) + 1))}
                />
              </View>
            </View>
          )}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: 'rgba(0,0,0,0.4)' },
  dialog: { width: '100%', maxWidth: 384, borderWidth: 1, borderRadius: 16, padding: 24 },
  close: { position: 'absolute', right: 12, top: 12, width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  tile: { alignSelf: 'center' },
  title: { marginTop: 16, fontSize: 16 },
  desc: { marginTop: 8, lineHeight: 24 },
  dots: { marginTop: 20, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { height: 6, width: 6, borderRadius: 3 },
  actions: { marginTop: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
});
