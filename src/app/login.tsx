import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, ErrorNote, TextField } from '@/components/ui';
import { AuthShell, AuthSubmit, AuthTitle, GuestEntry, leaveAuth, SectionLabel, SwitchLink } from '@/features/auth/auth-parts';
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
    if (busy) return;
    if (!email || !password) {
      setError('Nhập email và mật khẩu để đăng nhập nhé.');
      return;
    }
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
    <AuthShell>
      <SectionLabel icon="clock">MỖI NGÀY MỘT CHÚT TIẾNG TRUNG</SectionLabel>
      <AuthTitle
        text="Chào mừng bạn trở lại"
        mark="."
        subtitle="Góc học tập quen thuộc, những điều mới đang chờ."
      />
      <View style={styles.form}>
        <TextField
          large
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="ban@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
        <TextField
          large
          label="Mật khẩu"
          labelRight={
            <AppText variant="caption" weight="500" color="primary" onPress={() => router.push('/forgot-password')}>
              Quên mật khẩu?
            </AppText>
          }
          secure
          value={password}
          onChangeText={setPassword}
          placeholder="Nhập mật khẩu của bạn"
          autoComplete="current-password"
          onSubmitEditing={submit}
        />
        {error && <ErrorNote>{error}</ErrorNote>}
        <AuthSubmit title={busy ? 'Đang đăng nhập…' : 'Đăng nhập'} busy={busy} onPress={submit} />
      </View>
      <SwitchLink
        question="Chưa có tài khoản?"
        action="Đăng ký ngay"
        onPress={() => router.replace({ pathname: '/register', params: next ? { next } : {} })}
      />
      <GuestEntry />
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  form: { marginTop: 16, gap: 20 },
});
