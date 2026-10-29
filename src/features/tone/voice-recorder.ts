import { requestRecordingPermissionsAsync, setAudioModeAsync, useAudioStream } from 'expo-audio';
import { useRef } from 'react';

import { stopAudio } from '@/lib/audio';

import { pcm16ToFloat32 } from './pcm';

export interface VoiceRecording {
  /** Mẫu đơn kênh, `sr` Hz. */
  x: Float32Array;
  sr: number;
  /** Tệp ghi âm để nghe lại (WAV trong bộ nhớ đệm của app), `null` nếu không ghi được tệp. */
  uri: string | null;
}

/** `onLevel(rms, ms)`: độ to của đoạn vừa thu + số mili giây từ lúc bắt đầu — để vẽ thanh mức và tự dừng khi nói xong. */
export type LevelListener = (rms: number, ms: number) => void;

export class RecorderError extends Error {}

/**
 * Thu giọng từ micro cho chấm thanh điệu: lấy mẫu PCM trực tiếp (`useAudioStream` của expo-audio, xin 16 kHz) — khỏi
 * phải giải mã tệp như web — đồng thời ghi tệp WAV PCM 16-bit để Android/iOS phát lại rộng rãi.
 */
export function useVoiceRecorder() {
  const chunks = useRef<Float32Array[]>([]);
  const rate = useRef(16000);
  const level = useRef<LevelListener | null>(null);
  const startedAt = useRef(0);
  const { stream } = useAudioStream({
    sampleRate: 16000,
    channels: 1,
    encoding: 'int16',
    onBuffer: (b) => {
      if (!level.current) return;
      const x = pcm16ToFloat32(b.data);
      chunks.current.push(x);
      rate.current = b.sampleRate;
      let e = 0;
      for (let i = 0; i < x.length; i++) e += x[i] * x[i];
      level.current(Math.sqrt(e / Math.max(1, x.length)), Date.now() - startedAt.current);
    },
  });

  async function start(onLevel: LevelListener) {
    const perm = await requestRecordingPermissionsAsync().catch(() => null);
    if (!perm?.granted) throw new RecorderError('Chưa có quyền dùng micro — cho phép micro cho Hanni trong Cài đặt rồi thử lại.');
    stopAudio();
    try {
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true, shouldRouteThroughEarpiece: false });
      chunks.current = [];
      startedAt.current = Date.now();
      level.current = onLevel;
      await stream.start();
    } catch {
      level.current = null;
      try { stream.stop(); } catch { /* Stream có thể chưa khởi động. */ }
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true, shouldRouteThroughEarpiece: false }).catch(() => undefined);
      throw new RecorderError('Không mở được micro. Kiểm tra thiết bị rồi thử lại.');
    }
    // Tệp để nghe lại — không có thì vẫn chấm được.
    await stream.startFileRecordingAsync({ format: 'wav' }).catch(() => undefined);
  }

  async function stop(): Promise<VoiceRecording | null> {
    if (!level.current) return null;
    level.current = null;
    const file = await stream.stopFileRecordingAsync().catch(() => null);
    stream.stop();
    // Trả phiên âm thanh về chế độ phát (iOS: đang ghi thì tiếng phát ra loa trong).
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true, shouldRouteThroughEarpiece: false });
    const total = chunks.current.reduce((n, c) => n + c.length, 0);
    if (!total) return null;
    const x = new Float32Array(total);
    let at = 0;
    for (const c of chunks.current) {
      x.set(c, at);
      at += c.length;
    }
    chunks.current = [];
    return { x, sr: rate.current, uri: file?.uri ?? null };
  }

  /** Huỷ khi rời màn giữa chừng. */
  function cancel() {
    if (!level.current) return;
    level.current = null;
    void stream.stopFileRecordingAsync().catch(() => undefined);
    stream.stop();
    void setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true, shouldRouteThroughEarpiece: false }).catch(() => undefined);
  }

  return { start, stop, cancel };
}
