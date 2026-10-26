import { StyleSheet, View } from 'react-native';

import { AppText, Card, IconTile, ShareButton } from '@/components/ui';
import { WEB_ORIGIN } from '@/lib/api';
import { useReferralStats } from '@/lib/hooks';

/** "Mời bạn bè cùng học" (`ReferralCard` của web): người được mời học xong ngày đầu thì cả hai nhận thêm 1 lá chắn. */
export function ReferralCard({ userId }: { userId: string }) {
  const { data } = useReferralStats();
  const message = `Mình đang học tiếng Trung theo chuẩn HSK 3.0 trên Hanni — vào học cùng mình nhé, cả hai sẽ nhận thêm lá chắn giữ chuỗi ngày học! ${WEB_ORIGIN}/register?ref=${userId}`;

  return (
    <Card style={styles.card}>
      <View style={styles.head}>
        <IconTile icon="spark" iconSize={20} />
        <View style={styles.flex}>
          <AppText weight="600">Mời bạn bè cùng học</AppText>
          <AppText color="muted" style={styles.desc}>
            Khi bạn mời hoàn thành ngày học đầu tiên, cả hai đều nhận thêm 1 lá chắn giữ chuỗi ngày học.
          </AppText>
        </View>
      </View>
      {data && data.totalReferred > 0 && (
        <AppText style={styles.stats}>
          Đã mời <AppText weight="700">{data.totalReferred}</AppText> người ·{' '}
          <AppText weight="700" color="good">
            {data.rewardedCount}
          </AppText>{' '}
          đã nhận thưởng
          {data.pendingCount > 0 ? ` · ${data.pendingCount} đang chờ` : ''}
        </AppText>
      )}
      <ShareButton message={message} style={styles.share} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 0 },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  flex: { flex: 1, minWidth: 0 },
  desc: { marginTop: 4, lineHeight: 24 },
  stats: { marginTop: 16 },
  share: { marginTop: 20 },
});
