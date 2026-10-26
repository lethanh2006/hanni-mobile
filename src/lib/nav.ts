import type { Href } from 'expo-router';

import type { IconName } from '@/components/ui';

/** Menu chép từ `lib/nav.ts` của web: 5 mục học + Xếp hạng, Lớp học, Tiến độ; Tài khoản ở chân menu. */
export interface NavLink {
  /** Tên route trong nhóm `(tabs)` (cũng là đường dẫn). */
  name: string;
  href: Href;
  label: string;
  icon: IconName;
}

export const NAV_MAIN: NavLink[] = [
  { name: 'index', href: '/', label: 'Trang chủ', icon: 'home' },
  { name: 'study', href: '/study', label: 'Ôn tập', icon: 'cards' },
  { name: 'thi-thu-hsk', href: '/thi-thu-hsk', label: 'Luyện thi HSK', icon: 'target' },
  { name: 'luyen-tap', href: '/luyen-tap', label: 'Luyện tập', icon: 'grid' },
  { name: 'tu-dien', href: '/tu-dien', label: 'Từ điển', icon: 'search' },
];

export const NAV_MORE: NavLink[] = [
  { name: 'leaderboard', href: '/leaderboard', label: 'Xếp hạng', icon: 'trophy' },
  { name: 'lop-hoc', href: '/lop-hoc', label: 'Lớp học', icon: 'users' },
  { name: 'progress', href: '/progress', label: 'Tiến độ', icon: 'chart' },
];

export const ACCOUNT_LINK: NavLink = { name: 'account', href: '/account', label: 'Tài khoản', icon: 'user' };

/**
 * Thanh tab dưới đáy (`bottom-nav.tsx` của web): 4 việc hằng ngày + "Thêm". "Từ điển" và phần cộng đồng/cá nhân
 * nằm trong "Thêm" — đang ở các màn đó thì mục "Thêm" sáng.
 */
export const TABS: NavLink[] = NAV_MAIN.filter((l) => l.name !== 'tu-dien').map((l) =>
  l.name === 'thi-thu-hsk' ? { ...l, label: 'Luyện thi' } : l,
);
export const IN_MORE = ['tu-dien', ...NAV_MORE.map((l) => l.name), ACCOUNT_LINK.name];
