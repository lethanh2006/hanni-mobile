import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, EmptyState, TextLink } from '@/components/ui';
import { Spacing } from '@/constants/theme';

/** Chỉ nhận đường dẫn nội bộ, và không quay lại chính màn đăng nhập/đăng ký. */
export function nextPath(value: string | undefined): Href {
  if (!value || !value.startsWith('/') || /^\/(login|register|forgot-password)/.test(value)) {
    return '/';
  }
  return value as Href;
}

export function AuthHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.header}>
      <Image source={require('@/assets/images/fox-mark.png')} style={styles.fox} />
      <AppText variant="title">{title}</AppText>
      <AppText color="muted">{subtitle}</AppText>
    </View>
  );
}

/** Chế độ khách: dùng thử cả app không cần tài khoản. */
export function GuestEntry() {
  return (
    <View style={styles.row}>
      <AppText variant="small" color="muted">
        Chưa muốn đăng ký?
      </AppText>
      <TextLink title="Vào học ở chế độ khách" color="text" onPress={() => router.replace('/')} />
    </View>
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

export function SwitchLink({ question, action, onPress }: { question: string; action: string; onPress: () => void }) {
  return (
    <View style={styles.row}>
      <AppText variant="small" color="muted">
        {question}
      </AppText>
      <TextLink title={action} onPress={onPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { gap: Spacing.sm, marginBottom: Spacing.sm },
  fox: { width: 56, height: 56 },
  row: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 6 },
  buttons: { alignSelf: 'stretch', gap: Spacing.sm },
});
