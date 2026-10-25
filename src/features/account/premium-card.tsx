import useSWR from 'swr';

import { AppText, Card, SectionTitle } from '@/components/ui';
import type { PremiumStatus } from '@/lib/types';

/** Quyền lợi Premium — chỉ ghi những gì server thật sự đã có (giống bảng so sánh của web). */
const BENEFITS = [
  'Hanni Coach: AI nhận xét báo cáo tuần/tháng/quý',
  'Luyện nói với AI và trợ lý AI không giới hạn (bản thường 15 lượt/ngày)',
  'AI chấm câu, mẹo nhớ, dịch câu 200 lượt/ngày (bản thường 10)',
  'Quét ảnh học từ 100 ảnh/ngày (bản thường 3)',
];

/**
 * Trạng thái Premium trong Tài khoản. App KHÔNG bán Premium: mua gói số trong app phải qua thanh toán
 * của App Store / Google Play, nên tạm chỉ hiện hạn dùng và quyền lợi.
 */
export function PremiumCard() {
  const { data } = useSWR<PremiumStatus>('/premium/status');
  if (!data) return null;

  return (
    <Card>
      <SectionTitle title="Hanni Premium" />
      {data.active ? (
        <AppText bold color="accent">
          {data.lifetime
            ? 'Bạn đang dùng gói trọn đời.'
            : `Còn hiệu lực đến ${data.until ? new Date(data.until).toLocaleDateString('vi-VN') : '—'}.`}
        </AppText>
      ) : (
        <AppText variant="small" color="muted">
          Toàn bộ bài học, từ điển, ôn tập và đề thi thử đều miễn phí. Premium chỉ mở thêm tiện ích AI:
        </AppText>
      )}
      {BENEFITS.map((b) => (
        <AppText key={b} variant="small">
          • {b}
        </AppText>
      ))}
      {!data.active && (
        <AppText variant="caption" color="muted">
          Gói Premium hiện chưa bán trong app.
        </AppText>
      )}
    </Card>
  );
}
