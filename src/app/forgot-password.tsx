import { router, Stack } from 'expo-router';
import { useState } from 'react';

import { AppText, Button, Card, ErrorNote, Screen, TextField } from '@/components/ui';
import { AuthHeader } from '@/features/auth/auth-parts';
import { api, errorMessage } from '@/lib/api';

/** Gửi mail đặt lại mật khẩu. Liên kết trong mail mở trang đặt lại trên web Hanni. */
export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await api.post('/auth/forgot-password', { email: email.trim() });
      setSent(true);
    } catch (err) {
      setError(errorMessage(err, 'Không gửi được yêu cầu. Bạn kiểm tra lại email nhé.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Quên mật khẩu' }} />
      <AuthHeader title="Quên mật khẩu?" subtitle="Nhập email của bạn để nhận liên kết đặt lại mật khẩu." />
      {sent ? (
        <Card>
          <AppText>
            Nếu email tồn tại trong hệ thống, Hanni đã gửi liên kết đặt lại mật khẩu. Bạn hãy kiểm tra hộp thư (cả
            thư rác) nhé!
          </AppText>
          <Button title="Quay lại đăng nhập" variant="secondary" onPress={() => router.back()} />
        </Card>
      ) : (
        <>
          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="ban@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            onSubmitEditing={submit}
          />
          {error && <ErrorNote>{error}</ErrorNote>}
          <Button title="Gửi liên kết đặt lại" icon="arrow" loading={busy} disabled={!email} onPress={submit} />
        </>
      )}
    </Screen>
  );
}
