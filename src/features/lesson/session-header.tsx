import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Icon, ProgressBar } from '@/components/ui';
import { alpha } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Đầu màn học/kiểm tra (`header` của phiên học web): nút thoát 40px + thanh tiến độ + 1 dòng đang ở đâu. */
export function SessionHeader({
  progress,
  caption,
  onClose,
}: {
  progress: number;
  caption: string;
  onClose: () => void;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.header, { borderColor: theme.border, backgroundColor: alpha(theme.surface, 0.95) }]}>
      <Pressable
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Thoát bài học"
        style={({ pressed }) => [styles.close, pressed && { backgroundColor: theme.surface2 }]}>
        <Icon name="close" size={20} color="muted" />
      </Pressable>
      <View style={styles.fill}>
        <ProgressBar value={progress} />
        <AppText variant="caption" color="muted" numberOfLines={1} style={styles.caption}>
          {caption}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  close: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  fill: { flex: 1, minWidth: 0 },
  caption: { marginTop: 4 },
});
