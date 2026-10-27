import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, Card, ErrorNote, Icon, IconTile, Select } from '@/components/ui';
import { alpha } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { disableReminders, enableReminders, permissionBlocked, remindersEnabled, remindersSupported, sendTestReminder } from '@/lib/reminders';

const reminderLabel = (h: number) => `${String(h).padStart(2, '0')}:00`;
/** Ô chọn chỉ nhận số — dùng -1 cho "Không nhắc". */
const OFF = -1;
const HOUR_OPTIONS = [{ value: OFF, label: 'Không nhắc' }, ...Array.from({ length: 24 }, (_, h) => ({ value: h, label: reminderLabel(h) }))];

/**
 * "Thông báo nhắc học" (`NotificationCard` của web): Bật thông báo → xin quyền; đã bật thì Gửi thử, Tắt thông báo và ô
 * chọn giờ nhắc mỗi ngày (lưu ở server, dùng chung với web). App tự đặt lịch nhắc trên máy (`lib/reminders.ts`).
 */
export function NotificationCard({
  reminderHour,
  onChangeReminderHour,
  onSubscribed,
}: {
  reminderHour: number | null;
  onChangeReminderHour: (hour: number | null) => Promise<void>;
  /** Bật xong mà chưa có giờ nhắc thì đặt giờ mặc định (như server làm khi bật thông báo trên web). */
  onSubscribed: () => Promise<void>;
}) {
  const theme = useTheme();
  const [subscribed, setSubscribed] = useState<boolean | null>(null);
  const [busy, setBusy] = useState<'subscribe' | 'unsubscribe' | 'test' | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [reminderBusy, setReminderBusy] = useState(false);
  const [reminderSaved, setReminderSaved] = useState(false);

  useEffect(() => {
    if (!remindersSupported) return;
    // Đã bật trên máy này nhưng sau đó tắt quyền trong Cài đặt của máy thì coi như chưa bật.
    void permissionBlocked().then((blocked) => setSubscribed(remindersEnabled() && !blocked));
  }, []);

  if (!remindersSupported) return null;

  async function saveReminderHour(hour: number | null) {
    setReminderBusy(true);
    setReminderSaved(false);
    setError('');
    try {
      await onChangeReminderHour(hour);
      setReminderSaved(true);
    } catch {
      setError('Chưa lưu được giờ nhắc học. Vui lòng thử lại.');
    } finally {
      setReminderBusy(false);
    }
  }

  async function enable() {
    if (busy) return;
    setBusy('subscribe');
    setError('');
    setMessage('');
    try {
      await enableReminders();
      setSubscribed(true);
      await onSubscribed();
      setMessage('Đã bật thông báo trên thiết bị này. Hanni sẽ nhắc bạn học mỗi ngày — đổi giờ hoặc tắt nhắc ở ngay bên dưới.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chưa bật được thông báo. Vui lòng thử lại.');
    } finally {
      setBusy(null);
    }
  }

  async function disable() {
    if (busy) return;
    setBusy('unsubscribe');
    setError('');
    setMessage('');
    try {
      await disableReminders();
      setSubscribed(false);
      setMessage('Đã tắt thông báo trên thiết bị này.');
    } catch {
      setError('Chưa tắt được thông báo. Vui lòng thử lại.');
    } finally {
      setBusy(null);
    }
  }

  async function test() {
    if (busy) return;
    setBusy('test');
    setError('');
    setMessage('');
    try {
      await sendTestReminder();
      setMessage('Đã gửi thông báo thử — kiểm tra trên thiết bị của bạn.');
    } catch {
      setError('Chưa gửi được thông báo thử. Vui lòng thử lại.');
    } finally {
      setBusy(null);
    }
  }

  const inner = [styles.inner, { borderColor: theme.border, backgroundColor: alpha(theme.surface2, 0.5) }];

  return (
    <Card style={styles.card}>
      <View style={styles.head}>
        <IconTile icon="bell" iconSize={21} />
        <View style={styles.flex}>
          <AppText variant="heading" weight="600">
            Thông báo nhắc học
          </AppText>
          <AppText color="muted" style={styles.desc}>
            Nhận thông báo ngay trên thiết bị khi có bài ôn tới hạn.
          </AppText>
        </View>
      </View>
      <View style={inner}>
        {subscribed === null ? (
          <AppText color="muted">Đang kiểm tra trạng thái thông báo…</AppText>
        ) : subscribed ? (
          <View style={styles.row}>
            <View style={styles.on}>
              <Icon name="check" size={18} color="good" />
              <AppText weight="600" color="good">
                Đã bật thông báo trên thiết bị này.
              </AppText>
            </View>
            <Button title={busy === 'test' ? 'Đang gửi…' : 'Gửi thử'} variant="secondary" disabled={busy !== null} onPress={() => void test()} />
            <Button
              title={busy === 'unsubscribe' ? 'Đang tắt…' : 'Tắt thông báo'}
              variant="secondary"
              disabled={busy !== null}
              onPress={() => void disable()}
            />
          </View>
        ) : (
          <Button
            title={busy === 'subscribe' ? 'Đang bật…' : 'Bật thông báo'}
            leftIcon="bell"
            disabled={busy !== null}
            onPress={() => void enable()}
            style={styles.self}
          />
        )}
      </View>
      {subscribed && (
        <View style={inner}>
          <AppText weight="500">Giờ nhắc học mỗi ngày</AppText>
          <AppText variant="caption" color="muted" style={styles.hint}>
            Hanni sẽ gửi thông báo đúng giờ này (theo múi giờ học tập của bạn) vào những ngày bạn chưa đạt mục tiêu.
          </AppText>
          <View style={styles.hourRow}>
            <Select
              value={reminderHour ?? OFF}
              title="Giờ nhắc học mỗi ngày"
              options={HOUR_OPTIONS}
              onChange={(v) => void saveReminderHour(v === OFF ? null : v)}
              style={[styles.hour, reminderBusy && styles.faded]}
            />
            {reminderSaved && (
              <View style={styles.saved}>
                <Icon name="check" size={16} color="good" />
                <AppText color="good">Đã lưu</AppText>
              </View>
            )}
          </View>
        </View>
      )}
      {message ? (
        <View style={[styles.message, { backgroundColor: alpha(theme.good, 0.08) }]}>
          <AppText color="good" style={styles.messageText}>
            {message}
          </AppText>
        </View>
      ) : null}
      {error ? <ErrorNote>{error}</ErrorNote> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 20 },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  flex: { flex: 1, minWidth: 0 },
  desc: { marginTop: 4, lineHeight: 24 },
  inner: { borderWidth: 1, borderRadius: 16, padding: 20 },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12 },
  on: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  self: { alignSelf: 'flex-start' },
  hint: { marginTop: 4, lineHeight: 20 },
  hourRow: { marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12 },
  hour: { minWidth: 140 },
  faded: { opacity: 0.6 },
  saved: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  message: { borderRadius: 12, padding: 12 },
  messageText: { lineHeight: 24 },
});
