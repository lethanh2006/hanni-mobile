import { router } from 'expo-router';
import { useState } from 'react';

import { AppText, Button, Card, ErrorNote, TextField } from '@/components/ui';
import { api, errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';

const CONFIRM_WORD = 'XÓA';

/** Xoá vĩnh viễn tài khoản: phải gõ đúng chữ "XÓA" (+ mật khẩu nếu có) mới bấm được. */
export function DangerZone({ hasPassword }: { hasPassword: boolean }) {
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canSubmit = confirmText.trim().toUpperCase() === CONFIRM_WORD && (!hasPassword || password.length > 0);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await api.del('/users/me', hasPassword ? { password } : undefined);
      await logout();
      router.dismissTo('/');
    } catch (err) {
      setError(errorMessage(err, 'Chưa xoá được tài khoản.'));
      setBusy(false);
    }
  }

  return (
    <Card>
      <AppText bold color="danger">
        Vùng nguy hiểm
      </AppText>
      <AppText variant="small" color="muted">
        Xoá tài khoản sẽ xoá vĩnh viễn toàn bộ tiến độ học và dữ liệu cá nhân — không thể khôi phục.
      </AppText>
      {!open ? (
        <Button title="Xoá tài khoản" icon="trash" variant="danger" onPress={() => setOpen(true)} />
      ) : (
        <>
          {hasPassword && (
            <TextField label="Nhập mật khẩu để xác nhận" secure value={password} onChangeText={setPassword} />
          )}
          <TextField
            label={`Gõ "${CONFIRM_WORD}" để xác nhận`}
            value={confirmText}
            onChangeText={setConfirmText}
            placeholder={CONFIRM_WORD}
            autoCapitalize="characters"
          />
          {error && <ErrorNote>{error}</ErrorNote>}
          <Button title="Xoá vĩnh viễn" variant="danger" loading={busy} disabled={!canSubmit} onPress={submit} />
          <Button title="Huỷ" variant="ghost" onPress={() => setOpen(false)} />
        </>
      )}
    </Card>
  );
}
