import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Pressable, StyleSheet } from 'react-native';

import { mediaUrl } from '@/lib/api';

import { Icon } from './icon';

/** Nút phát bản thu phát âm của từ. Không có bản thu thì không hiện gì. */
export function AudioButton({ src, size = 20 }: { src: string | null | undefined; size?: number }) {
  const url = mediaUrl(src);
  if (!url) return null;
  return <Player url={url} size={size} />;
}

function Player({ url, size }: { url: string; size: number }) {
  const player = useAudioPlayer(url);
  const { playing } = useAudioPlayerStatus(player);

  function play() {
    void player.seekTo(0);
    player.play();
  }

  return (
    <Pressable
      onPress={play}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel="Nghe phát âm"
      style={styles.button}>
      <Icon name="sound" size={size} color={playing ? 'primary' : 'muted'} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { padding: 6 },
});
