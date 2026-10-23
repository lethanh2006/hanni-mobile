import type { IconName } from '@/components/ui';

import type { LessonNode } from './types';

/** Một chủ đề = các bài liền nhau cùng tên, vd "Số đếm (1/2)" + "Số đếm (2/2)". */
export interface Unit {
  title: string;
  icon: IconName;
  lessons: { lesson: LessonNode; part: string | null }[];
}

/** Icon theo từ khoá trong tên chủ đề — chủ đề nào cũng có hình riêng để dễ quét mắt. */
const TOPIC_ICONS: [RegExp, IconName][] = [
  [/chào|giao tiếp|xã giao|lịch sự/i, 'message'],
  [/gia đình|con người|trẻ em|bạn bè/i, 'home'],
  [/thời gian|ngày tháng|lịch/i, 'clock'],
  [/số|đơn vị|lượng/i, 'chart'],
  [/đại từ|nhân xưng/i, 'user'],
  [/địa điểm|vị trí|phương hướng|giao thông|đi lại|du lịch/i, 'route'],
  [/đồ ăn|ẩm thực|thức uống|ăn uống/i, 'heart'],
  [/thời tiết|thiên nhiên|môi trường/i, 'sun'],
  [/thể thao|giải trí|nghệ thuật|âm nhạc/i, 'trophy'],
  [/cảm xúc|tình cảm|tính cách/i, 'heart'],
  [/công việc|nghề|kinh doanh|kinh tế/i, 'target'],
  [/học|trường|giáo dục/i, 'pencil'],
  [/sức khỏe|cơ thể|bệnh/i, 'flame'],
  [/màu|mô tả|tính từ/i, 'eye'],
  [/động từ|hành động/i, 'play'],
  [/đồ vật|phương tiện|sinh hoạt/i, 'cards'],
  [/ngữ pháp|trợ từ|phó từ|liên từ|giới từ|thành ngữ/i, 'book'],
];

export function topicIcon(title: string): IconName {
  return TOPIC_ICONS.find(([re]) => re.test(title))?.[1] ?? 'spark';
}

/** "Số đếm & số lượng (1/2)" → chủ đề "Số đếm & số lượng", phần "1/2". */
export function toUnits(lessons: LessonNode[]): Unit[] {
  const units: Unit[] = [];
  for (const lesson of lessons) {
    const m = /^(.*?)\s*\((\d+\/\d+)\)\s*$/.exec(lesson.title);
    const title = m ? m[1] : lesson.title;
    const last = units[units.length - 1];
    if (last && last.title === title) last.lessons.push({ lesson, part: m?.[2] ?? null });
    else units.push({ title, icon: topicIcon(title), lessons: [{ lesson, part: m?.[2] ?? null }] });
  }
  return units;
}

/** Ước lượng phút học 1 bài (giới thiệu + luyện ~35 giây/từ). */
export function lessonMinutes(wordCount: number): number {
  return Math.max(3, Math.round(wordCount * 0.6));
}
