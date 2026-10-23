import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Button, Card, Icon, type IconName } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Khách: tài khoản chỉ để LƯU — mời ở đúng chỗ thẻ chuỗi ngày của người đã đăng nhập. */
export function GuestSaveCard({ learned }: { learned: number }) {
  return (
    <Card>
      <Icon name="flame" size={24} color="primary" />
      <AppText variant="heading">
        {learned > 0 ? `Bạn đã học ${learned} bài — lưu lại nhé` : 'Học thử thoải mái, lưu khi bạn muốn'}
      </AppText>
      <AppText variant="small" color="muted">
        Tạo tài khoản miễn phí để giữ chuỗi ngày học, ôn lại từ đúng lúc sắp quên và học tiếp trên mọi thiết bị.
      </AppText>
      <View style={styles.buttons}>
        <Button title="Tạo tài khoản" onPress={() => router.push('/register')} style={styles.flex} />
        <Button title="Đăng nhập" variant="secondary" onPress={() => router.push('/login')} style={styles.flex} />
      </View>
    </Card>
  );
}

const GUEST_TRY: { href: Href; label: string; hint: string; icon: IconName }[] = [
  { href: '/thi-thu-hsk', label: 'Đề thi thử HSK', hint: 'Đúng cấu trúc đề thật, chấm ngay', icon: 'target' },
  { href: '/luyen-tap', label: 'Luyện tập', hint: 'Nghe, viết, video, trò chơi từ vựng', icon: 'grid' },
  { href: '/tu-dien', label: 'Từ điển', hint: 'Tra từ kèm pinyin và âm Hán Việt', icon: 'search' },
];

/** Thay thẻ nhiệm vụ (cần dữ liệu cá nhân) khi khách xem. */
export function GuestTryCard() {
  const theme = useTheme();
  return (
    <Card>
      <AppText variant="heading">Thử ngay, chưa cần tài khoản</AppText>
      {GUEST_TRY.map((t) => (
        <Pressable key={t.label} onPress={() => router.navigate(t.href)} style={styles.item}>
          <View style={[styles.icon, { backgroundColor: theme.primarySoft }]}>
            <Icon name={t.icon} size={18} color="primary" />
          </View>
          <View style={styles.flex}>
            <AppText variant="small" bold>
              {t.label}
            </AppText>
            <AppText variant="caption" color="muted">
              {t.hint}
            </AppText>
          </View>
          <Icon name="chevron" size={16} color="muted" />
        </Pressable>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  buttons: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  item: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm },
  icon: { width: 36, height: 36, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
});
