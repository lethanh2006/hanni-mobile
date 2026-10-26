import { StyleSheet, View } from 'react-native';

import { AppText, TextField } from '@/components/ui';
import type { UserSettings } from '@/lib/types';

import { ChoiceButton, SettingCard } from './setting-card';

/** Ô nhập số nguyên; để trống = `null`. */
function toNumber(text: string): number | null {
  const n = Number.parseInt(text.replace(/\D/g, ''), 10);
  return Number.isNaN(n) ? null : n;
}

/** "Mục tiêu hằng ngày" (`/settings` của web): theo số từ ôn hoặc số phút, số từ mới mỗi ngày, giới hạn lượt ôn. */
export function GoalSection({
  form,
  update,
}: {
  form: UserSettings;
  update: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void;
}) {
  return (
    <SettingCard icon="target" title="Mục tiêu hằng ngày" description="Chọn nhịp học phù hợp với thời gian của bạn.">
      <View style={styles.choices}>
        <ChoiceButton
          label="Theo số từ ôn"
          icon="cards"
          active={form.dailyGoalType === 'WORDS'}
          onPress={() => update('dailyGoalType', 'WORDS')}
        />
        <ChoiceButton
          label="Theo số phút"
          icon="clock"
          active={form.dailyGoalType === 'MINUTES'}
          onPress={() => update('dailyGoalType', 'MINUTES')}
        />
      </View>
      <View style={styles.fields}>
        <TextField
          label={`Mục tiêu mỗi ngày (${form.dailyGoalType === 'WORDS' ? 'từ' : 'phút'})`}
          keyboardType="number-pad"
          value={String(form.dailyGoalValue || '')}
          onChangeText={(t) => update('dailyGoalValue', toNumber(t) ?? 0)}
        />
        <View>
          <TextField
            label="Số từ mới mỗi ngày"
            keyboardType="number-pad"
            value={String(form.newCardsPerDay)}
            onChangeText={(t) => update('newCardsPerDay', toNumber(t) ?? 0)}
          />
          <AppText variant="caption" color="muted" style={styles.hint}>
            Đặt bằng 0 nếu bạn chỉ muốn ôn từ đã học.
          </AppText>
        </View>
        <View>
          <TextField
            label="Giới hạn số lượt ôn mỗi ngày (tuỳ chọn)"
            keyboardType="number-pad"
            placeholder="Không giới hạn"
            value={form.maxReviewsPerDay === null ? '' : String(form.maxReviewsPerDay)}
            onChangeText={(t) => update('maxReviewsPerDay', toNumber(t))}
          />
          <AppText variant="caption" color="muted" style={styles.hint}>
            Để trống nếu không muốn giới hạn. Chỉ áp dụng cho lượt ôn từ đã học, không tính số từ mới ở trên.
          </AppText>
        </View>
      </View>
    </SettingCard>
  );
}

const styles = StyleSheet.create({
  choices: { flexDirection: 'row', gap: 12 },
  fields: { gap: 20 },
  hint: { marginTop: 8, lineHeight: 18 },
});
