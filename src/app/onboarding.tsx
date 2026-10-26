import { Image } from 'expo-image';
import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Icon, Loading } from '@/components/ui';
import { alpha } from '@/constants/theme';
import { OnboardingResult } from '@/features/onboarding/onboarding-result';
import { OnboardingWizard, type ResultData } from '@/features/onboarding/onboarding-wizard';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth';
import { useOnboarding } from '@/lib/hooks';

/**
 * Khảo sát 3 câu (`/onboarding` của web) để chọn bài bắt đầu, lộ trình thi và mục tiêu ngày — làm được trước khi có
 * tài khoản. Khung riêng như web: thanh logo + "Đăng nhập"/"Bỏ qua", không dùng thanh tiêu đề chung.
 */
export default function OnboardingScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { user, loading } = useAuth();
  const saved = useOnboarding(Boolean(user));
  const [result, setResult] = useState<ResultData | null>(null);
  const [redo, setRedo] = useState(false);

  const shown = result ?? (redo ? null : (saved.data ?? null));

  return (
    <View
      style={[
        styles.shell,
        {
          backgroundColor: theme.background,
          backgroundImage: `radial-gradient(circle at 10% 12%, ${alpha(theme.primary, 0.07)}, transparent 448px), radial-gradient(circle at 92% 78%, ${alpha(theme.accent, 0.06)}, transparent 384px)`,
        },
      ]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.ring, styles.ringTop, { borderColor: alpha(theme.primary, 0.09) }]} pointerEvents="none" />
      <View style={[styles.ring, styles.ringBottom, { borderColor: alpha(theme.accent, 0.1) }]} pointerEvents="none" />
      <View
        style={[
          styles.topbar,
          { paddingTop: insets.top, borderColor: alpha(theme.border, 0.82), backgroundColor: alpha(theme.surface, 0.82) },
        ]}>
        <View style={styles.topbarInner}>
          <Pressable onPress={() => router.dismissTo('/')} accessibilityLabel="Về trang chủ Hanni" style={styles.brand}>
            <Image
              source={require('@/assets/images/fox-mark.png')}
              style={[styles.mark, { boxShadow: `0 5px 12px -8px ${alpha(theme.primary, 0.6)}` }]}
            />
            <AppText weight="800" style={styles.brandName}>
              Hanni
              <AppText weight="800" color="primary" style={styles.brandName}>
                .
              </AppText>
            </AppText>
          </Pressable>
          {user ? (
            <Pressable onPress={() => router.dismissTo('/')} style={styles.link}>
              <AppText variant="caption" weight="600" color="muted">
                Bỏ qua, làm sau
              </AppText>
              <Icon name="arrow" size={15} color="muted" />
            </Pressable>
          ) : (
            <Pressable onPress={() => router.push('/login')} style={styles.link}>
              <AppText variant="caption" weight="600" color="muted">
                Đã có tài khoản? Đăng nhập
              </AppText>
            </Pressable>
          )}
        </View>
      </View>
      <ScrollView contentContainerStyle={[styles.main, { paddingBottom: insets.bottom + 28 }]}>
        {loading || (user && saved.isLoading) ? (
          <Loading />
        ) : shown ? (
          <OnboardingResult
            data={shown}
            guest={!user}
            onRedo={() => {
              setResult(null);
              setRedo(true);
            }}
          />
        ) : (
          <OnboardingWizard loggedIn={Boolean(user)} onResult={setResult} />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, overflow: 'hidden' },
  ring: { position: 'absolute', borderWidth: 1, borderRadius: 999 },
  ringTop: { top: '16%', left: -160, width: 384, height: 384 },
  ringBottom: { right: -208, bottom: -176, width: 496, height: 496 },
  topbar: { borderBottomWidth: 1, zIndex: 2 },
  topbarInner: {
    minHeight: 60,
    marginHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 20,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mark: { width: 34, height: 34, borderRadius: 10 },
  brandName: { fontSize: 16, lineHeight: 22, letterSpacing: -0.5 },
  link: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 8,
  },
  main: { paddingHorizontal: 14, paddingTop: 20 },
});
