import type { MockAnswer, MockItem, MockPaper, MockPart, MockPartType, MockReviewItem, MockSectionKind } from '@/lib/types';

import { normalizeSentence, officialIndexes } from './labels';

export const SECTION_SHORT: Record<MockSectionKind, string> = { listening: 'Nghe', reading: 'Đọc', writing: 'Viết' };

/** Tên ngắn + mẹo của từng dạng câu (theo phần thi) — chép `PART_INFO` ở `lib/mock-exam.ts` của web. */
const PART_INFO: Record<string, { label: string; tip: string }> = {
  'listening:judge': { label: 'Nghe, đối chiếu tranh', tip: 'Nghe cho ra từ khoá (đồ vật, hành động) rồi mới so với tranh — đừng chọn theo âm nghe na ná.' },
  'listening:choose-picture': { label: 'Nghe câu, chọn tranh', tip: 'Trước khi nghe, nhìn 3 tranh và nghĩ sẵn từ tiếng Trung của từng tranh.' },
  'listening:match-picture': { label: 'Nghe hội thoại, ghép tranh', tip: 'Từ khoá hay nằm ở câu đáp của người thứ hai — nghe hết rồi mới chọn, loại dần tranh đã dùng.' },
  'listening:choose-text': { label: 'Nghe câu hỏi, chọn đáp án', tip: 'Đọc trước 3 đáp án để biết cần nghe số, giờ, nơi chốn hay người.' },
  'listening:judge-text': { label: 'Nghe đoạn văn, xét câu ★', tip: 'Đọc câu ★ TRƯỚC khi nghe để biết cần bắt chi tiết nào — câu ★ hay chỉ đổi đúng 1 chi tiết.' },
  'reading:judge': { label: 'Đọc từ, đối chiếu tranh', tip: 'Sai phần này thường do chưa thuộc mặt chữ — ôn lại từ vựng, nhớ nghĩa qua âm Hán Việt.' },
  'reading:match-picture': { label: 'Đọc câu, ghép tranh', tip: 'Tìm động từ/danh từ chính của câu rồi khớp với tranh, bỏ qua phần còn lại.' },
  'reading:match-text': { label: 'Ghép câu hỏi – câu trả lời', tip: 'Nhìn từ để hỏi: 几/多少 → số, 哪儿 → nơi chốn, 谁 → người, 什么时候 → thời gian.' },
  'reading:judge-text': { label: 'Đọc đoạn, xét câu ★', tip: 'Câu ★ thường chỉ khác đoạn văn ở 1 chi tiết (giờ, số, người, nơi chốn) — đối chiếu từng chi tiết.' },
  'reading:fill-blank': { label: 'Điền từ vào chỗ trống', tip: 'Xác định chỗ trống cần loại từ gì (danh từ, động từ, lượng từ) trước khi chọn.' },
  'reading:choose-text': { label: 'Đọc đoạn văn, trả lời câu hỏi', tip: 'Đọc câu hỏi ★ trước rồi mới tìm trong đoạn — đáp án đúng hay nói lại ý bằng từ khác.' },
  'reading:order': { label: 'Sắp xếp 3 câu thành đoạn văn', tip: 'Câu mở đầu thường nêu nhân vật và không bắt đầu bằng 但是, 所以, 然后, 结果.' },
  'writing:order': { label: 'Sắp xếp từ thành câu', tip: 'Tìm chủ ngữ + động từ chính trước; thời gian, nơi chốn đứng TRƯỚC động từ, bổ ngữ đứng SAU.' },
  'writing:write-sentence': { label: 'Nhìn tranh, dùng từ đặt câu', tip: 'Câu đơn giản mà đúng là đủ: chủ ngữ + (thời gian, nơi chốn) + động từ + tân ngữ.' },
  'writing:pinyin-char': { label: 'Viết chữ theo pinyin', tip: 'Nhớ chữ theo TỪ chứ đừng nhớ rời; âm Hán Việt giúp phân biệt: 出 xuất, 初 sơ, 除 trừ.' },
};

export function partInfo(section: MockSectionKind, type: MockPartType) {
  return PART_INFO[`${section}:${type}`] ?? { label: SECTION_SHORT[section], tip: '' };
}

const CTA_LISTEN = { label: 'Luyện nghe', href: '/listening' } as const;
const CTA_WORDS = { label: 'Ôn từ vựng', href: '/study' } as const;
const CTA_GRAMMAR = { label: 'Xem ngữ pháp', href: '/ngu-phap' } as const;

/** Lối luyện kỹ năng cho dạng câu yếu (cùng `href`/`cta` của `PART_INFO` web) — chỉ người đã đăng nhập thấy. */
const PART_CTA: Record<string, { label: string; href: '/listening' | '/study' | '/ngu-phap' | '/tu-dien' | '/writing' }> = {
  'listening:judge': CTA_LISTEN,
  'listening:choose-picture': CTA_LISTEN,
  'listening:match-picture': CTA_LISTEN,
  'listening:choose-text': CTA_LISTEN,
  'listening:judge-text': CTA_LISTEN,
  'reading:judge': CTA_WORDS,
  'reading:match-picture': CTA_WORDS,
  'reading:judge-text': CTA_WORDS,
  'reading:choose-text': CTA_WORDS,
  'reading:match-text': CTA_GRAMMAR,
  'reading:fill-blank': CTA_GRAMMAR,
  'reading:order': CTA_GRAMMAR,
  'writing:order': CTA_GRAMMAR,
  'writing:write-sentence': { label: 'Tra từ, xem câu ví dụ', href: '/tu-dien' },
  'writing:pinyin-char': { label: 'Luyện viết chữ', href: '/writing' },
};

