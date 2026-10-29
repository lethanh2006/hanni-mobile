import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import * as Speech from 'expo-speech';

import { mediaUrl } from './api';

/** Một máy phát dùng chung cả app: phát từ mới thì dừng bản đang phát dở, không bị chồng tiếng. */
let player: AudioPlayer | null = null;
/** Lắng nghe "phát xong" của lần phát có theo dõi (`playClip`). */
let endListener: { remove(): void } | null = null;

function clearEnd() {
  endListener?.remove();
  endListener = null;
}

/** Phát bản thu phát âm của từ (đường dẫn `/media/audio/...` của server). */
export function playWord(src: string | null | undefined, onError?: () => void) {
  const url = mediaUrl(src);
  if (!url) return;
  Speech.stop();
  clearEnd();
  player?.remove();
  player = createAudioPlayer(url);
  if (onError) {
    const current = player;
    endListener = current.addListener('playbackStatusUpdate', (status) => {
      if (status.error && player === current) { clearEnd(); onError(); }
      else if (status.didJustFinish) clearEnd();
    });
  }
  player.setPlaybackRate(1);
  player.play();
}

/** Phát tệp ghi âm trên máy (giọng người học vừa thu — `file://` hoặc `blob:` trên web). */
export function playRecording(uri: string, onError?: () => void) {
  Speech.stop();
  clearEnd();
  player?.remove();
  player = createAudioPlayer(uri);
  if (onError) {
    const current = player;
    endListener = current.addListener('playbackStatusUpdate', (status) => {
      if (status.error && player === current) { clearEnd(); onError(); }
      else if (status.didJustFinish) clearEnd();
    });
  }
  player.setPlaybackRate(1);
  player.play();
}

/**
 * Phát 1 từ ở tốc độ `rate` (luyện nghe 0.75×/1×/1.25×) và báo khi phát xong: có bản thu thì phát bản thu,
 * không thì đọc bằng giọng tiếng Trung của máy. Trả về nguồn đã dùng.
 */
export function playClip(
  src: string | null | undefined,
  text: string,
  rate: number,
  onEnd: () => void,
): 'recording' | 'synthetic' {
  clearEnd();
  const url = mediaUrl(src);
  Speech.stop();
  if (url) {
    player?.remove();
    player = createAudioPlayer(url);
    player.setPlaybackRate(rate);
    endListener = player.addListener('playbackStatusUpdate', (status) => {
      if (!status.didJustFinish && !status.error) return;
      clearEnd();
      onEnd();
    });
    player.play();
    return 'recording';
  }
  player?.pause();
  Speech.speak(text, { language: 'zh-CN', rate: 0.9 * rate, onDone: onEnd, onStopped: onEnd, onError: onEnd });
  return 'synthetic';
}

/** Dừng mọi âm thanh đang phát (bản thu lẫn giọng máy). */
export function stopAudio() {
  clearEnd();
  player?.pause();
  Speech.stop();
}

/** Đọc chữ Hán bằng giọng tiếng Trung của máy — dùng khi không có bản thu. */
export function speakChinese(text: string) {
  clearEnd();
  player?.pause();
  Speech.stop();
  Speech.speak(text, { language: 'zh-CN', rate: 0.9 });
}
