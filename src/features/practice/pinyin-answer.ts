/** Chấm pinyin gõ lại khi luyện nghe — chép từ `lib/pinyin-answer.ts` của hanni-client. */

/** Kết quả chấm câu trả lời luyện nghe: đúng / đúng âm nhưng thiếu-sai thanh / sai. */
export type ListenVerdict = 'right' | 'tones' | 'wrong';

const MARKS: Record<string, [string, number]> = {
  ā: ['a', 1], á: ['a', 2], ǎ: ['a', 3], à: ['a', 4],
  ē: ['e', 1], é: ['e', 2], ě: ['e', 3], è: ['e', 4],
  ī: ['i', 1], í: ['i', 2], ǐ: ['i', 3], ì: ['i', 4],
  ō: ['o', 1], ó: ['o', 2], ǒ: ['o', 3], ò: ['o', 4],
  ū: ['u', 1], ú: ['u', 2], ǔ: ['u', 3], ù: ['u', 4],
  ǖ: ['v', 1], ǘ: ['v', 2], ǚ: ['v', 3], ǜ: ['v', 4],
  ń: ['n', 2], ň: ['n', 3], ǹ: ['n', 4], ḿ: ['m', 2],
};

/**
 * Thanh THỰC SỰ đọc ra sau biến điệu: 3-3 → 2-3, 不 trước thanh 4 → thanh 2,
 * 一 trước thanh 4 → 2, trước thanh khác → 4 (chép `surfaceTones` ở `lib/pitch.ts` của web).
 */
function surfaceTones(hanzi: string, pinyinNumeric: string): number[] {
  const syl = pinyinNumeric.toLowerCase().split(/\s+/).filter(Boolean);
  const tones = syl.map((s) => Number(/[1-5]$/.exec(s)?.[0] ?? 5));
  const chars = Array.from(hanzi).filter((c) => /\p{Script=Han}/u.test(c));
  for (let i = tones.length - 2; i >= 0; i--) {
    if (tones[i] === 3 && tones[i + 1] === 3) tones[i] = 2;
  }
  if (chars.length === tones.length) {
    for (let i = 0; i < tones.length - 1; i++) {
      const next = tones[i + 1];
      if (chars[i] === '不' && next === 4) tones[i] = 2;
      if (chars[i] === '一' && next !== 5) tones[i] = next === 4 ? 2 : 4;
    }
  }
  return tones;
}

/** Chữ cái pinyin (ü viết v) + thanh kèm VỊ TRÍ trong chuỗi chữ cái — để biết thanh thuộc âm tiết nào. */
function parse(input: string): { letters: string; tones: { at: number; tone: number }[] } | null {
  const s = input.normalize('NFC').toLowerCase().replace(/u:/g, 'v').replace(/ü/g, 'v');
  let letters = '';
  const tones: { at: number; tone: number }[] = [];
  for (const ch of s) {
    if (/[a-z]/.test(ch)) letters += ch;
    else if (MARKS[ch]) {
      tones.push({ at: letters.length, tone: MARKS[ch][1] });
      letters += MARKS[ch][0];
    } else if (/[1-4]/.test(ch)) {
      // Số thanh đứng SAU âm tiết: thuộc chữ cái liền trước.
      if (letters) tones.push({ at: letters.length - 1, tone: Number(ch) });
    } else if (!/[05\s'’·-]/.test(ch)) return null;
  }
  return letters ? { letters, tones } : null;
}

/**
 * Chấm pinyin gõ lại khi luyện nghe (người học chưa cài bàn phím tiếng Trung — như Hanbeego có dạng
 * 'Nghe gõ pinyin'). Nhận dấu thanh (xué shēng) hoặc số (xue2sheng1); âm tiết thanh nhẹ không bắt gõ thanh;
 * nhận cả thanh đã biến điệu (你好 → ní hǎo, 不是 → bú shì) vì người học gõ đúng cái tai nghe thấy.
 */
export function checkPinyin(input: string, hanzi: string, pinyinNumeric: string, pinyin?: string): ListenVerdict {
  const verdict = check(input, hanzi, pinyinNumeric);
  // Vài từ đã sửa pinyin HIỂN THỊ mà giữ khoá `pinyinNumeric` cũ (好处 'hǎo chu' ↔ 'hao3 chu3') — gõ đúng
  // như trang hiện thì vẫn phải nhận.
  if (verdict === 'right' || !pinyin) return verdict;
  const shown = check(input, hanzi, toNumeric(pinyin));
  return shown === 'right' || verdict === 'wrong' ? shown : verdict;
}

/** 'hǎo chu' → 'hao3 chu5' (âm tiết không dấu là thanh nhẹ). */
function toNumeric(pinyin: string): string {
  return pinyin
    .split(/\s+/)
    .filter(Boolean)
    .map((syl) => {
      const p = parse(syl);
      return p ? `${p.letters}${p.tones[0]?.tone ?? 5}` : syl;
    })
    .join(' ');
}

function check(input: string, hanzi: string, pinyinNumeric: string): ListenVerdict {
  const got = parse(input);
  if (!got) return 'wrong';
  const syllables = pinyinNumeric.toLowerCase().replace(/ü/g, 'v').split(/\s+/).filter(Boolean);
  const surface = surfaceTones(hanzi, pinyinNumeric);
  const expected: { letters: string; tone: number; surface: number }[] = [];
  syllables.forEach((s, i) => {
    const letters = s.replace(/[0-9]/g, '');
    const tone = Number(/[1-5]$/.exec(s)?.[0] ?? 5);
    // 儿 hoá (哪儿 'na3 r5'): 'r' gõ liền âm trước ('nar3') nên tính chung 1 âm tiết.
    if (letters === 'r' && tone === 5 && expected.length) expected[expected.length - 1].letters += 'r';
    else expected.push({ letters, tone, surface: surface[i] });
  });
  if (got.letters !== expected.map((e) => e.letters).join('')) return 'wrong';
  let start = 0;
  for (const e of expected) {
    const end = start + e.letters.length;
    const typed = got.tones.filter((t) => t.at >= start && t.at < end).map((t) => t.tone);
    start = end;
    if (e.tone === 5) continue;
    if (typed.length !== 1 || (typed[0] !== e.tone && typed[0] !== e.surface)) return 'tones';
  }
  return 'right';
}
