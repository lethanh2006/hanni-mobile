/** Cấp có từ vựng — dữ liệu gộp HSK 7–9 thành cấp 7. */
export const HSK_LEVELS = [1, 2, 3, 4, 5, 6, 7] as const;

export const hskLabel = (level: number) => `HSK ${level >= 7 ? '7–9' : level}`;

/** Bậc HSK theo cấp: 1–3 Sơ cấp, 4–6 Trung cấp, 7–9 Cao cấp. */
export function hskBand(level: number) {
  if (level <= 3) return { label: 'Sơ cấp', color: 'good' } as const;
  if (level <= 6) return { label: 'Trung cấp', color: 'warn' } as const;
  return { label: 'Cao cấp', color: 'lavender' } as const;
}

/** Nhãn tiếng Việt cho từ loại (enum `WordPos` của server). */
export const POS_VI: Record<string, string> = {
  NOUN: 'Danh từ',
  VERB: 'Động từ',
  ADJECTIVE: 'Tính từ',
  ADVERB: 'Phó từ',
  PRONOUN: 'Đại từ',
  NUMERAL: 'Số từ',
  MEASURE: 'Lượng từ',
  CONJUNCTION: 'Liên từ',
  PREPOSITION: 'Giới từ',
  PARTICLE: 'Trợ từ',
  INTERJECTION: 'Thán từ',
  IDIOM: 'Thành ngữ',
  PHRASE: 'Cụm từ',
  OTHER: 'Khác',
};
