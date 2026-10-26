import Storage from 'expo-sqlite/kv-store';

import type { MockAnswer } from '@/lib/types';

/** Bài làm dở lưu trên máy — thoát ra rồi quay lại vẫn làm tiếp được (trong thời gian làm bài). */
export interface SavedExam {
  answers: (MockAnswer | null)[];
  /** Số các câu đánh dấu xem lại (bản lưu cũ chưa có). */
  flags?: number[];
  startedAt: number;
}

const key = (slug: string) => `hanni:mock-exam:${slug}`;

export function readSaved(slug: string, durationMin: number): SavedExam | null {
  try {
    const saved = JSON.parse(Storage.getItemSync(key(slug)) ?? 'null') as SavedExam | null;
    // Quá giờ làm bài thì bài dở đó coi như bỏ.
    if (!saved || Date.now() - saved.startedAt > durationMin * 60_000) return null;
    return saved;
  } catch {
    return null;
  }
}

export function writeSaved(slug: string, saved: SavedExam) {
  Storage.setItemSync(key(slug), JSON.stringify(saved));
}

export function clearSaved(slug: string) {
  Storage.removeItemSync(key(slug));
}
