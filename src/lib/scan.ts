import { Platform } from 'react-native';
import useSWR from 'swr';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

import { api, fetcher } from './api';
import type { ScanResult, ScanUsage } from './types';

export function useScanUsage(enabled: boolean) {
  return useSWR<ScanUsage>(enabled ? '/scan/usage' : null, (p: string) => fetcher<ScanUsage>(p));
}

/** Thu ảnh về cạnh dài ≤ 1600px JPEG trước khi gửi: ảnh điện thoại 4–12MB
 * còn vài trăm KB, gửi nhanh trên 4G mà chữ vẫn đủ nét để đọc. */
export async function prepareImage(uri: string, width?: number, height?: number): Promise<string> {
  const MAX = 1600;
  try {
    const w = width ?? 0;
    const h = height ?? 0;
    const maxDim = Math.max(w, h);
    const actions = [];
    if (maxDim > MAX && w > 0 && h > 0) {
      const scale = MAX / maxDim;
      actions.push({ resize: { width: Math.round(w * scale) } });
    }
    const result = await manipulateAsync(
      uri,
      actions,
      { compress: 0.85, format: SaveFormat.JPEG },
    );
    return result.uri;
  } catch {
    return uri;
  }
}

export async function scanImage(imageUri: string): Promise<ScanResult> {
  const form = new FormData();
  if (Platform.OS === 'web') {
    const resp = await fetch(imageUri);
    const blob = await resp.blob();
    form.append('image', blob, 'scan.jpg');
  } else {
    form.append('image', {
      uri: imageUri,
      name: 'scan.jpg',
      type: 'image/jpeg',
    } as unknown as Blob);
  }
  return api.upload<ScanResult>('/scan', form);
}

export function assistantText(r: ScanResult) {
  const parts = [
    r.lines.length && `Chữ trong ảnh:\n${r.lines.map((l) => `${l.zh} — ${l.vi}`).join('\n')}`,
    r.objects.length && `Trong ảnh có: ${r.objects.map((o) => `${o.zh} (${o.vi})`).join(', ')}`,
  ].filter(Boolean);
  return `Mình vừa quét một ảnh (${r.kind}).\n${parts.join('\n')}\n${
    r.lines.length
      ? 'Giải thích giúp mình các từ và cấu trúc đáng chú ý trong đó nhé.'
      : 'Đặt giúp mình vài câu tiếng Trung đơn giản (kèm pinyin, nghĩa) dùng các từ này nhé.'
  }`;
}

/** Đoạn ngoài từ điển như "個) 100": pinyin (mỗi chữ Hán 1 âm tiết) chỉ đặt lên phần chữ Hán, số và dấu câu
 * để trơn — không thì "gè" phủ lên cả cụm. */
export function splitPlain(text: string, pinyin: string | null): { text: string; pinyin: string | null }[] {
  if (!pinyin) return [{ text, pinyin: null }];
  const syllables = pinyin.split(/\s+/);
  let k = 0;
  return text
    .split(/(\p{Script=Han}+)/u)
    .filter(Boolean)
    .map((part) => {
      if (!/\p{Script=Han}/u.test(part)) return { text: part, pinyin: null };
      const n = Array.from(part).length;
      const out = { text: part, pinyin: syllables.slice(k, k + n).join(' ') || null };
      k += n;
      return out;
    });
}

