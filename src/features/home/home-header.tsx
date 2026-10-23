import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Icon, TextLink } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';

/** Đầu Trang chủ: logo + lời chào; người đã đăng nhập có lối vào Tiến độ, khách thấy lối đăng nhập. */
export function HomeHeader() {
  const { user } = useAuth();
  return (
    <View style={styles.row}>
      <Image source={require('@/assets/images/fox-mark.png')} style={styles.logo} />
      <View style={styles.flex}>
        <AppText variant="heading">{user ? `Chào ${user.displayName}` : 'Hanni'}</AppText>
        <AppText variant="caption" color="muted">
          {user ? 'Mỗi ngày một chút tiếng Trung' : 'Bạn đang học ở chế độ khách'}
        </AppText>
      </View>
      {user ? (
        <Pressable
          onPress={() => router.push('/progress')}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Tiến độ học tập">
          <Icon name="chart" size={24} color="primary" />
        </Pressable>
      ) : (
        <TextLink title="Đăng nhập" onPress={() => router.push('/login')} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  logo: { width: 40, height: 40 },
  flex: { flex: 1 },
});
