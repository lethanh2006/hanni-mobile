import type { Word } from '@/lib/types';

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
}
