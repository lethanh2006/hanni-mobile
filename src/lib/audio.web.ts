import * as Speech from 'expo-speech';

import { mediaUrl } from './api';

// Dùng một HTMLAudioElement cho mỗi lượt: thay nguồn trên player của expo-audio
// có thể tự phát lại nguồn cũ; onended của SDK 58 cũng không báo didJustFinish.
let active: HTMLAudioElement | null = null;
let generation = 0;

function stopCurrent() {
  generation++;
  if (active) {
    active.onended = null;
    active.onerror = null;
    active.pause();
    active.removeAttribute('src');
    active.load();
    active = null;
  }
  void Speech.stop();
}

function playUri(uri: string, rate: number, onEnd?: () => void, onError?: () => void) {
  stopCurrent();
  const id = generation;
  const audio = new Audio(uri);
  active = audio;
  audio.playbackRate = rate;
  let finished = false;
  const complete = (failed: boolean) => {
    if (finished || active !== audio || id !== generation) return;
    finished = true;
    active = null;
    audio.onended = null;
    audio.onerror = null;
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
    if (failed) onError?.();
    onEnd?.();
  };
  audio.onended = () => complete(false);
  audio.onerror = () => complete(true);
  try {
    void audio.play().catch(() => complete(true));
  } catch {
    complete(true);
  }
}

export function playWord(src: string | null | undefined, onError?: () => void) {
  const uri = mediaUrl(src);
  if (uri) playUri(uri, 1, undefined, onError);
}

export function playRecording(uri: string, onError?: () => void) {
  playUri(uri, 1, undefined, onError);
}

export function playClip(src: string | null | undefined, text: string, rate: number, onEnd: () => void): 'recording' | 'synthetic' {
  const uri = mediaUrl(src);
  if (uri) {
    playUri(uri, rate, onEnd);
    return 'recording';
  }
  stopCurrent();
  const id = generation;
  const done = () => { if (id === generation) onEnd(); };
  Speech.speak(text, { language: 'zh-CN', rate: 0.9 * rate, onDone: done, onStopped: done, onError: done });
  return 'synthetic';
}

export function stopAudio() { stopCurrent(); }
export function speakChinese(text: string) {
  stopCurrent();
  Speech.speak(text, { language: 'zh-CN', rate: 0.9 });
}
