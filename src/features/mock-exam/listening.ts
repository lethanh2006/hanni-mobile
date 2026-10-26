import * as Speech from 'expo-speech';

import { playWord } from '@/lib/audio';
import type { MockItem } from '@/lib/types';

/** Mỗi câu nghe đọc 2 lần như đề thật. */
const REPEAT = 2;

/** Nam/nữ/người hỏi đọc bằng cùng giọng máy nhưng khác cao độ để nghe ra 2 người. */
const PITCH = { M: 0.7, F: 1.1, N: 0.95 } as const;
/** Nghỉ giữa 2 câu thoại. */
const GAP_LINE_MS = 400;

let token = 0;

/** Máy có giọng đọc tiếng Trung không (phần nghe, bài đọc đọc bằng giọng máy). */
export async function hasChineseVoice() {
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    return voices.length === 0 || voices.some((v) => v.language.toLowerCase().startsWith('zh'));
  } catch {
    return true;
  }
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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

export type PlayResult = 'ended' | 'cancelled' | 'no-voice';

/**
 * Đọc lần lượt từng câu MỘT lần (bài đọc AI): A giọng nữ, B giọng nam, kể chuyện giọng thường. `onLine(i)` báo câu
 * đang đọc để tô sáng; `stopListening()` dừng giữa chừng.
 */
export async function speakSequence(
  lines: { zh: string; s: keyof typeof PITCH }[],
  onLine?: (index: number) => void,
): Promise<PlayResult> {
  stopListening();
  const mine = ++token;
  if (!(await hasChineseVoice())) return 'no-voice';
  for (const [i, line] of lines.entries()) {
    if (mine !== token) return 'cancelled';
    if (i > 0) await wait(GAP_LINE_MS);
    if (mine !== token) return 'cancelled';
    onLine?.(i);
    await speak(line.zh, PITCH[line.s]);
  }
  return mine === token ? 'ended' : 'cancelled';
}

export function stopListening() {
  token += 1;
  Speech.stop();
}
