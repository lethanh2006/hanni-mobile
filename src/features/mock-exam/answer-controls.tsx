import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText, Icon } from '@/components/ui';
import { alpha } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { MockAnswer, MockReviewItem } from '@/lib/types';

import { LETTERS } from './labels';

export type OptState = 'idle' | 'picked' | 'right' | 'wrong' | 'dim';

/** Trạng thái 1 phương án. Lúc làm bài, phương án đã chọn màu TRUNG TÍNH — tô đỏ trông như báo sai. */
export function optionState(value: MockAnswer, given: MockAnswer | null, review?: MockReviewItem): OptState {
  if (!review) return given === value ? 'picked' : 'idle';
  if (value === review.answer) return 'right';
  if (value === review.given) return 'wrong';
  return 'dim';
}

/** Ô phương án bấm được; `onPress` vắng mặt = chế độ chữa bài (chỉ xem). */
export function OptionBox({
  state,
  onPress,
  children,
  style,
}: {
  state: OptState;
  onPress?: () => void;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const look = {
    idle: { borderColor: theme.border, backgroundColor: theme.surface },
    picked: { borderColor: theme.text, backgroundColor: alpha(theme.text, 0.1) },
    right: { borderColor: theme.good, backgroundColor: alpha(theme.good, 0.1) },
    wrong: { borderColor: theme.danger, backgroundColor: alpha(theme.danger, 0.1) },
    dim: { borderColor: theme.border, backgroundColor: theme.surface, opacity: 0.6 },
  }[state];
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: state === 'picked' }}
      style={({ pressed }) => [
        styles.option,
        look,
        state === 'idle' && pressed && { borderColor: alpha(theme.primary, 0.4), backgroundColor: alpha(theme.primary, 0.05) },
        style,
      ]}>
      {children}
    </Pressable>
  );
}

/** Ô cỡ chữ/khung tranh theo `size` của web: sm 56px (bảng dùng chung), md 80px, lg 96px. */
const TILE = {
  sm: { height: 56, minWidth: 64, font: 30 },
  md: { height: 80, minWidth: 96, font: 36 },
  lg: { height: 96, minWidth: 112, font: 48 },
} as const;

/** Tranh của đề là emoji (đề Hanni không dùng ảnh). */
export function PictureTile({ emoji, label, size = 'md' }: { emoji: string; label?: string; size?: keyof typeof TILE }) {
  const theme = useTheme();
  const t = TILE[size];
  return (
    <View style={styles.picture}>
      <View style={[styles.pictureBox, { height: t.height, minWidth: t.minWidth, backgroundColor: theme.surface2 }]}>
        <Text style={{ fontSize: t.font, lineHeight: Math.round(t.font * 1.15) }}>{emoji}</Text>
      </View>
      {label && (
        <AppText variant="caption" color="muted" center style={styles.pictureLabel}>
          {label}
        </AppText>
      )}
    </View>
  );
}

/** Màu chữ trong ô theo trạng thái (đúng xanh, sai đỏ). */
export function letterColor(state: OptState) {
  return state === 'right' ? 'good' : state === 'wrong' ? 'danger' : 'text';
}

/** Hàng chữ A–F để chọn phương án trong bảng dùng chung của cả phần. */
export function LetterRow({
  count,
  given,
  review,
  onChange,
}: {
  count: number;
  given: MockAnswer | null;
  review?: MockReviewItem;
  onChange?: (v: MockAnswer) => void;
}) {
  return (
    <View style={styles.row}>
      {LETTERS.slice(0, count).map((l, i) => (
        <OptionBox
          key={l}
          state={optionState(i, given, review)}
          onPress={onChange && (() => onChange(i))}
          style={styles.letter}>
          <AppText weight="700" color={letterColor(optionState(i, given, review))}>
            {l}
          </AppText>
        </OptionBox>
      ))}
    </View>
  );
}

/** ✓ / ✗ — đối chiếu tranh hoặc xét câu ★. */
export function JudgeButtons({
  given,
  review,
  onChange,
}: {
  given: MockAnswer | null;
  review?: MockReviewItem;
  onChange?: (v: MockAnswer) => void;
}) {
  return (
    <View style={styles.row}>
      {[true, false].map((v) => (
        <OptionBox
          key={String(v)}
          state={optionState(v, given, review)}
          onPress={onChange && (() => onChange(v))}
          style={styles.judge}>
          <Icon name={v ? 'check' : 'close'} size={20} color={letterColor(optionState(v, given, review))} />
        </OptionBox>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  option: { borderWidth: 2, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  letter: { width: 36, height: 36 },
  judge: { width: 64, height: 44 },
  picture: { alignItems: 'center', gap: 4 },
  pictureBox: { borderRadius: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  pictureLabel: { maxWidth: 112 },
});
