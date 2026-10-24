import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { AppText, Card, Icon, SectionTitle, TextLink } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { TIMEZONES } from '@/lib/timezones';

/** Múi giờ dùng để tính ngày học và chuỗi ngày liên tiếp. Danh sách gập lại cho gọn. */
export function TimezoneSection({ value, onChange }: { value: string; onChange: (tz: string) => void }) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const current = TIMEZONES.find((t) => t.value === value)?.label ?? value;

  return (
    <Card>
      <SectionTitle title="Múi giờ học tập" />
      <AppText variant="small" color="muted">
        Dùng để tính ngày học và chuỗi ngày liên tiếp.
      </AppText>
      <AppText bold>{current}</AppText>
      <TextLink title={open ? 'Thu gọn' : 'Đổi múi giờ'} onPress={() => setOpen(!open)} />
      {open &&
        TIMEZONES.map((t) => (
          <Pressable
            key={t.value}
            onPress={() => {
              onChange(t.value);
              setOpen(false);
            }}
            style={[styles.row, { borderColor: theme.border }]}>
            <AppText variant="small" style={styles.flex} color={t.value === value ? 'primary' : 'text'}>
              {t.label}
            </AppText>
            {t.value === value && <Icon name="check" size={16} color="primary" />}
          </Pressable>
        ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, borderTopWidth: 1 },
  flex: { flex: 1 },
});
