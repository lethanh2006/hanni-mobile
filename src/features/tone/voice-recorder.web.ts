import { useRef } from 'react';

import { stopAudio } from '@/lib/audio';

import { decodeAudioData } from './decode-audio.web';

export interface VoiceRecording {
  x: Float32Array;
  sr: number;
  uri: string | null;
}

export type LevelListener = (rms: number, ms: number) => void;

export class RecorderError extends Error {}

/** Bản web (chạy app trên trình duyệt): ghi bằng MediaRecorder, đo độ to bằng AnalyserNode rồi giải mã — y như web Hanni. */
export function useVoiceRecorder() {
  const session = useRef<{ stop: () => Promise<VoiceRecording | null>; cancel: () => void } | null>(null);

  async function start(onLevel: LevelListener) {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined')
      throw new RecorderError('Trình duyệt này chưa ghi âm được — thử Chrome, Edge hoặc Safari mới.');
    stopAudio();
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
    } catch (cause) {
      throw new RecorderError(
        cause instanceof DOMException && cause.name === 'NotAllowedError'
          ? 'Chưa có quyền dùng micro — cho phép micro cho trang này rồi thử lại.'
          : 'Không mở được micro. Kiểm tra thiết bị rồi thử lại.',
      );
    }
    const mimeType = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg;codecs=opus'].find((t) => MediaRecorder.isTypeSupported(t));
    const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => {
      if (e.data.size) chunks.push(e.data);
    };
    const ctx = new AudioContext();
    const an = ctx.createAnalyser();
    an.fftSize = 1024;
    ctx.createMediaStreamSource(stream).connect(an);
    const buf = new Float32Array(an.fftSize);
    const t0 = performance.now();
    let raf = 0;
    const loop = () => {
      an.getFloatTimeDomainData(buf);
      let e = 0;
      for (let i = 0; i < buf.length; i++) e += buf[i] * buf[i];
      onLevel(Math.sqrt(e / buf.length), performance.now() - t0);
      raf = requestAnimationFrame(loop);
    };
    const release = () => {
      cancelAnimationFrame(raf);
      stream.getTracks().forEach((t) => t.stop());
      void ctx.close().catch(() => undefined);
    };
    session.current = {
      stop: () =>
        new Promise((resolve) => {
          rec.onstop = () => {
            release();
            const blob = new Blob(chunks, { type: rec.mimeType });
            if (!blob.size) return resolve(null);
            blob
              .arrayBuffer()
              .then(decodeAudioData)
              .then(({ x, sr }) => resolve({ x, sr, uri: URL.createObjectURL(blob) }))
              .catch(() => resolve(null));
          };
          if (rec.state !== 'inactive') rec.stop();
          else rec.onstop?.(new Event('stop'));
        }),
      cancel: () => {
        rec.onstop = null;
        if (rec.state !== 'inactive') rec.stop();
        release();
      },
    };
    rec.start();
    raf = requestAnimationFrame(loop);
  }

  async function stop() {
    const s = session.current;
    session.current = null;
    return s ? s.stop() : null;
  }

  function cancel() {
    session.current?.cancel();
    session.current = null;
  }

  return { start, stop, cancel };
}
