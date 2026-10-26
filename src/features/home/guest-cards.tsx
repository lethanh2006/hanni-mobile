import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Button, Card, Icon, IconTile, type IconName } from '@/components/ui';
import { alpha } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Khách (chưa đăng nhập) — tài khoản chỉ để LƯU, mời ở đúng chỗ thẻ chuỗi ngày của người đã đăng nhập. */
export function GuestSaveCard({ learned }: { learned: number }) {
  return (
    <Card style={styles.saveCard}>
      <IconTile icon="flame" />
      <AppText weight="700" style={styles.saveTitle}>
        {learned > 0 ? `Bạn đã học ${learned} bài — lưu lại nhé` : 'Học thử thoải mái, lưu khi bạn muốn'}
      </AppText>
      <AppText color="muted" style={styles.saveText}>
        Tạo tài khoản miễn phí để giữ chuỗi ngày học, ôn lại từ đúng lúc sắp quên và học tiếp trên mọi thiết bị.
      </AppText>
      <View style={styles.buttons}>
        <Button title="Tạo tài khoản" onPress={() => router.push('/register')} />
        <Button title="Đăng nhập" variant="secondary" onPress={() => router.push('/login')} />
      </View>
    </Card>
  );
}

/** Lối thử ngay của web; "Học qua video" chưa có trong app nên không đưa vào. */
const GUEST_TRY: { href: Href; label: string; hint: string; icon: IconName }[] = [
  { href: '/minigame', label: 'Trò chơi từ vựng', hint: '60 giây, dịch nhanh, ghép cặp', icon: 'trophy' },
  { href: '/thi-thu-hsk', label: 'Đề thi thử HSK', hint: 'Đúng cấu trúc đề thật, chấm ngay', icon: 'target' },
  { href: '/writing', label: 'Luyện viết chữ Hán', hint: 'Xem thứ tự nét rồi tự tô', icon: 'pencil' },
];

/** Thay thẻ nhiệm vụ (cần dữ liệu cá nhân) khi khách xem. */
export function GuestTryCard() {
  const theme = useTheme();
  return (
    <Card style={styles.tryCard}>
      <AppText weight="700" style={styles.tryTitle}>
        Thử ngay, chưa cần tài khoản
      </AppText>
      <View style={styles.list}>
        {GUEST_TRY.map((t) => (
          <Pressable
            key={t.label}
            onPress={() => router.navigate(t.href)}
            style={({ pressed }) => [styles.item, pressed && { backgroundColor: theme.surface2 }]}>
            <View style={[styles.icon, { backgroundColor: alpha(theme.primary, 0.08) }]}>
              <Icon name={t.icon} size={18} color="primary" />
            </View>
            <View style={styles.flex}>
              <AppText weight="600">{t.label}</AppText>
              <AppText variant="caption" color="muted">
                {t.hint}
              </AppText>
            </View>
            <Icon name="arrow" size={15} color="muted" />
          </Pressable>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  saveCard: { gap: 0 },
  saveTitle: { marginTop: 12, fontSize: 16, lineHeight: 24 },
  saveText: { marginTop: 6, lineHeight: 24 },
  buttons: { marginTop: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tryCard: { gap: 0 },
  tryTitle: { fontSize: 16, lineHeight: 24 },
  list: { marginTop: 12, gap: 6 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 8 },
  icon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1, minWidth: 0 },
});
