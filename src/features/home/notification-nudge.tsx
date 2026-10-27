import Storage from 'expo-sqlite/kv-store';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import useSWR from 'swr';

import { AppText, Button, Icon } from '@/components/ui';
import { alpha, tintPanel } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { enableReminders, permissionBlocked, remindersEnabled, remindersSupported } from '@/lib/reminders';
import type { UserSettings } from '@/lib/types';

const DISMISS_KEY = 'hanni-push-nudge-dismissed';

function dismissed() {
  try {
    return Storage.getItemSync(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * Dải mời bật thông báo ở Trang chủ (`NotificationNudge` của web) — chỉ hiện sau khi đã học hôm nay. Không tự xin quyền
 * khi vừa vào: máy nhớ lựa chọn, bị từ chối một lần là mất cơ hội — để người dùng bấm. Tự ẩn khi đã bật, đã bị từ chối
 * hẳn, hoặc đã bấm "Để sau". (Web còn hứa báo giải đấu tuần, bài tập lớp — server chưa gửi được tới app nên không ghi.)
 */
export function NotificationNudge() {
  const theme = useTheme();
  const { refresh } = useAuth();
  const settings = useSWR<UserSettings>('/users/me/settings');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!remindersSupported || remindersEnabled() || dismissed()) return;
    void permissionBlocked().then((blocked) => setShow(!blocked));
  }, []);

  if (!show) return null;

  if (done)
    return (
      <View style={[styles.done, tintPanel(theme, theme.surface, 0)]}>
        <Icon name="check" size={18} color="good" />
        <AppText style={styles.flex}>Đã bật thông báo — Hanni sẽ nhắc bạn học mỗi ngày.</AppText>
      </View>
    );

  function dismiss() {
    try {
      Storage.setItemSync(DISMISS_KEY, '1');
    } catch {
      // không lưu được thì chỉ ẩn trong lần mở này
    }
    setShow(false);
  }

  async function enable() {
    setBusy(true);
    try {
      await enableReminders();
      // Như server làm khi bật thông báo trên web: chưa có giờ nhắc thì đặt giờ mặc định.
      if (settings.data && settings.data.reminderHour === null) {
        const next = await api.patch<UserSettings>('/users/me/settings', { reminderHour: 20 });
        await settings.mutate(next, { revalidate: false });
        await refresh();
      }
      setDone(true);
    } catch {
      // Bị từ chối hoặc lỗi — ẩn đi, không nài thêm.
      dismiss();
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={[styles.panel, tintPanel(theme)]}>
      <View style={styles.row}>
        <View style={[styles.icon, { backgroundColor: alpha(theme.primary, 0.12) }]}>
          <Icon name="flame" size={22} color="primary" />
        </View>
        <View style={styles.flex}>
          <AppText weight="600">Đừng để mất chuỗi ngày học</AppText>
          <AppText variant="caption" color="muted" style={styles.text}>
            Bật thông báo để Hanni nhắc bạn học mỗi ngày — giữ chuỗi ngày đúng giờ bạn chọn.
          </AppText>
        </View>
      </View>
      <View style={styles.buttons}>
        <Button title={busy ? 'Đang bật…' : 'Bật thông báo'} disabled={busy} onPress={() => void enable()} style={styles.flex} />
        <Button title="Để sau" variant="ghost" onPress={dismiss} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  panel: { borderWidth: 1, borderRadius: 16, padding: 20, gap: 16 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
  icon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  text: { marginTop: 4, lineHeight: 20 },
  buttons: { flexDirection: 'row', gap: 8 },
  done: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 16, padding: 16 },
});
