import { StyleSheet, View } from 'react-native';
import useSWR from 'swr';

import { AppText, Card, Icon } from '@/components/ui';
import { alpha } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { PremiumStatus } from '@/lib/types';

/** Quyền lợi Premium — chỉ ghi những gì server thật sự đã có (giống bảng so sánh của web). */
const BENEFITS = [
  'Hanni Coach: AI nhận xét báo cáo tuần/tháng/quý',
  'Luyện nói với AI và trợ lý AI không giới hạn (bản thường 15 lượt/ngày)',
  'AI chấm câu, mẹo nhớ, dịch câu 200 lượt/ngày (bản thường 10)',
  'Quét ảnh học từ 100 ảnh/ngày (bản thường 3)',
];

/**
 * Thẻ Premium ở Tài khoản (`PremiumSection` của web). App KHÔNG bán Premium (gói số trong app phải qua thanh toán
 * của App Store / Google Play) nên thay nút "Nâng cấp ngay" bằng quyền lợi + ghi chú.
 */
export function PremiumCard() {
  const theme = useTheme();
  const { data } = useSWR<PremiumStatus>('/premium/status');
  if (!data) return null;
  const tile = (
    <View style={[styles.tile, { backgroundColor: alpha(theme.accent, 0.1), borderColor: theme.border }]}>
      <Icon name="crown" size={20} color="accent" />
    </View>
  );
  return (
    <Card style={styles.card}>
      {data.active ? (
        <View style={styles.head}>
          {tile}
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
      ) : (
        <>
          <View style={styles.head}>
            {tile}
            <View style={styles.flex}>
              <AppText weight="600">Nâng cấp Premium</AppText>
              <AppText color="muted" style={styles.desc}>
                Hanni Coach nhận xét bằng AI, quét ảnh 100 lượt/ngày, trợ lý AI không giới hạn — không khoá bài học nào.
              </AppText>
            </View>
          </View>
          <View style={styles.list}>
            {BENEFITS.map((b) => (
              <View key={b} style={styles.item}>
                <Icon name="check" size={15} color="good" />
                <AppText style={styles.itemText}>{b}</AppText>
              </View>
            ))}
          </View>
          <AppText variant="caption" color="muted" style={styles.note}>
            Gói Premium hiện chưa bán trong app.
          </AppText>
        </>
      )}
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
  list: { marginTop: 16, gap: 8 },
  item: { flexDirection: 'row', gap: 8 },
  itemText: { flex: 1, lineHeight: 20 },
  note: { marginTop: 12 },
});
