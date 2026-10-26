import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ErrorNote, TextField } from '@/components/ui';
import { AuthShell, AuthSubmit, AuthTitle, GuestEntry, leaveAuth, SectionLabel, SwitchLink } from '@/features/auth/auth-parts';
import { api, errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { pendingWordCount, saveGuestProgress } from '@/lib/guest-progress';

function deviceTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Ho_Chi_Minh';
  } catch {
    return 'Asia/Ho_Chi_Minh';
  }
}

export default function RegisterScreen() {
  const { next } = useLocalSearchParams<{ next?: string }>();
  const { refresh } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const pendingWords = pendingWordCount();

  async function submit() {
    if (busy) return;
    if (!displayName || !email || !password) {
      setError('Điền đủ tên hiển thị, email và mật khẩu nhé.');
      return;
    }
    if (password.length < 8) {
      setError('Mật khẩu cần ít nhất 8 ký tự.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api.post('/auth/register', {
        displayName: displayName.trim(),
        email: email.trim(),
        password,
        timezone: deviceTimezone(),
      });
      await refresh();
      const { hasProgress } = await saveGuestProgress();
      // Đã học thử là đã rõ ý định — vào thẳng lộ trình. Chỉ người đăng ký
      // "tay trắng" mới qua khảo sát để chọn cấp.
      if (!next && !hasProgress) router.replace('/onboarding');
      else leaveAuth(next);
    } catch (err) {
      setError(errorMessage(err, 'Không đăng ký được. Bạn kiểm tra kết nối rồi thử lại nhé.'));
      setBusy(false);
    }
  }

  return (
    <AuthShell>
      <SectionLabel icon="spark">MỖI NGÀY MỘT CHÚT TIẾNG TRUNG</SectionLabel>
      <AuthTitle
        text="Bắt đầu cùng Hanni"
        mark="."
        subtitle={
          pendingWords > 0
            ? `${pendingWords} từ bạn vừa học sẽ được lưu ngay khi tạo tài khoản xong.`
            : 'Tạo tài khoản để lưu tiến độ và học theo nhịp của riêng bạn.'
        }
      />
      <View style={styles.form}>
        <TextField
          large
          label="Tên hiển thị"
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Tên bạn muốn được gọi"
          autoComplete="nickname"
        />
        <TextField
          large
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="Email của bạn"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
        <TextField
          large
          label="Mật khẩu"
          secure
          value={password}
          onChangeText={setPassword}
          placeholder="Mật khẩu (ít nhất 8 ký tự)"
          autoComplete="new-password"
          onSubmitEditing={submit}
        />
        {error && <ErrorNote>{error}</ErrorNote>}
        <AuthSubmit title={busy ? 'Đang tạo tài khoản…' : 'Đăng ký'} busy={busy} onPress={submit} />
      </View>
      <SwitchLink
        question="Đã có tài khoản?"
        action="Đăng nhập"
        onPress={() => router.replace({ pathname: '/login', params: next ? { next } : {} })}
      />
      <GuestEntry />
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  form: { marginTop: 16, gap: 20 },
});
