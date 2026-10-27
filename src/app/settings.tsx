import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import useSWR from 'swr';

import { AppText, Avatar, Button, Card, ErrorNote, Icon, Loading, PageHeader, Screen } from '@/components/ui';
import { alpha } from '@/constants/theme';
import { CalendarReminder } from '@/features/settings/calendar-reminder';
import { GoalSection } from '@/features/settings/goal-section';
import { NotificationCard } from '@/features/settings/notification-card';
import { SchedulerSection } from '@/features/settings/scheduler-section';
import { ChoiceButton, SettingCard } from '@/features/settings/setting-card';
import { TimezoneSection } from '@/features/settings/timezone-section';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';
import { useRequireAuth } from '@/lib/auth';
import type { Me, UserSettings } from '@/lib/types';

/**
 * Cài đặt học tập (trang `/settings` của web): thông báo + giờ nhắc học, thêm lịch học vào lịch của máy, mục tiêu mỗi
 * ngày, cách xếp lịch ôn, múi giờ, email tổng kết tuần.
 */
export default function SettingsScreen() {
  const { user, refresh } = useRequireAuth();
  const { data, error, mutate } = useSWR<UserSettings>(user ? '/users/me/settings' : null);

  return (
    <Screen contentStyle={styles.page}>
      <Stack.Screen options={{ title: 'Cài đặt học tập' }} />
      <View style={styles.head}>
        <PageHeader
          icon="settings"
          tone="lavender"
          title="Cài đặt học tập"
          description="Mục tiêu mỗi ngày, giờ nhắc học, cách xếp lịch ôn."
        />
        <Pressable onPress={() => router.navigate('/account')} style={styles.back} hitSlop={6}>
          <Icon name="back" size={16} color="muted" />
          <AppText weight="500" color="muted">
            Tài khoản của tôi
          </AppText>
        </Pressable>
      </View>
      {error && !data ? (
        <>
          <ErrorNote>Chưa tải được cài đặt.</ErrorNote>
          <Button title="Thử lại" variant="secondary" onPress={() => void mutate()} />
        </>
      ) : !user || !data ? (
        <Loading />
      ) : (
        <>
          <Card style={styles.avatarCard}>
            <Avatar user={user} size={80} />
            <View style={styles.flex}>
              <AppText weight="600">{user.displayName}</AppText>
              <AppText color="muted">{user.email}</AppText>
            </View>
          </Card>
          <NotificationCard
            reminderHour={data.reminderHour}
            onChangeReminderHour={async (hour) => {
              const next = await api.patch<UserSettings>('/users/me/settings', { reminderHour: hour });
              await mutate(next, { revalidate: false });
              await refresh();
            }}
            onSubscribed={async () => {
              // Web: server tự đặt giờ nhắc mặc định khi bật thông báo — app đặt 20:00 (giờ mặc định của lịch học).
              if (data.reminderHour !== null) return;
              const next = await api.patch<UserSettings>('/users/me/settings', { reminderHour: 20 });
              await mutate(next, { revalidate: false });
              await refresh();
            }}
          />
          <CalendarReminder
            key={data.reminderHour ?? 'chua-dat'}
            defaultHour={data.reminderHour}
            minutes={data.dailyGoalType === 'MINUTES' ? Math.max(5, Math.round(data.dailyGoalValue)) : 15}
          />
          <SettingsForm
            key={user.id}
            user={user}
            initial={data}
            onSaved={async (next) => {
              await mutate(next, { revalidate: false });
              await refresh();
            }}
          />
        </>
      )}
    </Screen>
  );
}

