import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Icon, type IconName } from '@/components/ui';
import { alpha, mix } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import type { Option } from './options';

/** Viền/nền/bóng của ô đang chọn (`.choiceActive`, `.goalActive`, `.levelActive` của web). */
function useActiveLook() {
  const theme = useTheme();
  return (active: boolean, pressed: boolean) =>
    active
      ? {
          borderColor: mix(theme.primary, theme.border, 0.54),
          backgroundColor: mix(theme.primary, theme.surface, 0.08),
          boxShadow: `0 8px 20px -15px ${alpha(theme.primary, 0.6)}, inset 0 0 0 1px ${alpha(theme.primary, 0.17)}`,
        }
      : pressed
        ? { borderColor: mix(theme.primary, theme.border, 0.32), backgroundColor: mix(theme.primary, theme.surface, 0.03) }
        : { borderColor: theme.border, backgroundColor: theme.surface };
}

/** Đầu câu hỏi: ô biểu tượng đỏ nhạt 42px + nhãn mục đích viết hoa + câu hỏi + 1 câu giải thích. */
export function QuestionHeading({
  icon,
  eyebrow,
  title,
  description,
}: {
  icon: IconName;
  eyebrow: string;
  title: string;
  description: string;
}) {
  const theme = useTheme();
  return (
    <View style={styles.heading}>
      <View
        style={[
          styles.headingIcon,
          { borderColor: mix(theme.primary, theme.border, 0.18), backgroundColor: mix(theme.primary, theme.surface, 0.08) },
        ]}>
        <Icon name={icon} size={20} color="primary" />
      </View>
      <View style={styles.flex}>
        <AppText weight="700" color="muted" style={styles.eyebrow}>
          {eyebrow.toUpperCase()}
        </AppText>
        <AppText weight="700" style={styles.title}>
          {title}
        </AppText>
        <AppText color="muted" style={styles.description}>
          {description}
        </AppText>
      </View>
    </View>
  );
}

/** Thẻ chọn 1 (`ChoiceButton` của web): ô biểu tượng, tiêu đề + mô tả, vòng tick tròn bên phải. */
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
  const theme = useTheme();
  const look = useActiveLook();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [styles.choice, look(active, pressed)]}>
      <View
        style={[styles.choiceIcon, { backgroundColor: active ? mix(theme.primary, theme.surface, 0.14) : theme.surface2 }]}>
        <Icon name={icon} size={18} color={active ? 'primary' : 'muted'} />
      </View>
      <View style={styles.flex}>
        <AppText weight="700" color={active ? 'primary' : 'text'} style={styles.choiceTitle}>
          {title}
        </AppText>
        <AppText variant="caption" color="muted" style={styles.choiceText}>
          {description}
        </AppText>
      </View>
      <View
        style={[
          styles.check,
          active ? { borderColor: theme.primary, backgroundColor: theme.primary } : { borderColor: theme.border },
        ]}>
        {active && <Icon name="check" size={13} color="primaryText" />}
      </View>
    </Pressable>
  );
}

/** Thẻ mục tiêu (`goalCard` của web, 1 cột ở điện thoại): ô biểu tượng 32px bên trái, tên + gợi ý. */
export function GoalCard({
  icon,
  label,
  hint,
  active,
  onPress,
}: {
  icon: IconName;
  label: string;
  hint: string;
  active: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const look = useActiveLook();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [styles.goal, look(active, pressed)]}>
      <View style={[styles.goalIcon, { backgroundColor: active ? mix(theme.primary, theme.surface, 0.14) : theme.surface2 }]}>
        <Icon name={icon} size={17} color={active ? 'primary' : 'muted'} />
      </View>
      <View style={styles.flex}>
        <AppText variant="caption" weight="700" color={active ? 'primary' : 'text'} style={styles.goalLabel}>
          {label}
        </AppText>
        <AppText variant="caption" color="muted">
          {hint}
        </AppText>
      </View>
    </Pressable>
  );
}

/** Lưới 4 cột nút chọn 1 (cấp HSK, thời điểm thi, số phút mỗi ngày). */
export function OptionGrid({
  options,
  value,
  onChange,
}: {
  options: Option[];
  value: number | null;
  onChange: (value: number) => void;
}) {
  const theme = useTheme();
  const look = useActiveLook();
  const rows: Option[][] = [];
  for (let i = 0; i < options.length; i += 4) rows.push(options.slice(i, i + 4));
  return (
    <View style={styles.grid}>
      {rows.map((row) => (
        <View key={row[0].value} style={styles.gridRow}>
          {row.map((o) => {
            const active = value === o.value;
            return (
              <Pressable
                key={o.value}
                onPress={() => onChange(o.value)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={({ pressed }) => [styles.option, look(active, pressed)]}>
                <AppText weight="700" color={active ? 'primary' : 'text'} numberOfLines={1} style={styles.optionLabel}>
                  {o.label}
                </AppText>
                <AppText
                  variant="caption"
                  numberOfLines={1}
                  style={{ color: active ? mix(theme.primary, theme.muted, 0.75) : theme.muted }}>
                  {o.hint}
                </AppText>
              </Pressable>
            );
          })}
          {Array.from({ length: 4 - row.length }, (_, i) => (
            <View key={`gap-${i}`} style={styles.flex} />
          ))}
        </View>
      ))}
    </View>
  );
}

/** Câu hỏi phụ dưới lựa chọn ("Bạn đang học cấp nào?"). */
export function SubQuestion({ children }: { children: string }) {
  return (
    <AppText variant="caption" weight="600" color="muted" style={styles.sub}>
      {children}
    </AppText>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  heading: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 25 },
  headingIcon: { width: 42, height: 42, borderWidth: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { marginTop: 1, marginBottom: 5, fontSize: 12, lineHeight: 16, letterSpacing: 1.7 },
  title: { fontSize: 20, lineHeight: 25, letterSpacing: -0.8 },
  description: { marginTop: 8, fontSize: 13, lineHeight: 21 },
  choice: {
    minHeight: 74,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    borderWidth: 1,
    borderRadius: 17,
    paddingHorizontal: 15,
    paddingVertical: 14,
  },
  choiceIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  choiceTitle: { fontSize: 13, lineHeight: 18 },
  choiceText: { marginTop: 3, lineHeight: 17 },
  check: { width: 20, height: 20, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  goal: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  goalIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  goalLabel: { lineHeight: 17 },
  grid: { gap: 7 },
  gridRow: { flexDirection: 'row', gap: 7 },
  option: {
    flex: 1,
    minWidth: 0,
    minHeight: 54,
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 13,
    paddingHorizontal: 8,
    paddingVertical: 9,
  },
  optionLabel: { fontSize: 12, lineHeight: 16 },
  sub: { marginTop: 24, marginBottom: 11 },
});
