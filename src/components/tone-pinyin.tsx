import { StyleSheet, Text, View } from 'react-native';

import { ToneColors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const SIZES = { sm: 20, md: 28, lg: 44 } as const;

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
            <Text style={{ fontSize, lineHeight: fontSize * 1.25, color: theme.text }}>{ch}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  cell: { alignItems: 'center', paddingHorizontal: 1 },
  pinyin: { fontSize: 13, fontWeight: '600' },
});
