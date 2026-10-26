import { StyleSheet, Text, View, type StyleProp, type TextStyle } from 'react-native';

import { Fonts, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Ruby } from '@/lib/types';

/** Chữ Hán (kiểu `.hanzi`), pinyin nằm TRÊN từng chữ như đề HSK 1–2 in. Tắt pinyin thì chỉ còn chữ. */
export function RubyText({
  ruby,
  pinyin,
  size = 20,
  color = 'text',
  style,
}: {
  ruby: Ruby;
  pinyin: boolean;
  size?: number;
  color?: ThemeColor;
  style?: StyleProp<TextStyle>;
}) {
  const theme = useTheme();
  const text = { fontFamily: Fonts.hanzi, fontSize: size, lineHeight: Math.round(size * 1.45), color: theme[color] };
  if (!pinyin) return <Text style={[text, style]}>{ruby.zh}</Text>;
  return (
    <View style={styles.row}>
      {Array.from(ruby.zh).map((c, i) => (
        <View key={i} style={styles.cell}>
          <Text style={[styles.py, { color: theme.muted, fontSize: Math.round(size * 0.5) }]}>{ruby.py[i] || ' '}</Text>
          <Text style={[text, style]}>{c}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end' },
  cell: { alignItems: 'center', marginHorizontal: 1 },
  py: { fontFamily: Fonts.sans, lineHeight: 14 },
});
