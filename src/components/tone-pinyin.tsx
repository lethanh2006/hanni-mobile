import { Pressable, StyleSheet, Text, View } from 'react-native';

import { alpha, Fonts, ToneColors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { LineToken } from '@/lib/types';

/** Cỡ chữ Hán như web: `sm` text-lg, `md` text-2xl, `lg` text-3xl. */
const SIZES = { sm: 18, md: 24, lg: 30 } as const;

/** Thanh điệu của 1 âm tiết dạng số, vd "hao3" → "3". */
function toneOf(numSyllable: string): string {
  const m = /([1-5])(?!.*[1-5])/.exec(numSyllable);
  return m ? m[1] : '5';
}

/**
 * Chữ Hán với pinyin tô màu theo thanh điệu nằm trên từng chữ (như `TonePinyin` của web). Có `tokens` (server tách sẵn
 * theo từ vựng thật — bản chép video) thì nhóm chữ theo từ; từ khớp từ điển gạch chân chấm, bấm được (`onWordClick`).
 */
export function TonePinyin({
  zh,
  pinyin,
  pinyinNum,
  size = 'md',
  tokens,
  onWordClick,
  align = 'center',
}: {
  zh: string;
  pinyin: string;
  pinyinNum: string;
  size?: keyof typeof SIZES;
  tokens?: LineToken[];
  onWordClick?: (token: LineToken) => void;
  align?: 'center' | 'start';
}) {
  const theme = useTheme();
  const chars = Array.from(zh);
  const marks = pinyin.trim().split(/\s+/);
  const nums = pinyinNum.trim().split(/\s+/);
  const fontSize = SIZES[size];
  const underline = { textDecorationLine: 'underline', textDecorationStyle: 'dotted', textDecorationColor: alpha(theme.primary, 0.4) } as const;

  function renderChar(ch: string, i: number, linked = false) {
    const isHan = /\p{Script=Han}/u.test(ch);
    const tone = isHan ? toneOf(nums[i] ?? '5') : '5';
    return (
      <View key={i} style={styles.cell}>
        <Text style={[styles.pinyin, { color: isHan ? (ToneColors[tone] ?? theme.muted) : 'transparent' }, linked && underline]}>
          {isHan ? (marks[i] ?? '') : '·'}
        </Text>
        <Text
          style={[
            { fontFamily: Fonts.hanzi, fontSize, lineHeight: Math.round(fontSize * 1.25), color: theme.text },
            linked && underline,
          ]}>
          {ch}
        </Text>
      </View>
    );
  }

  const row = [styles.row, align === 'start' && styles.start];
  if (!tokens) return <View style={row}>{chars.map((ch, i) => renderChar(ch, i))}</View>;

  const starts = tokens.reduce<number[]>((acc, _t, i) => {
    acc.push(i > 0 ? acc[i - 1] + Array.from(tokens[i - 1].text).length : 0);
    return acc;
  }, []);
  return (
    <View style={row}>
      {tokens.map((token, ti) => {
        const start = starts[ti];
        const tokenChars = Array.from(token.text);
        const linked = Boolean(token.word && onWordClick);
        const content = tokenChars.map((ch, j) => renderChar(ch, start + j, linked));
        if (!linked) {
          return (
            <View key={ti} style={styles.group}>
              {content}
            </View>
          );
        }
        return (
          <Pressable
            key={ti}
            onPress={() => onWordClick?.(token)}
            accessibilityRole="button"
            style={({ pressed }) => [styles.group, styles.word, pressed && { backgroundColor: alpha(theme.primary, 0.08) }]}>
            {content}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'flex-end', columnGap: 4, rowGap: 8 },
  start: { justifyContent: 'flex-start' },
  group: { flexDirection: 'row', alignItems: 'flex-end', columnGap: 4 },
  word: { borderRadius: 6 },
  cell: { alignItems: 'center' },
  pinyin: { marginBottom: 2, fontFamily: Fonts.sans, fontSize: 12, lineHeight: 14 },
});
