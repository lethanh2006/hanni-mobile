import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AppState, useColorScheme } from 'react-native';
import { SWRConfig, type SWRConfiguration } from 'swr';

import { StackHeader } from '@/components/app-shell/stack-header';
import { Colors, Fonts } from '@/constants/theme';
import { NotificationCenter } from '@/features/notifications/notification-center';
import { fetcher } from '@/lib/api';
import { AuthProvider, useAuth } from '@/lib/auth';
import { restoreThemeMode } from '@/lib/theme-mode';
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
    <ThemeProvider value={navTheme}>
      <SWRConfig value={swrConfig}>
        <AuthProvider>
          <HideSplashWhenReady />
          <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
          <NotificationCenter />
          <Stack
            screenOptions={{
              header: (props) => <StackHeader {...props} />,
              headerTitleStyle: { fontFamily: Fonts.sans, fontWeight: '600', fontSize: 16 },
              contentStyle: { backgroundColor: colors.background },
            }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
        </AuthProvider>
      </SWRConfig>
    </ThemeProvider>
  );
}

/** Giữ màn chờ tới khi biết đã đăng nhập hay chưa, để không nháy giao diện khách. */
function HideSplashWhenReady() {
  const { loading } = useAuth();
  useEffect(() => {
    if (!loading) void SplashScreen.hideAsync();
  }, [loading]);
  return null;
}
