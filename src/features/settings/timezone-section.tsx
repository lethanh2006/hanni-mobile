import { StyleSheet, View } from 'react-native';

import { AppText, Button, Select } from '@/components/ui';
import { TIMEZONES } from '@/lib/timezones';

import { SettingCard } from './setting-card';

/** Múi giờ của máy (`Intl`), chỉ nhận nếu có trong danh sách. */
function detectTimezone(): string | null {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return TIMEZONES.some((t) => t.value === tz) ? tz : null;
  } catch {
    return null;
  }
}

/** "Múi giờ học tập" (`/settings` của web): ô chọn múi giờ + nút "Tự phát hiện". */
export function TimezoneSection({ value, onChange }: { value: string; onChange: (tz: string) => void }) {
  return (
    <SettingCard icon="clock" title="Múi giờ học tập" description="Dùng để tính ngày học và chuỗi ngày liên tiếp.">
      <View style={styles.wrap}>
        <AppText weight="500">Múi giờ của bạn</AppText>
        <Select
          title="Múi giờ của bạn"
          value={value}
          options={TIMEZONES.map((t) => ({ value: t.value, label: `${t.label} — ${t.value}` }))}
          onChange={onChange}
        />
        <Button
          title="Tự phát hiện"
          variant="secondary"
          onPress={() => {
            const tz = detectTimezone();
            if (tz) onChange(tz);
          }}
          style={styles.self}
        />
      </View>
    </SettingCard>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  self: { alignSelf: 'flex-start' },
});
