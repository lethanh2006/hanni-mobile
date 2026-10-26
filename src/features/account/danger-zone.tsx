import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Button, Card, ErrorNote, Icon, TextField } from '@/components/ui';
import { alpha } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api, errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';

const CONFIRM_WORD = 'XÓA';

/** "Vùng nguy hiểm" (`DangerZone` của web): xoá vĩnh viễn tài khoản — gõ đúng "XÓA" (+ mật khẩu nếu có) mới bấm được. */
export function DangerZone({ hasPassword }: { hasPassword: boolean }) {
  const theme = useTheme();
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canSubmit = confirmText.trim().toUpperCase() === CONFIRM_WORD && (!hasPassword || password.length > 0);

  async function submit() {
    if (!canSubmit || busy) return;
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
    <Card style={[styles.card, { borderColor: alpha(theme.danger, 0.2) }]}>
      <View style={styles.head}>
        <View style={[styles.tile, { backgroundColor: alpha(theme.danger, 0.1), borderColor: theme.border }]}>
          <Icon name="trash" size={20} color="danger" />
        </View>
        <View style={styles.flex}>
          <AppText weight="600" color="danger">
            Vùng nguy hiểm
          </AppText>
          <AppText color="muted" style={styles.desc}>
            Xoá tài khoản sẽ xoá vĩnh viễn toàn bộ tiến độ học và dữ liệu cá nhân — không thể khôi phục.
          </AppText>
        </View>
      </View>
      {!open ? (
        <Pressable
          onPress={() => setOpen(true)}
          style={({ pressed }) => [
            styles.delete,
            {
              borderColor: theme.border,
              backgroundColor: pressed ? theme.surface2 : theme.surface,
              boxShadow: `0 ${pressed ? 1 : 3}px 0 ${theme.border}`,
            },
          ]}>
          <Icon name="trash" size={16} color="danger" />
          <AppText weight="600" color="danger">
            Xoá tài khoản
          </AppText>
        </Pressable>
      ) : (
        <View style={styles.form}>
          {hasPassword && <TextField label="Nhập mật khẩu để xác nhận" secure value={password} onChangeText={setPassword} />}
          <TextField
            label={`Gõ "${CONFIRM_WORD}" để xác nhận`}
            value={confirmText}
            onChangeText={setConfirmText}
            placeholder={CONFIRM_WORD}
            autoCapitalize="characters"
          />
          {error && <ErrorNote>{error}</ErrorNote>}
          <View style={styles.row}>
            <Pressable
              disabled={!canSubmit || busy}
              onPress={() => void submit()}
              style={[styles.confirm, { backgroundColor: theme.danger, opacity: !canSubmit || busy ? 0.5 : 1 }]}>
              <AppText weight="700" style={styles.white}>
                {busy ? 'Đang xoá…' : 'Xoá vĩnh viễn'}
              </AppText>
            </Pressable>
            <Button
              title="Huỷ"
              variant="ghost"
              disabled={busy}
              onPress={() => {
                setOpen(false);
                setError(null);
                setPassword('');
                setConfirmText('');
              }}
            />
          </View>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 0 },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  tile: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1, minWidth: 0 },
  desc: { marginTop: 4, lineHeight: 24 },
  delete: {
    marginTop: 20,
    alignSelf: 'flex-start',
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 18,
  },
  form: { marginTop: 20, gap: 12 },
  row: { flexDirection: 'row', gap: 12 },
  confirm: { minHeight: 44, borderRadius: 12, paddingHorizontal: 18, justifyContent: 'center' },
  white: { color: '#ffffff' },
});
