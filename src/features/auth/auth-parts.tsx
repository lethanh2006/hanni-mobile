import { Image } from 'expo-image';
import { router, Stack, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemeToggle } from '@/components/app-shell/top-bar';
import { AppText, Button, EmptyState, Icon, type IconName } from '@/components/ui';
import { alpha, mix } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Chỉ nhận đường dẫn nội bộ, và không quay lại chính màn đăng nhập/đăng ký. */
function nextPath(value: string | undefined): Href | null {
  if (!value || !value.startsWith('/') || value === '/' || /^\/(login|register|forgot-password)/.test(value)) {
    return null;
  }
  return value as Href;
}

/**
 * Rời màn đăng nhập/đăng ký: có `next` (màn cần đăng nhập vừa chuyển sang đây) thì mở màn đó,
 * không thì quay về Trang chủ đang có trong stack — `replace('/')` sẽ chồng thêm một bộ tab nữa.
 */
export function leaveAuth(next: string | undefined) {
  const target = nextPath(next);
  if (target) router.replace(target);
  else router.dismissTo('/');
}

/**
 * Khung màn đăng nhập/đăng ký/quên mật khẩu (`LoginShell` của web ở khổ điện thoại): logo + chọn giao diện + "VI"
 * trên cùng, cáo Hanni trong khung tròn, rồi thẻ form viền hồng nhạt bo 18.
 */
export function AuthShell({ children }: { children: ReactNode }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView
      behavior="padding"
      style={[
        styles.screen,
        {
          backgroundColor: theme.surface,
          backgroundImage: `radial-gradient(ellipse at 0% 28%, ${alpha(theme.primary, 0.05)}, transparent 48%)`,
        },
      ]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top, paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.dismissTo('/')} accessibilityLabel="Hanni — trang chủ" style={styles.brand}>
            <Image source={require('@/assets/images/fox-mark.png')} style={styles.mark} />
            <AppText weight="700" style={styles.brandName}>
              Hanni<AppText weight="700" color="primary" style={styles.brandName}>.</AppText>
            </AppText>
          </Pressable>
          <View style={styles.headerRight}>
            <ThemeToggle />
            <View style={[styles.lang, { backgroundColor: alpha(theme.primary, 0.08) }]} accessibilityLabel="Ngôn ngữ: Tiếng Việt">
              <AppText variant="caption" weight="700" color="primary" style={styles.langText}>
                VI
              </AppText>
            </View>
          </View>
        </View>
        <View style={styles.mascotWrap}>
          <View style={[styles.mascot, { backgroundColor: theme.heroFrom }]}>
            <Image source={require('@/assets/images/mascot.png')} style={styles.mascotImage} contentFit="cover" />
          </View>
        </View>
        <View
          style={[
            styles.card,
            {
              borderColor: mix(theme.border, theme.primary, 0.75),
              backgroundColor: mix(theme.primary, theme.surface, 0.03),
            },
          ]}>
          {children}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/** Nhãn hồng đầu thẻ (`.section-label`): "MỖI NGÀY MỘT CHÚT TIẾNG TRUNG". */
export function SectionLabel({ icon, children }: { icon: IconName; children: string }) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.sectionLabel,
        {
          borderColor: alpha(theme.primary, 0.2),
          backgroundColor: alpha(theme.primary, 0.1),
          boxShadow: `0 1px 0 ${alpha(theme.text, 0.05)}`,
        },
      ]}>
      <Icon name={icon} size={12} color="primary" />
      <AppText variant="caption" weight="600" color="primary" style={styles.sectionLabelText}>
        {children}
      </AppText>
    </View>
  );
}

/** Tiêu đề thẻ: chữ 24px đậm, dấu câu cuối màu đỏ ("Chào mừng bạn trở lại."). */
export function AuthTitle({
  text,
  mark,
  subtitle,
  compact = false,
}: {
  text: string;
  mark: string;
  subtitle: string;
  /** Mô tả nhỏ 13px sát tiêu đề (thẻ không có nhãn, vd Quên mật khẩu). */
  compact?: boolean;
}) {
  return (
    <View>
      <AppText weight="700" style={styles.title}>
        {text}
        <AppText weight="700" color="primary" style={styles.title}>
          {mark}
        </AppText>
      </AppText>
      <AppText color="muted" style={compact ? styles.subtitleCompact : styles.subtitle}>
        {subtitle}
      </AppText>
    </View>
  );
}

/** Nút gửi form: cao 48, bo 14, bóng đỏ nhạt (`.login-submit`). */
export function AuthSubmit({ title, busy, onPress }: { title: string; busy: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Button
      title={title}
      icon={busy ? undefined : 'arrow'}
      loading={busy}
      onPress={onPress}
      style={[styles.submit, { boxShadow: `0 5px 12px ${alpha(theme.primary, 0.18)}` }]}
    />
  );
}

/** Dòng "Chưa có tài khoản? Đăng ký ngay" dưới form. */
export function SwitchLink({ question, action, onPress }: { question: string; action: string; onPress: () => void }) {
  return (
    <AppText variant="caption" color="muted" center style={styles.switch}>
      {question}{' '}
      <AppText variant="caption" weight="600" color="primary" onPress={onPress}>
        {action}
      </AppText>
    </AppText>
  );
}

/** Chế độ khách: dùng thử cả app không cần tài khoản. */
export function GuestEntry() {
  return (
    <AppText variant="caption" color="muted" center style={styles.guest}>
      Chưa muốn đăng ký?{' '}
      <AppText variant="caption" weight="600" onPress={() => router.dismissTo('/')}>
        Vào học ở chế độ khách
      </AppText>
    </AppText>
  );
}

/** Thay nội dung cần tài khoản ở màn khách vào được (vd tab Ôn tập). */
export function SignInPrompt({ title, description }: { title: string; description: string }) {
  return (
    <EmptyState title={title} description={description}>
      <View style={styles.buttons}>
        <Button title="Tạo tài khoản" onPress={() => router.push('/register')} />
        <Button title="Đăng nhập" variant="secondary" onPress={() => router.push('/login')} />
      </View>
    </EmptyState>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { flexGrow: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mark: { width: 36, height: 36, borderRadius: 10 },
  brandName: { fontSize: 17, lineHeight: 24, letterSpacing: -0.4 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  lang: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  langText: { letterSpacing: 1 },
  mascotWrap: { alignItems: 'center', minHeight: 100 },
  // Web là video cáo trong khung tròn mờ viền; app dùng ảnh cáo cùng bộ.
  mascot: { width: 100, height: 100, borderRadius: 50, overflow: 'hidden' },
  mascotImage: { width: 100, height: 100 },
  card: {
    marginHorizontal: 16,
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 18,
    padding: 20,
    boxShadow: '0 25px 60px -15px rgba(0,0,0,0.18), 0 10px 25px -10px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.05)',
  },
  sectionLabel: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  sectionLabelText: { letterSpacing: 0.6 },
  title: { fontSize: 24, lineHeight: 30, letterSpacing: -0.6 },
  subtitle: { marginTop: 10, lineHeight: 24 },
  subtitleCompact: { marginTop: 6, fontSize: 13, lineHeight: 20 },
  submit: { minHeight: 48, borderRadius: 14 },
  switch: { marginTop: 14, lineHeight: 24 },
  guest: { marginTop: 4, lineHeight: 24 },
  buttons: { alignSelf: 'stretch', gap: 8 },
});
