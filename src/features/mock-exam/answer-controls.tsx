import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText, Icon } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
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
    picked: { borderColor: theme.text, backgroundColor: theme.surface2 },
    right: { borderColor: theme.good, backgroundColor: theme.goodSoft },
    wrong: { borderColor: theme.danger, backgroundColor: theme.dangerSoft },
    dim: { borderColor: theme.border, backgroundColor: theme.surface, opacity: 0.6 },
  }[state];
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: state === 'picked' }}
      style={[styles.option, look, style]}>
      {children}
    </Pressable>
  );
}

/** Tranh của đề là emoji (đề Hanni không dùng ảnh). */
export function PictureTile({ emoji, label, big = false }: { emoji: string; label?: string; big?: boolean }) {
  const theme = useTheme();
  return (
    <View style={styles.picture}>
      <View style={[styles.pictureBox, big && styles.pictureBig, { backgroundColor: theme.surface2 }]}>
        <Text style={{ fontSize: big ? 44 : 32 }}>{emoji}</Text>
      </View>
      {label && (
        <AppText variant="caption" color="muted" center>
          {label}
        </AppText>
      )}
    </View>
  );
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
          <AppText bold>{l}</AppText>
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
          <Icon name={v ? 'check' : 'close'} size={20} />
        </OptionBox>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  option: { borderWidth: 2, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  letter: { width: 42, height: 42 },
  judge: { width: 64, height: 44 },
  picture: { alignItems: 'center', gap: 4 },
  pictureBox: { minWidth: 72, height: 64, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  pictureBig: { minWidth: 96, height: 88 },
});
