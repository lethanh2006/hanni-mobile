import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Icon, ProgressBar } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Đầu màn học/kiểm tra: nút thoát + thanh tiến độ + 1 dòng đang ở đâu. */
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
    <View style={[styles.header, { borderColor: theme.border }]}>
      <Pressable onPress={onClose} hitSlop={8} accessibilityRole="button" accessibilityLabel="Thoát">
        <Icon name="close" size={22} color="muted" />
      </Pressable>
      <View style={styles.fill}>
        <ProgressBar value={progress} />
        <AppText variant="caption" color="muted" numberOfLines={1}>
          {caption}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, gap: 4 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
});
