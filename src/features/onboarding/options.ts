import type { Href } from 'expo-router';

import type { IconName } from '@/components/ui';
import type { OnboardingGoal } from '@/lib/types';

export interface Option {
  value: number;
  label: string;
  hint: string;
}

export const GOALS: { key: OnboardingGoal; label: string; hint: string; icon: IconName }[] = [
  { key: 'EXAM', label: 'Thi chứng chỉ HSK', hint: 'Chia lộ trình theo ngày thi', icon: 'trophy' },
  { key: 'TRAVEL', label: 'Giao tiếp, du lịch', hint: 'Nói được câu thường ngày', icon: 'route' },
  { key: 'WORK', label: 'Công việc', hint: 'Trao đổi với đối tác, đồng nghiệp', icon: 'chart' },
  { key: 'ACADEMIC', label: 'Du học', hint: 'Cần chứng chỉ HSK để nộp hồ sơ', icon: 'book' },
  { key: 'INTEREST', label: 'Phim ảnh, văn hoá', hint: 'Học vì thích', icon: 'heart' },
  { key: 'OTHER', label: 'Lý do khác', hint: 'Chỉ cần học đều mỗi ngày', icon: 'spark' },
];

/** Gợi ý cách luyện theo mục tiêu (mục tiêu thi HSK có dòng lộ trình riêng). */
/** `guest` = khách mở được (trang không cần tài khoản). Học qua video chưa có trên app nên trỏ sang Luyện tập. */
export const GOAL_SUGGESTION: Record<
  Exclude<OnboardingGoal, 'EXAM'>,
  { label: string; detail: string; href: Href; guest: boolean }
> = {
  TRAVEL: { label: 'Luyện nói với AI', detail: 'gọi món, hỏi đường, mua sắm như thật', href: '/roleplay', guest: false },
  WORK: { label: 'Luyện nói với AI', detail: 'luyện phản xạ trao đổi bằng tiếng Trung', href: '/roleplay', guest: false },
  ACADEMIC: { label: 'Đề thi thử HSK', detail: 'làm thử 1 đề để biết mình đang ở đâu', href: '/thi-thu-hsk', guest: true },
  INTEREST: { label: 'Học qua video', detail: 'phim ngắn có phụ đề song ngữ, bấm từ để tra', href: '/luyen-tap', guest: false },
  OTHER: { label: 'Luyện tập', detail: 'nghe, nói, viết, trò chơi — chọn cách bạn thích', href: '/luyen-tap', guest: false },
};

/** Cấp 7 = HSK 7–9 (dữ liệu bài học gộp 3 cấp này). */
export const LEVELS: Option[] = [
  { value: 1, label: 'HSK 1', hint: 'Nhập môn' },
  { value: 2, label: 'HSK 2', hint: 'Nền tảng' },
  { value: 3, label: 'HSK 3', hint: 'Giao tiếp' },
  { value: 4, label: 'HSK 4', hint: 'Trung cấp' },
  { value: 5, label: 'HSK 5', hint: 'Mở rộng' },
  { value: 6, label: 'HSK 6', hint: 'Khá tốt' },
  { value: 7, label: 'HSK 7–9', hint: 'Nâng cao' },
];

export const EXAM_WINDOWS: Option[] = [
  { value: 3, label: '3 tháng', hint: '≈ 13 tuần' },
  { value: 6, label: '6 tháng', hint: '≈ 26 tuần' },
  { value: 12, label: '1 năm', hint: '≈ 52 tuần' },
  { value: 0, label: 'Chưa rõ', hint: 'chưa có ngày' },
];

export const DAILY_MINUTES: Option[] = [
  { value: 5, label: '5 phút', hint: 'Nhẹ nhàng' },
  { value: 10, label: '10 phút', hint: 'Vừa phải' },
  { value: 15, label: '15 phút', hint: 'Chăm chỉ' },
  { value: 20, label: '20 phút', hint: 'Tăng tốc' },
];
