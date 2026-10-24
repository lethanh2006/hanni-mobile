import type { IconName } from '@/components/ui';
import type { MockPart, MockPaper, MockSectionKind } from '@/lib/types';

export const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
export const PART_ZH = ['第一部分', '第二部分', '第三部分', '第四部分'];
export const SPEAKER_VI = { M: 'Nam', F: 'Nữ', N: 'Hỏi' } as const;

export const SECTION_VI: Record<MockSectionKind, { zh: string; vi: string; icon: IconName }> = {
  listening: { zh: '听力', vi: 'Nghe hiểu', icon: 'headphones' },
  reading: { zh: '阅读', vi: 'Đọc hiểu', icon: 'book' },
  writing: { zh: '书写', vi: 'Viết', icon: 'pencil' },
};

/** Thứ tự phần đề CHÍNH THỨC (0-based) — nửa sau `continues` (HSK 2 câu 16–20) chung số với nửa trước. */
export function officialIndexes(parts: MockPaper['sections'][number]['parts']): number[] {
  let n = -1;
  return parts.map((p) => (p.continues ? Math.max(n, 0) : ++n));
}

/** Bỏ dấu câu + khoảng trắng — câu sắp xếp chỉ chấm thứ tự từ (giống server). */
export const normalizeSentence = (s: string) => s.replace(/[\s\p{P}]/gu, '');

/** Hướng dẫn từng dạng câu bằng tiếng Việt (đề thật in tiếng Trung). */
export function instruction(section: MockSectionKind, part: MockPart): string {
  const listen = section === 'listening';
  const board = part.pictures ?? part.options ?? [];
  const range = `A–${LETTERS[Math.max(0, board.length - 1)]}`;
  const spare = board.length > part.items.length ? ', thừa 1' : '';
  switch (part.type) {
    case 'judge':
      return listen
        ? 'Nghe rồi xem tranh: khớp với tranh chọn ✓, không khớp chọn ✗.'
        : 'Đọc từ bên cạnh tranh: khớp với tranh chọn ✓, không khớp chọn ✗.';
    case 'choose-picture':
      return 'Nghe 1 câu, chọn tranh đúng với câu vừa nghe.';
    case 'match-picture':
      return `${listen ? 'Nghe đoạn hội thoại' : 'Đọc câu'}, chọn tranh ${range} phù hợp. Mỗi tranh dùng 1 lần${spare}.`;
    case 'choose-text':
      return listen
        ? 'Nghe câu và câu hỏi, chọn đáp án đúng.'
        : 'Đọc đoạn văn rồi trả lời câu hỏi có dấu ★.';
    case 'match-text':
      return `Chọn câu trả lời ${range} phù hợp với mỗi câu hỏi. Mỗi câu trả lời dùng 1 lần${spare}.`;
    case 'fill-blank':
      return `Chọn từ ${range} điền vào chỗ trống. Mỗi từ dùng 1 lần${spare}.`;
    case 'judge-text':
      return listen
        ? 'Nghe đoạn văn rồi xét câu ★: đúng với điều vừa nghe chọn ✓, sai chọn ✗.'
        : 'Đọc đoạn văn rồi xét câu ★: đúng với đoạn văn chọn ✓, sai chọn ✗.';
    case 'order':
      return section === 'reading'
        ? 'Bấm lần lượt 3 câu để sắp thành đoạn văn đúng thứ tự; bấm câu đã xếp để bỏ ra.'
        : 'Bấm lần lượt các từ để sắp thành câu đúng; bấm từ đã xếp để bỏ ra.';
    case 'pinyin-char':
      return 'Nhìn pinyin, chọn chữ Hán đúng cho chỗ trống.';
    case 'write-sentence':
      return 'Nhìn tranh, dùng từ cho sẵn viết 1 câu bằng bàn phím tiếng Trung.';
  }
}

/** "05:09" */
export const mmss = (sec: number) =>
  `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
