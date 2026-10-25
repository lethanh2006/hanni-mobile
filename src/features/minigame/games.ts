import type { IconName } from '@/components/ui';
import type { GameMode } from '@/lib/types';

export interface GameDef {
  mode: GameMode;
  title: string;
  icon: IconName;
  tagline: string;
  rules: string[];
}

/** 4 trò luyện từ — giống `GAMES` ở trang minigame của web. */
export const GAMES: GameDef[] = [
  {
    mode: 'TRANSLATE',
    title: 'Dịch tốc độ',
    icon: 'target',
    tagline: 'Chọn nghĩa tiếng Việt đúng cho từ tiếng Trung hiện ra — chạy đua với đồng hồ.',
    rules: ['60 giây, trả lời càng nhiều câu càng tốt — mỗi câu đúng 1 điểm.'],
  },
  {
    mode: 'LISTENING',
    title: 'Nghe đoán từ',
    icon: 'headphones',
    tagline: 'Nghe phát âm rồi chọn đúng nghĩa — không nhìn chữ, luyện phản xạ nghe thật.',
    rules: ['60 giây, chỉ nghe âm thanh (Hán tự/pinyin được ẩn) — mỗi câu đúng 1 điểm.'],
  },
  {
    mode: 'MATCH',
    title: 'Ghép cặp',
    icon: 'cards',
    tagline: 'Lật thẻ tìm đúng cặp Hán tự ↔ nghĩa — càng ít lật sai điểm càng cao.',
    rules: [
      '8 cặp thẻ (16 ô) — lật 2 thẻ mỗi lượt, khớp đúng thì giữ nguyên, sai thì úp lại.',
      'Không lật sai lần nào được tối đa 8 điểm, mỗi lần lật sai trừ 1 điểm.',
    ],
  },
  {
    mode: 'PINYIN',
    title: 'Chọn pinyin đúng',
    icon: 'sound',
    tagline: 'Nhìn Hán tự, chọn đúng pinyin — luyện thanh điệu thay vì nghĩa.',
    rules: ['60 giây, trả lời càng nhiều câu càng tốt — mỗi câu đúng 1 điểm.'],
  },
];

export const GAME_DURATION_MS = 60_000;