function SettingsForm({
  user,
  initial,
  onSaved,
}: {
  user: Me;
  initial: UserSettings;
  onSaved: (next: UserSettings) => Promise<void>;
}) {
  const theme = useTheme();
  // Máy chủ email chưa cấu hình thì ẩn mục email tuần — không bày nút "Bật" không dẫn tới đâu.
  const mail = useSWR<{ configured: boolean }>('/mail/configured');
  const [form, setForm] = useState(initial);
  const [timezone, setTimezone] = useState(user.timezone);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof UserSettings>(key: K, value: UserSettings[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setSaved(false);
  }

  async function save() {
    setError(null);
    if (form.dailyGoalValue < 1) {
      setError('Mục tiêu mỗi ngày cần lớn hơn 0.');
      return;
    }
    setSaving(true);
    try {
      const next = await api.patch<UserSettings>('/users/me/settings', {
        dailyGoalType: form.dailyGoalType,
        dailyGoalValue: form.dailyGoalValue,
        newCardsPerDay: form.newCardsPerDay,
        maxReviewsPerDay: form.maxReviewsPerDay,
        srsScheduler: form.srsScheduler,
        targetRetention: form.targetRetention,
        weeklyDigestEnabled: form.weeklyDigestEnabled,
      });
      if (timezone !== user.timezone) await api.patch('/users/me', { timezone });
      setForm(next);
      await onSaved(next);
      setSaved(true);
    } catch {
      setError('Chưa lưu được đầy đủ thay đổi. Vui lòng kiểm tra kết nối và thử lại.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <View style={[styles.fields, saving && styles.saving]} pointerEvents={saving ? 'none' : 'auto'}>
        <GoalSection form={form} update={update} />
        <SchedulerSection form={form} update={update} />
        <TimezoneSection
          value={timezone}
          onChange={(tz) => {
            setTimezone(tz);
            setSaved(false);
          }}
        />
        {mail.data?.configured && (
          <SettingCard
            icon="message"
            title="Email tổng kết tuần"
            description="Mỗi thứ Hai, Hanni gửi email tóm tắt số ngày đã học, từ đã ôn/đã thuộc và chuỗi ngày hiện tại của bạn.">
            <View style={styles.choices}>
              <ChoiceButton label="Bật" icon="check" active={form.weeklyDigestEnabled} onPress={() => update('weeklyDigestEnabled', true)} />
              <ChoiceButton label="Tắt" icon="close" active={!form.weeklyDigestEnabled} onPress={() => update('weeklyDigestEnabled', false)} />
            </View>
          </SettingCard>
        )}
      </View>
      {error && <ErrorNote>{error}</ErrorNote>}
      <View style={[styles.saveRow, { borderColor: theme.border }]}>
        <Button title={saving ? 'Đang lưu…' : 'Lưu thay đổi'} leftIcon={saving ? 'refresh' : 'check'} disabled={saving} onPress={() => void save()} />
        {saved && (
          <View style={styles.saved}>
            <Icon name="check" size={16} color="good" />
            <AppText color="good">Đã lưu cài đặt của bạn</AppText>
          </View>
        )}
      </View>
      <Card style={[styles.tip, { borderColor: alpha(theme.primary, 0.15), backgroundColor: alpha(theme.primary, 0.05) }]}>
        <Icon name="spark" size={25} color="primary" />
        <AppText weight="600" style={styles.tipTitle}>
          Đều đặn là đủ tốt
        </AppText>
        <AppText color="muted" style={styles.tipText}>
          Bắt đầu với một mục tiêu nhỏ. Khi việc học đã trở thành thói quen, bạn có thể quay lại đây để tăng dần nhịp học.
        </AppText>
        <Pressable onPress={() => router.navigate('/progress')} style={styles.link} hitSlop={6}>
          <AppText weight="600" color="primary">
            Xem tiến độ của tôi
          </AppText>
          <Icon name="arrow" size={16} color="primary" />
        </Pressable>
      </Card>
      <AppText variant="caption" color="muted" style={styles.note}>
        Cài đặt được lưu vào tài khoản để áp dụng cho những lần học tiếp theo.
      </AppText>
    </>
  );
}

const styles = StyleSheet.create({
  page: { gap: 24 },
  head: { gap: 10 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start' },
  flex: { flex: 1, minWidth: 0 },
  avatarCard: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  fields: { gap: 20 },
  saving: { opacity: 0.7 },
  choices: { flexDirection: 'row', gap: 12 },
  saveRow: { borderTopWidth: 1, paddingTop: 20, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 16 },
  saved: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tip: { gap: 0 },
  tipTitle: { marginTop: 16 },
  tipText: { marginTop: 12, lineHeight: 24 },
  link: { marginTop: 20, flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start' },
  note: { paddingHorizontal: 8, lineHeight: 20 },
});
