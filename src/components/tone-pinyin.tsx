import { StyleSheet, Text, View } from 'react-native';

import { Fonts, ToneColors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Cỡ chữ Hán như web: `sm` text-lg, `md` text-2xl, `lg` text-3xl. */
const SIZES = { sm: 18, md: 24, lg: 30 } as const;

/** Thanh điệu của 1 âm tiết dạng số, vd "hao3" → "3". */
function toneOf(numSyllable: string): string {
  const m = /([1-5])(?!.*[1-5])/.exec(numSyllable);
  return m ? m[1] : '5';
}

/** Chữ Hán với pinyin tô màu theo thanh điệu nằm trên từng chữ (như `TonePinyin` của web). */
export function TonePinyin({
  zh,
  pinyin,
  pinyinNum,
  size = 'md',
}: {
  zh: string;
  pinyin: string;
  pinyinNum: string;
  size?: keyof typeof SIZES;
}) {
  const theme = useTheme();
  const chars = Array.from(zh);
  const marks = pinyin.trim().split(/\s+/);
  const nums = pinyinNum.trim().split(/\s+/);
  const fontSize = SIZES[size];

  return (
    <View style={styles.row}>
      {chars.map((ch, i) => {
        const isHan = /\p{Script=Han}/u.test(ch);
        const tone = isHan ? toneOf(nums[i] ?? '5') : '5';
        return (
          <View key={i} style={styles.cell}>
            <Text style={[styles.pinyin, { color: ToneColors[tone] ?? theme.muted }]}>
              {isHan ? (marks[i] ?? '') : ' '}
            </Text>
            <Text style={{ fontFamily: Fonts.hanzi, fontSize, lineHeight: Math.round(fontSize * 1.25), color: theme.text }}>
              {ch}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'flex-end', columnGap: 4, rowGap: 8 },
  cell: { alignItems: 'center' },
  pinyin: { marginBottom: 2, fontFamily: Fonts.sans, fontSize: 12, lineHeight: 14 },
});
