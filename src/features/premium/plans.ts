import type { PremiumPlan, PremiumStatus } from '@/lib/types';

export const BENEFITS = [
  'Hanni Coach nhận xét mọi báo cáo tuần, tháng, quý',
  'Quét ảnh: 3 → 100 ảnh/ngày',
  'Trợ lý AI và luyện nói AI: 15 lượt/ngày → không giới hạn',
  'AI chấm câu, mẹo nhớ, dịch câu: 10 → 200 lượt/ngày',
];

export const money = (amount: number) => `${amount.toLocaleString('vi-VN')}đ`;
export function durationLabel(plan: PremiumPlan) {
  if (plan.months === null) return 'Trọn đời';
  return plan.months % 12 === 0 ? `${plan.months / 12} năm` : `${plan.months} tháng`;
}

export function validity(plan: PremiumPlan, status: PremiumStatus, now = new Date()) {
  if (plan.months === null) return 'Trả một lần, dùng mãi mãi.';
  const extending = status.active && !status.lifetime && !!status.until;
  const end = extending ? new Date(status.until!) : new Date(now);
  const day = end.getDate();
  end.setDate(1);
  end.setMonth(end.getMonth() + plan.months);
  end.setDate(Math.min(day, new Date(end.getFullYear(), end.getMonth() + 1, 0).getDate()));
  return `${extending ? 'Cộng nối tiếp hạn hiện tại, dùng' : 'Dùng'} tới ${end.toLocaleDateString('vi-VN')}.`;
}
