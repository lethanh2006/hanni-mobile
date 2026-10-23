import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import * as Speech from 'expo-speech';

import { mediaUrl } from './api';

/** Một máy phát dùng chung cả app: phát từ mới thì dừng bản đang phát dở, không bị chồng tiếng. */
let player: AudioPlayer | null = null;

/** Phát bản thu phát âm của từ (đường dẫn `/media/audio/...` của server). */
export function playWord(src: string | null | undefined) {
  const url = mediaUrl(src);
  if (!url) return;
  Speech.stop();
  if (!player) player = createAudioPlayer(url);
  else player.replace(url);
  player.play();
}

/** Đọc chữ Hán bằng giọng tiếng Trung của máy — dùng khi không có bản thu. */
export function speakChinese(text: string) {
  player?.pause();
  Speech.stop();
  Speech.speak(text, { language: 'zh-CN', rate: 0.9 });
}
