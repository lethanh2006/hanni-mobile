import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText, Button } from '@/components/ui';
import { tintPanel } from '@/constants/theme';
import { startCourse } from '@/features/onboarding/start-course';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth';

/** Khối tô nhạt cuối trang ngữ pháp mời học bài đầu tiên (`/bat-dau` của web: khách vào bài 1, đã đăng nhập về lộ trình). */
export function LearnCta({ title, text }: { title: string; text: string }) {
  const theme = useTheme();
  const { user } = useAuth();
  return (
    <View style={[styles.panel, tintPanel(theme)]}>
      <AppText weight="700" center style={styles.title}>
        {title}
      </AppText>
      <AppText color="muted" center style={styles.text}>
        {text}
      </AppText>
      <Button
        title="Học bài đầu tiên — không cần đăng ký"
        icon="arrow"
        onPress={() => (user ? router.navigate('/') : void startCourse(1, false))}
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { borderWidth: 1, borderRadius: 16, padding: 24, alignItems: 'center' },
  title: { fontSize: 18, lineHeight: 26, letterSpacing: -0.4 },
  text: { marginTop: 8, lineHeight: 24 },
  button: { marginTop: 16 },
});
