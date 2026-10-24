import { Share } from 'react-native';

import { AppText, Button, Card, SectionTitle } from '@/components/ui';
import { WEB_ORIGIN } from '@/lib/api';
import { useReferralStats } from '@/lib/hooks';

/** Mời bạn cùng học: người được mời học xong ngày đầu thì cả hai nhận thêm 1 lá chắn giữ chuỗi. */
export function ReferralCard({ userId }: { userId: string }) {
  const { data } = useReferralStats();

  function invite() {
    void Share.share({
      message: `Mình đang học tiếng Trung theo chuẩn HSK 3.0 trên Hanni — vào học cùng mình nhé, cả hai sẽ nhận thêm lá chắn giữ chuỗi ngày học! ${WEB_ORIGIN}/register?ref=${userId}`,
    });
  }

  return (
    <Card>
      <SectionTitle title="Mời bạn bè cùng học" />
      <AppText variant="small" color="muted">
        Khi bạn được mời hoàn thành ngày học đầu tiên, cả hai đều nhận thêm 1 lá chắn giữ chuỗi ngày học.
      </AppText>
      {data && data.totalReferred > 0 && (
        <AppText variant="small">
          Đã mời {data.totalReferred} người · {data.rewardedCount} đã nhận thưởng
          {data.pendingCount > 0 ? ` · ${data.pendingCount} đang chờ` : ''}
        </AppText>
      )}
      <Button title="Gửi lời mời" icon="share" variant="secondary" onPress={invite} />
    </Card>
  );
}
