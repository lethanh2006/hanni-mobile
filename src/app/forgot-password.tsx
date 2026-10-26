import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, ErrorNote, TextField } from '@/components/ui';
import { alpha } from '@/constants/theme';
import { AuthShell, AuthSubmit, AuthTitle, SwitchLink } from '@/features/auth/auth-parts';
import { useTheme } from '@/hooks/use-theme';
import { api, errorMessage } from '@/lib/api';

/** Gửi mail đặt lại mật khẩu. Liên kết trong mail mở trang đặt lại trên web Hanni. */
export default function ForgotPasswordScreen() {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (busy) return;
    if (!email) {
      setError('Nhập email của bạn trước nhé.');
      return;
    }
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
    <AuthShell>
      <AuthTitle
        text="Quên mật khẩu"
        mark="?"
        subtitle="Nhập email của bạn để nhận liên kết đặt lại mật khẩu."
        compact
      />
      {sent ? (
        <View style={[styles.sent, { borderColor: alpha(theme.primary, 0.2), backgroundColor: alpha(theme.primary, 0.05) }]}>
          <AppText style={styles.sentText}>
            Nếu email tồn tại trong hệ thống, Hanni đã gửi liên kết đặt lại mật khẩu. Bạn hãy kiểm tra hộp thư (cả
            thư rác) nhé!
          </AppText>
          <AppText weight="600" color="primary" style={styles.backLink} onPress={() => router.back()}>
            ← Quay lại đăng nhập
          </AppText>
        </View>
      ) : (
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
            onSubmitEditing={submit}
          />
          {error && <ErrorNote>{error}</ErrorNote>}
          <AuthSubmit title={busy ? 'Đang gửi…' : 'Gửi liên kết đặt lại'} busy={busy} onPress={submit} />
        </View>
      )}
      <SwitchLink question="Nhớ mật khẩu rồi?" action="Đăng nhập ngay" onPress={() => router.back()} />
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  form: { marginTop: 16, gap: 20 },
  sent: { marginTop: 28, borderWidth: 1, borderRadius: 12, padding: 16 },
  sentText: { lineHeight: 24 },
  backLink: { marginTop: 16 },
});
