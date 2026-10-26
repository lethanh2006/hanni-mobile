import type { Href } from 'expo-router';

import type { IconName } from '@/components/ui';

export interface PracticeTool {
  label: string;
  description: string;
  icon: IconName;
  /** `null` = chưa chuyển sang app (hiện "Sắp có"). */
  href: Href | null;
}

/** Các cách luyện thêm ngoài lộ trình — giống `PRACTICE_SECTIONS` ở `lib/nav.ts` của web. */
export const PRACTICE_SECTIONS: { title: string; items: PracticeTool[] }[] = [
  {
    title: 'Luyện 4 kỹ năng',
    items: [
      { label: 'Luyện nghe', description: 'Nghe từ của bài đang học, gõ lại bằng pinyin', icon: 'headphones', href: '/listening' },
      { label: 'Luyện phát âm', description: 'Đọc to, Hanni chấm xem bạn nói đúng chưa', icon: 'mic', href: null },
      { label: 'Luyện nói với AI', description: 'Gọi món, hỏi đường, mua sắm — nói như thật', icon: 'message', href: '/roleplay' },
      { label: 'Luyện viết chữ Hán', description: 'Xem thứ tự nét rồi tự tô từng chữ', icon: 'pencil', href: '/writing' },
    ],
  },
  {
    title: 'Học mà chơi',
    items: [
      { label: 'Học qua video', description: 'Phim ngắn, phụ đề song ngữ, bấm từ để tra', icon: 'play', href: null },
      { label: 'Trò chơi luyện từ', description: 'Dịch tốc độ, nghe đoán từ, ghép cặp, chọn pinyin', icon: 'trophy', href: '/minigame' },
    ],
  },
  {
    title: 'Nền tảng & tra cứu',
    items: [
      { label: 'Bảng phiên âm', description: 'Thanh điệu, phụ âm, vần — bấm nghe từng âm', icon: 'sound', href: '/phien-am' },
      { label: 'Ngữ pháp & mẫu câu', description: '235 điểm ngữ pháp giải thích bằng tiếng Việt', icon: 'book', href: '/ngu-phap' },
      { label: 'Quét ảnh học từ', description: 'Chụp thực đơn, biển hiệu, đồ vật — ra từ kèm Hán Việt', icon: 'camera', href: null },
      { label: 'Từ bạn đã biết sẵn', description: 'Từ trùng nghĩa với tiếng Việt nhờ âm Hán Việt', icon: 'heart', href: null },
    ],
  },
];
