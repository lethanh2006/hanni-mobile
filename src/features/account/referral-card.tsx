import { Pressable, Share, StyleSheet, View } from 'react-native';

import { AppText, Card, Icon, IconTile } from '@/components/ui';
import { alpha } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { WEB_ORIGIN } from '@/lib/api';
import { useReferralStats } from '@/lib/hooks';

/** "Mời bạn bè cùng học" (`ReferralCard` của web): người được mời học xong ngày đầu thì cả hai nhận thêm 1 lá chắn. */
export function ReferralCard({ userId }: { userId: string }) {
  const theme = useTheme();
  const { data } = useReferralStats();

  function invite() {
    void Share.share({
      message: `Mình đang học tiếng Trung theo chuẩn HSK 3.0 trên Hanni — vào học cùng mình nhé, cả hai sẽ nhận thêm lá chắn giữ chuỗi ngày học! ${WEB_ORIGIN}/register?ref=${userId}`,
    });
  }

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
      {/* Nút "Chia sẻ" dạng viên thuốc đỏ nhạt như `ShareButton` của web. */}
      <Pressable
        onPress={invite}
        style={({ pressed }) => [styles.share, { backgroundColor: alpha(theme.primary, pressed ? 0.15 : 0.1) }]}>
        <Icon name="share" size={15} color="primary" />
        <AppText weight="600" color="primary">
          Chia sẻ
        </AppText>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 0 },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  flex: { flex: 1, minWidth: 0 },
  desc: { marginTop: 4, lineHeight: 24 },
  stats: { marginTop: 16 },
  share: {
    marginTop: 20,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
});
