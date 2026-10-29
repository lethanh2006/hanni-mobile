import { File } from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, View } from 'react-native';

import { AppText, Avatar, Icon, TextLink } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { api, ApiError } from '@/lib/api';
import type { Me } from '@/lib/types';

/** Server nhận tối đa 2MB — thu về 512px như web (`resizeImage(file, 512)`) thì ảnh chụp điện thoại còn vài chục KB. */
const SIZE = 512;

/**
 * Ảnh đại diện bấm được để đổi (`AvatarEditor` của web): chọn ảnh (cắt vuông) → thu về 512px JPEG → `POST /users/me/avatar`
 * (field `file`); đã có ảnh thì có thêm "Xoá ảnh" → `DELETE /users/me/avatar`. Xong gọi `onChange` để nạp lại phiên.
 */
export function AvatarEditor({ user, size = 80, onChange }: { user: Me; size?: number; onChange: () => Promise<void> }) {
  const theme = useTheme();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function pick() {
    if (busy) return;
    setError('');
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Cần cấp quyền thư viện ảnh để đổi ảnh đại diện.');
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1] });
    const asset = picked.canceled ? undefined : picked.assets?.[0];
    if (!asset) return;
    setBusy(true);
    try {
      const small = await manipulateAsync(asset.uri, [{ resize: { width: SIZE } }], { compress: 0.85, format: SaveFormat.JPEG });
      const form = new FormData();
      if (Platform.OS === 'web') form.append('file', await (await fetch(small.uri)).blob(), 'avatar.jpg');
      // fetch của Expo không đọc được kiểu `{ uri, name, type }` của React Native — phải đưa File có `bytes()`.
      else form.append('file', new File(small.uri), 'avatar.jpg');
      await api.upload('/users/me/avatar', form);
      await onChange();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Tải ảnh thất bại, thử lại nhé.');
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await api.del('/users/me/avatar');
      await onChange();
    } catch {
      setError('Không xoá được ảnh, thử lại nhé.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={() => void pick()}
        disabled={busy}
        accessibilityRole="button"
        accessibilityLabel="Đổi ảnh đại diện"
        style={({ pressed }) => [styles.ring, { backgroundColor: theme.surface, opacity: pressed || busy ? 0.75 : 1 }]}>
        <Avatar user={user} size={size} />
        <View style={[styles.camera, { backgroundColor: theme.primary, borderColor: theme.surface }]}>
          {busy ? <ActivityIndicator size="small" color={theme.primaryText} /> : <Icon name="camera" size={14} color="primaryText" />}
        </View>
      </Pressable>
      {user.avatarUrl && !busy ? <TextLink title="Xoá ảnh" color="muted" size="caption" onPress={() => void remove()} /> : null}
      {error ? (
        <AppText variant="caption" color="danger" style={styles.error}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 2 },
  ring: { borderRadius: 999, padding: 3 },
  camera: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 28,
    height: 28,
    borderRadius: 999,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: { maxWidth: 200, textAlign: 'center' },
});
