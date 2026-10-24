import * as Speech from 'expo-speech';

import { playWord } from '@/lib/audio';
import type { MockItem } from '@/lib/types';

/** Mỗi câu nghe đọc 2 lần như đề thật. */
const REPEAT = 2;

/** Nam/nữ/người hỏi đọc bằng cùng giọng máy nhưng khác cao độ để nghe ra 2 người. */
const PITCH = { M: 0.7, F: 1.1, N: 0.95 } as const;

let token = 0;

function speak(text: string, pitch: number): Promise<void> {
  return new Promise((resolve) => {
    Speech.speak(text, {
      language: 'zh-CN',
      pitch,
      rate: 0.9,
      onDone: () => resolve(),
      onStopped: () => resolve(),
      onError: () => resolve(),
    });
  });
}

/**
 * Phát phần nghe của 1 câu. Có ghi âm thật (`audio.url`) thì phát ghi âm; không thì đọc
 * lời thoại bằng giọng tiếng Trung của máy, 2 lần. `onRound` báo đang đọc lần mấy.
 */
export async function playListening(audio: NonNullable<MockItem['audio']>, onRound: (round: number) => void) {
  stopListening();
  const mine = ++token;
  if (audio.url) {
    onRound(1);
    playWord(audio.url);
    return;
  }
  for (let round = 1; round <= REPEAT; round++) {
    if (mine !== token) return;
    onRound(round);
    for (const line of audio.lines) {
      if (mine !== token) return;
      await speak(line.zh, PITCH[line.s]);
    }
  }
}

export function stopListening() {
  token += 1;
  Speech.stop();
}
