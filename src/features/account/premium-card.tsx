import { StyleSheet, View } from 'react-native';
import useSWR from 'swr';

import { AppText, Card, Icon } from '@/components/ui';
import { alpha } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { PremiumStatus } from '@/lib/types';

/**
 * Trạng thái Premium của tài khoản. App phát hành trên CH Play không bán Premium (chính sách thanh toán của Google Play
 * cấm dẫn người dùng tới cổng thanh toán khác), nên chỉ hiện cho tài khoản đang có Premium, không nút mua hay gia hạn.
 */
export function PremiumCard() {
  const theme = useTheme();
  const { data } = useSWR<PremiumStatus>('/premium/status');
  if (!data?.active) return null;
  return (
    <Card style={styles.card}>
      <View style={styles.head}>
        <View style={[styles.tile, { backgroundColor: alpha(theme.accent, 0.1), borderColor: theme.border }]}>
          <Icon name="crown" size={20} color="accent" />
        </View>
        <View style={styles.flex}>
          <View style={styles.titleRow}>
            <AppText weight="600">Hanni Premium</AppText>
            <View style={[styles.badge, { backgroundColor: alpha(theme.accent, 0.1) }]}>
              <AppText variant="caption" weight="700" color="accent">
                ĐANG DÙNG
              </AppText>
            </View>
          </View>
          <AppText color="muted" style={styles.desc}>
            {data.lifetime
              ? 'Gói trọn đời — dùng mãi mãi.'
              : `Còn hiệu lực đến ${data.until ? new Date(data.until).toLocaleDateString('vi-VN') : '—'}.`}
          </AppText>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 0 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tile: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1, minWidth: 0 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  desc: { marginTop: 4, lineHeight: 22 },
});
