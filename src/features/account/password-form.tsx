import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, ErrorNote, TextField } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { api, errorMessage } from '@/lib/api';

/** Đổi mật khẩu; tài khoản đăng nhập bằng Google chưa có mật khẩu thì đặt mới. */
export function PasswordForm({ hasPassword, onChanged }: { hasPassword: boolean; onChanged: () => void }) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit() {
    setError(null);
    if (next.length < 8) return setError('Mật khẩu mới cần ít nhất 8 ký tự.');
    if (next !== confirm) return setError('Hai ô mật khẩu mới không khớp.');
    setBusy(true);
    try {
      await api.post('/users/me/password', { currentPassword: hasPassword ? current : undefined, newPassword: next });
      setDone(true);
      setOpen(false);
      setCurrent('');
      setNext('');
      setConfirm('');
      onChanged();
    } catch (err) {
      setError(errorMessage(err, 'Chưa đổi được mật khẩu.'));
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <View style={styles.wrap}>
        <Button title={hasPassword ? 'Đổi mật khẩu' : 'Đặt mật khẩu'} icon="lock" variant="secondary" onPress={() => setOpen(true)} />
        {done && (
          <AppText variant="small" color="good">
            ✓ Đã cập nhật mật khẩu.
          </AppText>
        )}
      </View>
    );
  }
  return (
    <View style={styles.wrap}>
      {hasPassword && (
        <TextField label="Mật khẩu hiện tại" secure value={current} onChangeText={setCurrent} autoComplete="current-password" />
      )}
      <TextField label="Mật khẩu mới" secure value={next} onChangeText={setNext} autoComplete="new-password" />
      <TextField label="Nhập lại mật khẩu mới" secure value={confirm} onChangeText={setConfirm} autoComplete="new-password" />
      {error && <ErrorNote>{error}</ErrorNote>}
      <View style={styles.row}>
        <Button title="Lưu mật khẩu" loading={busy} onPress={submit} style={styles.flex} />
        <Button title="Huỷ" variant="ghost" onPress={() => setOpen(false)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.md },
  row: { flexDirection: 'row', gap: Spacing.sm },
  flex: { flex: 1 },
});
