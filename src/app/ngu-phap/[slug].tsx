import { Stack, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import useSWR from 'swr';

import { AppText, Card, EmptyState, Icon, Loading, Screen, SectionTitle } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { speakChinese } from '@/lib/audio';
import { hskLabel } from '@/lib/hsk';
import type { GrammarDetail } from '@/lib/types';

/** 1 điểm ngữ pháp: tên, mẫu câu, giải thích tiếng Việt từng đoạn, ví dụ có pinyin (bấm loa để nghe). */
export default function GrammarScreen() {
  const theme = useTheme();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { data: g, error } = useSWR<GrammarDetail>(`/grammar/${encodeURIComponent(slug)}`);

  if (error) {
    return (
      <Screen>
        <EmptyState title="Không mở được điểm ngữ pháp này" description="Bạn thử lại sau nhé." />
      </Screen>
    );
  }
  if (!g) {
    return (
      <Screen>
        <Loading />
      </Screen>
    );
  }

  const patterns = g.patterns ?? [];
  const examples = g.examples ?? [];
  return (
    <Screen>
      <Stack.Screen options={{ title: g.titleZh }} />
      <Card>
        <AppText variant="caption" bold color="primary">
          {hskLabel(g.hskLevel)}
        </AppText>
        <AppText variant="title">{g.titleVi}</AppText>
        <AppText variant="heading" color="primary">
          {g.titleZh}
        </AppText>
      </Card>

      {patterns.length > 0 && (
        <Card>
          <SectionTitle title="Mẫu câu" />
          {patterns.map((p) => (
            <View key={p} style={[styles.pattern, { backgroundColor: theme.surface2 }]}>
              <AppText>{p}</AppText>
            </View>
          ))}
        </Card>
      )}

      <Card>
        <SectionTitle title="Giải thích" />
        {/* explanationVi xuống dòng bằng \n — tách thành đoạn cho dễ đọc. */}
        {g.explanationVi
          .split('\n')
          .filter((line) => line.trim())
          .map((line, i) => (
            <AppText key={i}>{line}</AppText>
          ))}
      </Card>

      {examples.length > 0 && (
        <Card>
          <SectionTitle title="Ví dụ" />
          {examples.map((ex, i) => (
            <View key={i} style={[styles.example, { borderColor: theme.border }]}>
              <Pressable onPress={() => speakChinese(ex.zh)} hitSlop={8} accessibilityLabel="Nghe câu ví dụ">
                <Icon name="sound" size={18} color="primary" />
              </Pressable>
              <View style={styles.flex}>
                <AppText variant="heading">{ex.zh}</AppText>
                {ex.pinyin && (
                  <AppText variant="caption" color="muted">
                    {ex.pinyin}
                  </AppText>
                )}
                {ex.vi && <AppText variant="small">{ex.vi}</AppText>}
              </View>
            </View>
          ))}
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  pattern: { borderRadius: Radius.md, padding: Spacing.md },
  example: { flexDirection: 'row', gap: Spacing.md, borderTopWidth: 1, paddingTop: Spacing.sm },
  flex: { flex: 1, gap: 2 },
});