export function partCta(section: MockSectionKind, type: MockPartType) {
  return PART_CTA[`${section}:${type}`] ?? null;
}

/** Các phần yếu nhất (dưới 80% câu đúng), yếu trước. */
export function weakest<T extends { correct: number; total: number }>(parts: T[], n = 2): T[] {
  return parts
    .filter((p) => p.total > 0 && p.correct / p.total < 0.8)
    .sort((a, b) => a.correct / a.total - b.correct / b.total)
    .slice(0, n);
}

const SECTION_SLUG: Record<MockSectionKind, string> = { listening: 'nghe', reading: 'doc', writing: 'viet' };

/** Slug bộ "luyện từng dạng bài" của 1 phần đề (cùng quy ước với server), vd `hsk3-viet-1`. */
export function practiceSlug(level: number, section: MockSectionKind, part: number) {
  return `hsk${level}-${SECTION_SLUG[section]}-${part}`;
}

/** Đường dẫn "luyện riêng dạng này" (gom câu cùng dạng từ mọi đề cùng cấp). */
export function practiceHref(level: number, section: MockSectionKind, part: number) {
  return `/thi-thu-hsk/dang-bai/${practiceSlug(level, section, part)}` as const;
}

export interface PartScore {
  section: MockSectionKind;
  /** Số phần đề chính thức, 1-based. */
  part: number;
  type: MockPartType;
  correct: number;
  total: number;
}

/** Điểm từng phần đề (nửa sau `continues` cộng gộp vào phần chính thức). */
export function partScores(paper: MockPaper, review: Map<number, MockReviewItem>): PartScore[] {
  return paper.sections.flatMap((s) => {
    const official = officialIndexes(s.parts);
    const out: PartScore[] = [];
    s.parts.forEach((p, i) => {
      const correct = p.items.filter((it) => review.get(it.no)?.correct).length;
      const last = out[out.length - 1];
      if (p.continues && last) {
        last.correct += correct;
        last.total += p.items.length;
      } else out.push({ section: s.kind, part: official[i] + 1, type: p.type, correct, total: p.items.length });
    });
    return out;
  });
}

/** Đáp án `v` có đúng với câu đã chữa `r` không — luyện lại câu sai chấm ngay trên máy (câu sắp xếp nhận cả cách khác). */
export function isRightAnswer(r: Pick<MockReviewItem, 'answer' | 'alternatives'>, v: MockAnswer | null): boolean {
  if (v === null) return false;
  if (typeof r.answer === 'string') {
    return (
      typeof v === 'string' &&
      [r.answer, ...(r.alternatives ?? [])].some((a) => normalizeSentence(a) === normalizeSentence(v))
    );
  }
  return v === r.answer;
}

/**
 * Câu hỏi gửi trợ lý AI cho 1 câu đã chữa (`assistantPrompt` của web): nội dung câu, đáp án đúng và đáp án đã chọn —
 * trợ lý trả lời đúng chỗ vướng, không phải hỏi lại. Dùng chung màn kết quả đề và trang luyện từng dạng bài.
 */
export function assistantPrompt({
  title,
  section,
  officialPart,
  part,
  item,
  review,
  picked,
}: {
  title: string;
  section: MockSectionKind;
  /** Phần đề chính thức (1-based). */
  officialPart: number;
  part: MockPart;
  item: MockItem;
  review: MockReviewItem;
  picked: MockAnswer | null;
}): string {
  const describe = (v: MockAnswer | null) => {
    if (v === null) return 'bỏ trống';
    if (typeof v === 'string') return `"${v}"`;
    if (typeof v === 'boolean')
      return part.type === 'judge'
        ? v
          ? '✓ (khớp với tranh)'
          : '✗ (không khớp tranh)'
        : v
          ? '✓ (câu ★ đúng)'
          : '✗ (câu ★ sai)';
    if (item.choices) return `chữ ${item.choices[v]}`;
    const option = item.options?.[v] ?? part.options?.[v];
    const picture = review.pictureLabels?.[v];
    return `${String.fromCharCode(65 + v)}${option ? ` (${option.zh})` : picture ? ` (tranh: ${picture})` : ''}`;
  };
  const sentence = review.transcript?.length
    ? `Lời thoại: ${review.transcript.map((l) => l.zh).join(' ')}`
    : item.pieces
      ? `Các từ cần sắp xếp: ${item.pieces.map((x) => x.zh).join(' / ')}`
      : item.blank
        ? `Câu: ${item.blank.before.zh}（${item.pinyin ?? ' '}）${item.blank.after.zh}`
        : item.text
          ? `Đoạn: ${item.text.zh}`
          : '';
  const star = item.statement ?? item.question;
  return [
    `Giải thích giúp mình câu ${item.no} — ${title}, phần ${SECTION_SHORT[section]} ${officialPart} (${partInfo(section, part.type).label}).`,
    sentence.slice(0, 400),
    star ? `★ ${star.zh}` : '',
    part.type === 'judge' && review.pictureLabels?.[0] ? `Tranh: ${review.pictureLabels[0]}.` : '',
    `Đáp án đúng: ${describe(review.answer)}. Mình chọn: ${describe(picked)}.`,
    'Vì sao đáp án đúng là vậy, dựa vào từ khoá nào? Ngắn gọn thôi nhé.',
  ]
    .filter(Boolean)
    .join('\n');
}
