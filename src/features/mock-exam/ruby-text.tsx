import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import type { Ruby } from '@/lib/types';

/** Chữ Hán, pinyin nằm TRÊN từng chữ như đề HSK 1–2 in. Tắt pinyin thì chỉ còn chữ. */
export function RubyText({ ruby, pinyin, size = 20 }: { ruby: Ruby; pinyin: boolean; size?: number }) {
  const theme = useTheme();
  const text = { fontSize: size, lineHeight: size * 1.35, color: theme.text };
  if (!pinyin) return <Text style={text}>{ruby.zh}</Text>;
  return (
    <View style={styles.row}>
      {Array.from(ruby.zh).map((c, i) => (
        <View key={i} style={styles.cell}>
          <Text style={[styles.py, { color: theme.muted, fontSize: size * 0.5 }]}>{ruby.py[i] || ' '}</Text>
          <Text style={text}>{c}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end' },
  cell: { alignItems: 'center', paddingHorizontal: 1 },
  py: { lineHeight: 14 },
});
