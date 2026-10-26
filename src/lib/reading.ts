import useSWR, { mutate } from 'swr';

import { api } from './api';

/** Bài đọc AI theo bài học — chép `lib/reading.ts` của web (xem `hanni-server/CLAUDE.md` mục "Bài đọc AI theo bài học"). */

export interface ReadingSentence {
  speaker: 'A' | 'B' | null;
  zh: string;
  pinyin: string;
  vi: string;
}

export interface ReadingWord {
  id: string;
  simplified: string;
  pinyin: string;
  hanViet: string | null;
  meaningVi: string | null;
  audioUrl: string | null;
}

export interface LessonReadingData {
  lesson: { id: string; title: string; hskLevel: number; orderIndex: number };
  words: ReadingWord[];
  reading: { title: string; sentences: ReadingSentence[]; createdAt: string; wordsUsed: string[] } | null;
  enabled: boolean;
}

const key = (lessonId: string) => `/ai/reading/${lessonId}`;

export function useLessonReading(lessonId: string | null) {
  return useSWR<LessonReadingData>(lessonId ? key(lessonId) : null, { revalidateOnFocus: false });
}

/** AI viết bài đọc (1 lượt AI, lần sau ai mở cũng có sẵn). */
export async function createLessonReading(lessonId: string) {
  const data = await api.post<LessonReadingData>(key(lessonId));
  await mutate(key(lessonId), data, { revalidate: false });
  return data;
}

/** Tách câu thành đoạn: từ của bài (bấm được) và chữ còn lại — khớp dài nhất trước. */
export function splitByWords(zh: string, words: ReadingWord[]) {
  const forms = words
    .map((w) => ({ w, form: w.simplified.replace(/[（(][^）)]*[）)]/g, '') }))
    .filter((x) => x.form)
    .sort((a, b) => b.form.length - a.form.length);
  const out: { text: string; word?: ReadingWord }[] = [];
  let i = 0;
  while (i < zh.length) {
    const hit = forms.find((x) => zh.startsWith(x.form, i));
    if (hit) {
      out.push({ text: hit.form, word: hit.w });
      i += hit.form.length;
    } else {
      const last = out[out.length - 1];
      if (last && !last.word) last.text += zh[i];
      else out.push({ text: zh[i] });
      i += 1;
    }
  }
  return out;
}
