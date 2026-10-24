import { StyleSheet, View } from 'react-native';

import { AppText, Card, ChipRow, SectionTitle, TextField } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import type { UserSettings } from '@/lib/types';

/** Ô nhập số nguyên; để trống = `null`. */
function toNumber(text: string): number | null {
  const n = Number.parseInt(text.replace(/\D/g, ''), 10);
  return Number.isNaN(n) ? null : n;
}

/** Mục tiêu mỗi ngày (theo số từ ôn hoặc số phút), số từ mới mỗi ngày, giới hạn lượt ôn. */
export function GoalSection({
  form,
  update,
}: {
  form: UserSettings;
  update: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void;
}) {
  return (
    <Card>
      <SectionTitle title="Mục tiêu hằng ngày" />
      <ChipRow<UserSettings['dailyGoalType']>
        options={[
          { value: 'WORDS', label: 'Theo số từ ôn' },
          { value: 'MINUTES', label: 'Theo số phút' },
        ]}
        value={form.dailyGoalType}
        onChange={(v) => update('dailyGoalType', v)}
      />
      <View style={styles.fields}>
        <TextField
          label={`Mục tiêu mỗi ngày (${form.dailyGoalType === 'WORDS' ? 'từ' : 'phút'})`}
          keyboardType="number-pad"
          value={String(form.dailyGoalValue || '')}
          onChangeText={(t) => update('dailyGoalValue', toNumber(t) ?? 0)}
        />
        <TextField
          label="Số từ mới mỗi ngày"
          keyboardType="number-pad"
          value={String(form.newCardsPerDay)}
          onChangeText={(t) => update('newCardsPerDay', toNumber(t) ?? 0)}
        />
        <AppText variant="caption" color="muted">
          Đặt bằng 0 nếu bạn chỉ muốn ôn từ đã học.
        </AppText>
        <TextField
          label="Giới hạn số lượt ôn mỗi ngày (tuỳ chọn)"
          keyboardType="number-pad"
          placeholder="Không giới hạn"
          value={form.maxReviewsPerDay === null ? '' : String(form.maxReviewsPerDay)}
          onChangeText={(t) => update('maxReviewsPerDay', toNumber(t))}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  fields: { gap: Spacing.sm },
});
