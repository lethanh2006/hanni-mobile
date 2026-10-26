import { Pressable, StyleSheet } from 'react-native';

import { alpha } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { playWord } from '@/lib/audio';

import { Icon } from './icon';

/**
 * Nút nghe phát âm `AudioButton` của web: tròn 32px, biểu tượng loa xám, bấm thì đỏ.
 * `big` cho câu hỏi nghe (nút tròn to nền đỏ nhạt). Không có bản thu thì không hiện gì.
 */
export function AudioButton({
  src,
  big = false,
  tint = false,
  size = 18,
}: {
  src: string | null | undefined;
  big?: boolean;
  /** Nền đỏ nhạt + loa đỏ (`bg-primary/6 text-primary` — nút loa ở danh sách từ của bài). */
  tint?: boolean;
  size?: number;
}) {
  const theme = useTheme();
  if (!src) return null;
  return (
    <Pressable
      onPress={() => playWord(src)}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel="Nghe phát âm"
      style={({ pressed }) => [
        big ? styles.big : styles.small,
        big && { backgroundColor: alpha(theme.primary, 0.1), borderColor: alpha(theme.primary, 0.2) },
        tint && { backgroundColor: alpha(theme.primary, 0.06) },
        !big && pressed && { backgroundColor: tint ? alpha(theme.primary, 0.12) : theme.surface2 },
        pressed && big && { transform: [{ scale: 0.96 }] },
      ]}>
      {({ pressed }) => (
        <Icon name="sound" size={big ? 36 : size} color={big || tint || pressed ? 'primary' : 'muted'} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  small: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  big: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
