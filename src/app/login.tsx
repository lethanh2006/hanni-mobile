import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, ErrorNote, Screen, TextField, TextLink } from '@/components/ui';
import { AuthHeader, GuestEntry, leaveAuth, SwitchLink } from '@/features/auth/auth-parts';
import { api, errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { saveGuestProgress } from '@/lib/guest-progress';

export default function LoginScreen() {
  const { next } = useLocalSearchParams<{ next?: string }>();
  const { refresh } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!email || !password || busy) return;
    setBusy(true);
    setError(null);
    try {
      await api.post('/auth/login', { email: email.trim(), password });
      await refresh();
      // Khách đã học bài/làm đề rồi mới đăng nhập thì tiến độ đó vẫn phải được lưu.
      await saveGuestProgress();
      leaveAuth(next);
    } catch (err) {
      setError(errorMessage(err, 'Chưa đăng nhập được. Bạn kiểm tra kết nối rồi thử lại nhé.'));
      setBusy(false);
    }
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Đăng nhập' }} />
      <AuthHeader title="Chào mừng bạn trở lại." subtitle="Góc học tập quen thuộc, những điều mới đang chờ." />
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="ban@email.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />
      <TextField
        label="Mật khẩu"
        secure
        value={password}
        onChangeText={setPassword}
        placeholder="Nhập mật khẩu của bạn"
        autoComplete="current-password"
        onSubmitEditing={submit}
      />
      <View style={styles.forgot}>
        <TextLink title="Quên mật khẩu?" onPress={() => router.push('/forgot-password')} />
      </View>
      {error && <ErrorNote>{error}</ErrorNote>}
      <Button
        title={busy ? 'Đang đăng nhập…' : 'Đăng nhập'}
        icon="arrow"
        loading={busy}
        disabled={!email || !password}
        onPress={submit}
      />
      <SwitchLink
        question="Chưa có tài khoản?"
        action="Đăng ký ngay"
        onPress={() => router.replace({ pathname: '/register', params: next ? { next } : {} })}
      />
      <GuestEntry />
    </Screen>
  );
}

const styles = StyleSheet.create({
  forgot: { alignItems: 'flex-end' },
});
