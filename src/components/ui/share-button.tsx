import { Pressable, Share, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { alpha } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { Icon } from './icon';
import { AppText } from './text';

/** `ShareButton` của web: viên thuốc đỏ nhạt "Chia sẻ", mở hộp chia sẻ của hệ điều hành. `compact` = cỡ nhỏ trong thẻ huy hiệu. */
export function ShareButton({
  message,
  compact,
  style,
}: {
  message: string;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={() => void Share.share({ message })}
      style={({ pressed }) => [
        styles.pill,
        compact && styles.compact,
        { backgroundColor: alpha(theme.primary, pressed ? 0.15 : 0.1) },
        style,
      ]}>
      <Icon name="share" size={13} color="primary" />
      <AppText variant="caption" weight="600" color="primary">
        Chia sẻ
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  compact: { alignSelf: 'center', paddingHorizontal: 10, paddingVertical: 4 },
});
