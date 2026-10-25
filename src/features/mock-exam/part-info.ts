import type { MockPartType, MockSectionKind } from '@/lib/types';

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
