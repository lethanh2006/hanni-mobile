import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Button, Icon } from '@/components/ui';
import { alpha } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
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

/**
 * "Múi giờ học tập" (`/settings` của web): ô chọn múi giờ (web là `<select>`, app là ô bấm mở danh sách) +
 * nút "Tự phát hiện". Dùng để tính ngày học và chuỗi ngày liên tiếp.
 */
export function TimezoneSection({ value, onChange }: { value: string; onChange: (tz: string) => void }) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const current = TIMEZONES.find((t) => t.value === value);
  return (
    <SettingCard icon="clock" title="Múi giờ học tập" description="Dùng để tính ngày học và chuỗi ngày liên tiếp.">
      <View style={styles.wrap}>
        <AppText weight="500">Múi giờ của bạn</AppText>
        <Pressable
          onPress={() => setOpen(!open)}
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          style={[
            styles.select,
            { borderColor: open ? theme.primary : alpha(theme.border, 0.8), backgroundColor: theme.surface },
          ]}>
          <AppText numberOfLines={1} style={styles.flex}>
            {current ? `${current.label} — ${current.value}` : value || 'Chọn múi giờ'}
          </AppText>
          <View style={{ transform: [{ rotate: open ? '-90deg' : '90deg' }] }}>
            <Icon name="chevron" size={16} color="muted" />
          </View>
        </Pressable>
        {open && (
          <View style={[styles.list, { borderColor: theme.border, backgroundColor: theme.surface }]}>
            {TIMEZONES.map((t, i) => (
              <Pressable
                key={t.value}
                onPress={() => {
                  onChange(t.value);
                  setOpen(false);
                }}
                style={({ pressed }) => [
                  styles.item,
                  i > 0 && { borderTopWidth: 1, borderColor: theme.border },
                  pressed && { backgroundColor: theme.surface2 },
                ]}>
                <AppText color={t.value === value ? 'primary' : 'text'} style={styles.flex}>
                  {t.label} — {t.value}
                </AppText>
                {t.value === value && <Icon name="check" size={16} color="primary" />}
              </Pressable>
            ))}
          </View>
        )}
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
  select: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  flex: { flex: 1, minWidth: 0 },
  list: { borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
  item: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 12 },
  self: { alignSelf: 'flex-start' },
});
