import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Icon, type IconName } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import type { Option } from './options';

function useSelectedLook(active: boolean) {
  const theme = useTheme();
  return active
    ? { borderColor: theme.primary, backgroundColor: theme.primarySoft }
    : { borderColor: theme.border, backgroundColor: theme.surface };
}

export function QuestionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <View style={styles.heading}>
      <AppText variant="label" color="muted">
        {eyebrow}
      </AppText>
      <AppText variant="title">{title}</AppText>
      <AppText variant="small" color="muted">
        {description}
      </AppText>
    </View>
  );
}

/** Thẻ chọn 1 có biểu tượng, tiêu đề và 1 dòng giải thích. */
export function ChoiceCard({
  icon,
  title,
  description,
  active,
  onPress,
}: {
  icon: IconName;
  title: string;
  description: string;
  active: boolean;
  onPress: () => void;
}) {
  const look = useSelectedLook(active);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: active }}
      style={[styles.card, look]}>
      <Icon name={icon} size={20} color={active ? 'primary' : 'muted'} />
      <View style={styles.flex}>
        <AppText bold>{title}</AppText>
        <AppText variant="small" color="muted">
          {description}
        </AppText>
      </View>
      {active && <Icon name="check" size={16} color="primary" />}
    </Pressable>
  );
}

/** Lưới nút chọn 1 (cấp HSK, thời điểm thi, số phút mỗi ngày), 2 nút mỗi hàng. */
export function OptionGrid({
  options,
  value,
  onChange,
}: {
  options: Option[];
  value: number | null;
  onChange: (value: number) => void;
}) {
  return (
    <View style={styles.grid}>
      {options.map((o) => (
        <OptionButton key={o.value} option={o} active={value === o.value} onPress={() => onChange(o.value)} />
      ))}
    </View>
  );
}

function OptionButton({ option, active, onPress }: { option: Option; active: boolean; onPress: () => void }) {
  const look = useSelectedLook(active);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: active }}
      style={[styles.option, look]}>
      <AppText bold color={active ? 'primary' : 'text'}>
        {option.label}
      </AppText>
      <AppText variant="caption" color="muted">
        {option.hint}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  heading: { gap: 4 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 1.5,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  option: {
    flexBasis: '48%',
    flexGrow: 1,
    borderWidth: 1.5,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
});
