import { Stack } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';
import useSWR from 'swr';

import { AppText, Button, Card, ErrorNote, Loading, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { GoalSection } from '@/features/settings/goal-section';
import { SchedulerSection } from '@/features/settings/scheduler-section';
import { TimezoneSection } from '@/features/settings/timezone-section';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';
import { useRequireAuth } from '@/lib/auth';
import type { Me, UserSettings } from '@/lib/types';

/** Cài đặt học tập: mục tiêu mỗi ngày, cách xếp lịch ôn, múi giờ, email tổng kết tuần. */
export default function SettingsScreen() {
  const { user, refresh } = useRequireAuth();
  const { data, error, mutate } = useSWR<UserSettings>(user ? '/users/me/settings' : null);

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Cài đặt học tập' }} />
      {error && !data ? (
        <>
          <ErrorNote>Chưa tải được cài đặt.</ErrorNote>
          <Button title="Thử lại" variant="secondary" onPress={() => void mutate()} />
        </>
      ) : !user || !data ? (
        <Loading />
      ) : (
        <SettingsForm
          key={user.id}
          user={user}
          initial={data}
          onSaved={async (next) => {
            await mutate(next, { revalidate: false });
            await refresh();
          }}
        />
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
        <Card>
          <View style={styles.row}>
            <View style={styles.flex}>
              <AppText bold>Email tổng kết tuần</AppText>
              <AppText variant="caption" color="muted">
                Mỗi tuần 1 email: số từ đã học, chuỗi ngày, việc nên làm tuần tới.
              </AppText>
            </View>
            <Switch
              value={form.weeklyDigestEnabled}
              onValueChange={(v) => update('weeklyDigestEnabled', v)}
              trackColor={{ true: theme.primary }}
            />
          </View>
        </Card>
      )}
      {error && <ErrorNote>{error}</ErrorNote>}
      {saved && (
        <AppText variant="small" color="good">
          ✓ Đã lưu cài đặt.
        </AppText>
      )}
      <Button title="Lưu cài đặt" loading={saving} onPress={save} />
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  flex: { flex: 1 },
});
