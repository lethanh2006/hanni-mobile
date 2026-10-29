import { DarkTheme, DefaultTheme, Stack, ThemeProvider, router, useRootNavigationState } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AppState, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SWRConfig, type SWRConfiguration } from 'swr';

import { StackHeader } from '@/components/app-shell/stack-header';
import { Colors, Fonts } from '@/constants/theme';
import { AssistantWidget } from '@/features/assistant/assistant-widget';
import { NotificationCenter } from '@/features/notifications/notification-center';
import { ReminderSync } from '@/features/reminders/reminder-sync';
import { recoverScanPicker } from '@/features/scan/pending-image';
import { AudioDecoderHost } from '@/features/tone/decode-audio';
import { fetcher } from '@/lib/api';
import { AuthProvider, useAuth } from '@/lib/auth';
import { restoreThemeMode, useColorScheme } from '@/lib/theme-mode';
import { loadWebFonts } from '@/lib/web-fonts';

SplashScreen.preventAutoHideAsync();
restoreThemeMode();
loadWebFonts();

/** SWR trên điện thoại: "trang được focus" = app quay lại từ nền. */
const swrConfig: SWRConfiguration = {
  fetcher,
  isVisible: () => true,
  initFocus(callback) {
    let current = AppState.currentState;
    const sub = AppState.addEventListener('change', (next) => {
      if (current !== 'active' && next === 'active') callback();
      current = next;
    });
    return () => sub.remove();
  },
};

export default function RootLayout() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const colors = Colors[scheme];
  const navTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
    },
  };

  return (
    // Gốc cho gesture-handler (ô viết tay nhận nét ngay cả khi nằm trong khung cuộn).
    <GestureHandlerRootView style={styles.root}>
      <ThemeProvider value={navTheme}>
        <SWRConfig value={swrConfig}>
          <AuthProvider>
            <HideSplashWhenReady />
            <RecoverScanPicker />
            <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
            <NotificationCenter />
            <ReminderSync />
            <Stack
              screenOptions={{
                header: (props) => <StackHeader {...props} />,
                headerTitleStyle: { fontFamily: Fonts.sans, fontWeight: '600', fontSize: 16 },
                contentStyle: { backgroundColor: colors.background },
              }}>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            </Stack>
            {/* Nổi trên mọi màn như bong bóng trợ lý trong khung app của web. */}
            <AssistantWidget />
            {/* WebView ẩn giải mã ghi âm chuẩn để chấm thanh điệu (chỉ mở khi cần). */}
            <AudioDecoderHost />
          </AuthProvider>
        </SWRConfig>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });

/** Giữ màn chờ tới khi biết đã đăng nhập hay chưa, để không nháy giao diện khách. */
function HideSplashWhenReady() {
  const { loading } = useAuth();
  useEffect(() => {
    if (!loading) void SplashScreen.hideAsync();
  }, [loading]);
  return null;
}

function RecoverScanPicker() {
  const { loading } = useAuth();
  const navigation = useRootNavigationState();
  useEffect(() => {
    if (loading || !navigation?.key) return;
    let active = true;
    void recoverScanPicker().then((found) => {
      if (active && found) router.replace('/tu-dien/quet');
    });
    return () => { active = false; };
  }, [loading, navigation?.key]);
  return null;
}
