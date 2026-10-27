export interface DecodedAudio {
  x: Float32Array;
  sr: number;
}

function context(): OfflineAudioContext {
  try {
    return new OfflineAudioContext(1, 1, 16000);
  } catch {
    // Safari cũ chỉ nhận 22.050–96.000 Hz.
    return new OfflineAudioContext(1, 1, 22050);
  }
}

/** Giải mã MP3/WebM/MP4 → mẫu đơn kênh (`decodeAudio` của web). */
export async function decodeAudioData(data: ArrayBuffer): Promise<DecodedAudio> {
  const buf = await context().decodeAudioData(data);
  const x = new Float32Array(buf.length);
  for (let c = 0; c < buf.numberOfChannels; c++) {
    const ch = buf.getChannelData(c);
    for (let i = 0; i < ch.length; i++) x[i] += ch[i] / buf.numberOfChannels;
  }
  return { x, sr: buf.sampleRate };
}

/**
 * Bản web (chạy app trên trình duyệt): giải mã thẳng như web Hanni. Khi dev ở localhost, file audio đi qua proxy
 * `/media` của Metro (server chỉ cho trang Hanni tải audio — CORS).
 */
export async function decodeAudioUrl(url: string): Promise<DecodedAudio> {
  const target = __DEV__ ? url.replace(/^https?:\/\/[^/]+\/media\//, '/media/') : url;
  const res = await fetch(target);
  if (!res.ok) throw new Error(String(res.status));
  return decodeAudioData(await res.arrayBuffer());
}

export function AudioDecoderHost() {
  return null;
}
