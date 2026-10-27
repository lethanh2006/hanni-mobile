import type { Word } from '@/lib/types';

import type { Glyph } from './glyph-panel';

/** Phản hồi `GET /dictionary/:từ` — giống `LookupResult` ở trang từ của web. */
export interface RelatedWord {
  simplified: string;
  pinyin: string;
  meaningVi: string | null;
  hanViet?: string | null;
}

export interface CharBreakdown {
  char: string;
  hanViet: string | null;
  pinyin: string | null;
  meaningVi: string | null;
}

export interface Measure {
  char: string;
  pinyin: string;
  hanViet: string | null;
  inDictionary: boolean;
}

/** Video có câu thoại chứa từ này. */
export interface VideoUsage {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  hskLevel: number | null;
  lineCount: number;
}

export interface Topic {
  id: string;
  title: string;
  hskLevel: number;
  orderIndex: number;
}

/** Mọi trường tuỳ chọn: server thêm trường mới thì app cũ vẫn đọc được. */
export interface LookupResult {
  words?: Word[];
  related?: RelatedWord[];
  characters?: CharBreakdown[];
  compounds?: RelatedWord[];
  measures?: Measure[];
  topic?: Topic | null;
  glyphs?: Glyph[];
  videos?: VideoUsage[];
}

/** 4 kiểu tra như hàng tab dưới ô tra của web (`DICT_TABS` ở `lib/dictionary.ts`). */
export type DictTab = 'tu-vung' | 'han-tu' | 'vi-du' | 'ngu-phap';

export const DICT_TABS: { key: DictTab; label: string; placeholder: string }[] = [
  { key: 'tu-vung', label: 'Từ vựng', placeholder: '你好, nihao, học sinh…' },
  { key: 'han-tu', label: 'Hán tự', placeholder: 'Chữ Hán: 学, 爱, 汉…' },
  { key: 'vi-du', label: 'Ví dụ', placeholder: 'Câu có 学习, “đi học”…' },
  { key: 'ngu-phap', label: 'Ngữ pháp', placeholder: '把, 了, so sánh…' },
];

/** `GET /dictionary/char/:c` — tab Hán tự. */
export interface CharInfo {
  char: string;
  strokes: number | null;
  radical: { number: number; char: string; nameVi: string } | null;
  hanViet: string | null;
  pinyin: string | null;
  meaningVi: string | null;
  hskLevel: number | null;
  wordSlug: string | null;
  words: { simplified: string; pinyin: string; hanViet: string | null; meaningVi: string | null; hskLevel: number }[];
}

/** `GET /dictionary/examples` — tab Ví dụ. */
export interface ExampleHit {
  id: string;
  zh: string;
  pinyin: string | null;
  vi: string | null;
  word: { simplified: string; pinyin: string; hanViet: string | null; hskLevel: number };
}

/** `GET /ai/segment` — tách câu theo từ điển (không gọi AI). */
export interface SegToken {
  text: string;
  simplified: string | null;
  pinyin: string | null;
  hanViet: string | null;
  meaningVi: string | null;
}

/** `GET /grammar/search` — tab Ngữ pháp. */
export interface GrammarHit {
  slug: string;
  hskLevel: number;
  titleVi: string;
  titleZh: string;
  summaryVi: string;
}
