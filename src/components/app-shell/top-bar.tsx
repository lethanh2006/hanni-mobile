import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useSWR from 'swr';

import { AppText, Avatar, Flicker, Icon } from '@/components/ui';
import { alpha, mix } from '@/constants/theme';
import { NotificationPanel } from '@/features/notifications/notification-panel';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth';
import { useStreak } from '@/lib/hooks';
import { useNotifications } from '@/lib/notifications';
import { setThemeMode, useColorScheme } from '@/lib/theme-mode';
import type { PremiumStatus } from '@/lib/types';

/** Logo cáo (`Brand` của web). `compact` = chỉ mặt cáo (thanh trên điện thoại). */
export function Brand({ compact = false }: { compact?: boolean }) {
  const theme = useTheme();
  return (
    <View style={styles.brand}>
      <Image source={require('@/assets/images/fox-mark.png')} style={styles.mark} />
      {!compact && (
        <View>
          <AppText style={styles.brandName}>
            Hanni<Text style={{ color: theme.primary }}>.</Text>
          </AppText>
          <AppText variant="caption" color="muted" style={styles.brandSub}>
            Học tiếng Trung mỗi ngày
          </AppText>
        </View>
      )}
    </View>
  );
}

/**
 * Thanh trên của khung app (`app-shell.tsx` của web ở khổ điện thoại): logo cáo · chuỗi ngày (+ lá chắn) ·
 * vương miện Premium · chuông · sáng/tối · ảnh đại diện. Khách: chip "Khách" + nút "Tạo tài khoản".
 */
export function TopBar() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const streak = useStreak();
  return (
    <View
      style={[
        styles.bar,
        { paddingTop: insets.top, backgroundColor: alpha(theme.surface, 0.95), borderColor: theme.border },
      ]}>
      <View style={styles.row}>
        <Pressable onPress={() => router.navigate('/')} accessibilityRole="link" accessibilityLabel="Hanni — trang chủ">
          <Brand compact />
        </Pressable>
        <View style={styles.actions}>
          {streak.data && (
            <Pressable
              onPress={() => router.navigate('/progress')}
              accessibilityLabel={`Chuỗi ${streak.data.currentStreak} ngày học`}
              style={[
                styles.streak,
                {
                  borderColor: alpha(theme.primary, 0.22),
                  backgroundImage: `linear-gradient(135deg, ${mix(theme.primary, theme.surface, 0.14)}, ${mix(theme.accent, theme.surface, 0.1)})`,
                  boxShadow: `0 4px 14px -6px ${alpha(theme.primary, 0.3)}`,
                },
              ]}>
              <Flicker on={streak.data.activeToday}>
                <Icon name="flame" size={16} color="primary" />
              </Flicker>
              <AppText variant="caption" weight="600" color="primary">
                {streak.data.currentStreak}
              </AppText>
              {/* Lá chắn kiếm được phải nhìn thấy được — phần thưởng vô hình thì không tạo động lực. */}
              {streak.data.streakFreezeCount > 0 && (
                <View style={[styles.shield, { borderColor: alpha(theme.primary, 0.2) }]}>
                  <Icon name="shield" size={13} color="primary" />
                  <AppText variant="caption" weight="600" color="primary">
                    {streak.data.streakFreezeCount}
                  </AppText>
                </View>
              )}
            </Pressable>
          )}
          {user && <PremiumTopButton />}
          {user && <BellButton />}
          <ThemeToggle />
          {user ? (
            <Pressable
              onPress={() => router.navigate('/account')}
              accessibilityLabel="Mở tài khoản"
              style={[
                styles.account,
                {
                  borderColor: mix(theme.border, theme.primary, 0.9),
                  backgroundColor: alpha(theme.surface, 0.8),
                  boxShadow: `0 2px 8px -4px ${alpha(theme.text, 0.1)}`,
                },
              ]}>
              <Avatar user={user} size={36} />
            </Pressable>
          ) : (
            <>
              <View style={[styles.guest, { backgroundColor: theme.surface2 }]}>
                <Icon name="user" size={12} color="muted" />
                <AppText variant="caption" weight="600" color="muted">
                  Khách
                </AppText>
              </View>
              <Pressable
                onPress={() => router.push('/register')}
                style={({ pressed }) => [
                  styles.register,
                  {
                    backgroundColor: theme.primary,
                    boxShadow: pressed ? undefined : `0 2px 0 ${mix(theme.primary, '#000000', 0.62)}`,
                    transform: [{ translateY: pressed ? 2 : 0 }],
                  },
                ]}>
                <AppText variant="caption" weight="700" color="primaryText">
                  Tạo tài khoản
                </AppText>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

/** Vương miện trên thanh trên (chưa Premium). App không bán Premium nên mở phần Premium ở Tài khoản. */
function PremiumTopButton() {
  const theme = useTheme();
  const { data } = useSWR<PremiumStatus>('/premium/status');
  if (!data || data.active) return null;
  return (
    <Pressable
      onPress={() => router.navigate('/premium')}
      accessibilityLabel="Hanni Premium"
      style={[styles.crown, { backgroundColor: alpha(theme.accent, 0.12) }]}>
      <Icon name="crown" size={17} color="accent" />
    </Pressable>
  );
}

function BellButton() {
  const theme = useTheme();
  const { data } = useNotifications();
  const unread = data?.unreadCount ?? 0;
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable
        onPress={() => setOpen(!open)}
        accessibilityState={{ expanded: open }}
        accessibilityLabel={unread > 0 ? `Thông báo, ${unread} chưa đọc` : 'Thông báo'}
        style={({ pressed }) => [styles.bell, pressed && { backgroundColor: theme.surface2 }]}>
        <Icon name="bell" size={19} color="muted" />
        {unread > 0 && (
          <View style={[styles.badge, { backgroundColor: theme.danger }]}>
            <Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text>
          </View>
        )}
      </Pressable>
      <NotificationPanel open={open} onClose={() => setOpen(false)} />
    </>
  );
}

export function ThemeToggle() {
  const theme = useTheme();
  const dark = useColorScheme() === 'dark';
  return (
    <Pressable
      onPress={() => setThemeMode(dark ? 'light' : 'dark')}
      accessibilityLabel={dark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
      style={({ pressed }) => [styles.toggle, pressed && { backgroundColor: theme.surface2 }]}>
      <Icon name={dark ? 'sun' : 'moon'} size={18} color="muted" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: { borderBottomWidth: 1 },
  row: { height: 64, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12 },
  actions: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 0 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mark: { width: 40, height: 40, borderRadius: 12 },
  brandName: { fontSize: 20, lineHeight: 24, fontWeight: '700', letterSpacing: -0.5 },
  brandSub: { marginTop: 2 },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 40,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 9,
  },
  shield: { flexDirection: 'row', alignItems: 'center', gap: 2, marginLeft: 2, paddingLeft: 6, borderLeftWidth: 1 },
  crown: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  bell: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#ffffff', fontSize: 11, fontWeight: '700' },
  toggle: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  account: { padding: 3, borderRadius: 999, borderWidth: 1 },
  guest: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  register: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8 },
});
