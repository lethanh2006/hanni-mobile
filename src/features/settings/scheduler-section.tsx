import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Card, ChipRow, Icon, SectionTitle } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { UserSettings } from '@/lib/types';

const SCHEDULERS: { value: UserSettings['srsScheduler']; title: string; description: string }[] = [
  { value: 'sm2', title: 'Tiêu chuẩn', description: 'Ôn tập theo mức độ ghi nhớ sau mỗi lượt học.' },
  { value: 'fsrs', title: 'Linh hoạt', description: 'Điều chỉnh lịch ôn theo tỷ lệ nhớ bạn mong muốn.' },
];

const RETENTIONS = [0.8, 0.85, 0.9, 0.95].map((v) => ({ value: v, label: `${Math.round(v * 100)}%` }));

/** Cách sắp lịch ôn. Không chắc thì để "Tiêu chuẩn" — đổi lúc nào cũng được, tiến độ không mất. */
export function SchedulerSection({
  form,
  update,
}: {
  form: UserSettings;
  update: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void;
}) {
  const theme = useTheme();
  return (
    <Card>
      <SectionTitle title="Cách sắp lịch ôn" />
      <AppText variant="small" color="muted">
        Không chắc chọn gì thì cứ để “Tiêu chuẩn” — đổi lúc nào cũng được, tiến độ đã học không mất.
      </AppText>
      {SCHEDULERS.map((o) => {
        const active = form.srsScheduler === o.value;
        return (
          <Pressable
            key={o.value}
            onPress={() => update('srsScheduler', o.value)}
            accessibilityRole="radio"
            accessibilityState={{ checked: active }}
            style={[
              styles.option,
              active
                ? { borderColor: theme.primary, backgroundColor: theme.primarySoft }
                : { borderColor: theme.border },
            ]}>
            <View style={styles.flex}>
              <AppText bold>{o.title}</AppText>
              <AppText variant="caption" color="muted">
                {o.description}
              </AppText>
            </View>
            {active && <Icon name="check" size={18} color="primary" />}
          </Pressable>
        );
      })}
      {form.srsScheduler === 'fsrs' && (
        <>
          <AppText variant="small" bold>
            Tỷ lệ ghi nhớ mong muốn — càng cao càng gặp lại từ thường xuyên
          </AppText>
          <ChipRow
            options={RETENTIONS}
            value={RETENTIONS.reduce((best, r) =>
              Math.abs(r.value - form.targetRetention) < Math.abs(best.value - form.targetRetention) ? r : best,
            ).value}
            onChange={(v) => update('targetRetention', v)}
          />
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  option: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, borderWidth: 1.5, borderRadius: Radius.md, padding: Spacing.md },
  flex: { flex: 1 },
});
