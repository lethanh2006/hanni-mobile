import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, ChipRow, Icon } from '@/components/ui';
import { alpha } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { UserSettings } from '@/lib/types';

import { SettingCard } from './setting-card';

const SCHEDULERS: { value: UserSettings['srsScheduler']; title: string; description: string }[] = [
  { value: 'sm2', title: 'Tiêu chuẩn', description: 'Ôn tập theo mức độ ghi nhớ sau mỗi lượt học.' },
  { value: 'fsrs', title: 'Linh hoạt', description: 'Điều chỉnh lịch ôn theo tỷ lệ nhớ bạn mong muốn.' },
];

const RETENTIONS = [0.8, 0.85, 0.9, 0.95].map((v) => ({ value: v, label: `${Math.round(v * 100)}%` }));

/** "Cách sắp lịch ôn" (`/settings` của web): 2 thẻ chọn có dấu tick tròn; "Linh hoạt" thì chọn tỷ lệ ghi nhớ. */
export function SchedulerSection({
  form,
  update,
}: {
  form: UserSettings;
  update: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void;
}) {
  const theme = useTheme();
  return (
    <SettingCard
      icon="refresh"
      title="Cách sắp lịch ôn"
      description={'Gặp lại từ vựng vào thời điểm phù hợp. Không chắc chọn gì thì cứ để "Tiêu chuẩn" — đổi lúc nào cũng được, tiến độ đã học không mất.'}>
      <View style={styles.options}>
        {SCHEDULERS.map((o) => {
          const active = form.srsScheduler === o.value;
          return (
            <Pressable
              key={o.value}
              onPress={() => update('srsScheduler', o.value)}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
              style={({ pressed }) => [
                styles.option,
                active
                  ? { borderColor: alpha(theme.primary, 0.35), backgroundColor: alpha(theme.primary, 0.05) }
                  : { borderColor: theme.border, backgroundColor: pressed ? theme.surface2 : 'transparent' },
              ]}>
              <View style={styles.optionHead}>
                <AppText weight="600">{o.title}</AppText>
                <View
                  style={[
                    styles.radio,
                    active ? { borderColor: theme.primary, backgroundColor: theme.primary } : { borderColor: theme.border },
                  ]}>
                  {active && <Icon name="check" size={12} color="primaryText" />}
                </View>
              </View>
              <AppText variant="caption" color="muted" style={styles.optionText}>
                {o.description}
              </AppText>
            </Pressable>
          );
        })}
      </View>
      {form.srsScheduler === 'fsrs' && (
        <View>
          <View style={styles.retention}>
            <AppText>Tỷ lệ ghi nhớ mong muốn</AppText>
            <AppText weight="700" color="primary">
              {Math.round(form.targetRetention * 100)}%
            </AppText>
          </View>
          <ChipRow
            options={RETENTIONS}
            value={RETENTIONS.reduce((best, r) =>
              Math.abs(r.value - form.targetRetention) < Math.abs(best.value - form.targetRetention) ? r : best,
            ).value}
            onChange={(v) => update('targetRetention', v)}
          />
          <AppText variant="caption" color="muted" style={styles.optionText}>
            Tỷ lệ càng cao, bạn sẽ gặp lại từ thường xuyên hơn.
          </AppText>
        </View>
      )}
    </SettingCard>
  );
}

const styles = StyleSheet.create({
  options: { gap: 12 },
  option: { borderWidth: 1, borderRadius: 12, padding: 16 },
  optionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  optionText: { marginTop: 8, lineHeight: 20 },
  retention: { marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between' },
});
