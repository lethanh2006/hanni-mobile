import { Pressable, StyleSheet } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { playWord } from '@/lib/audio';

import { Icon } from './icon';

/** Nút phát bản thu phát âm của từ. Không có bản thu thì không hiện gì. `big` cho câu hỏi nghe. */
export function AudioButton({ src, big = false }: { src: string | null | undefined; big?: boolean }) {
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
        { backgroundColor: theme.primarySoft },
        pressed && styles.pressed,
      ]}>
      <Icon name="sound" size={big ? 36 : 18} color="primary" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  small: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  big: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.7 },
});
