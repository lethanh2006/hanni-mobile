import { router, Stack, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import useSWR from 'swr';

import { AppText, Card, EmptyState, Hanzi, Loading, Screen } from '@/components/ui';
import { alpha } from '@/constants/theme';
import { LearnCta } from '@/features/grammar/learn-cta';
import { useTheme } from '@/hooks/use-theme';
import type { GrammarDetail } from '@/lib/types';

/** 1 điểm ngữ pháp (`/ngu-phap/[slug]` của web): tên, tóm tắt, mẫu câu, giải thích tiếng Việt từng đoạn, ví dụ có pinyin. */
export default function GrammarScreen() {
  const theme = useTheme();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { data: p, error } = useSWR<GrammarDetail>(`/grammar/${encodeURIComponent(slug)}`);

  if (error) {
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Ngữ pháp' }} />
        <EmptyState title="Không mở được điểm ngữ pháp này" description="Bạn thử lại sau nhé." />
      </Screen>
    );
  }
  if (!p) {
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Ngữ pháp' }} />
        <Loading />
      </Screen>
    );
  }

  const patterns = p.patterns ?? [];
  const examples = p.examples ?? [];

  return (
    <Screen contentStyle={styles.page}>
      <Stack.Screen options={{ title: p.titleZh }} />
      <AppText variant="caption" color="muted">
        <AppText variant="caption" color="muted" onPress={() => router.navigate('/')}>
          Hanni
        </AppText>{' '}
        ›{' '}
        <AppText variant="caption" color="muted" onPress={() => router.navigate('/ngu-phap')}>
          Ngữ pháp
        </AppText>{' '}
        › <AppText variant="caption">{p.titleZh}</AppText>
      </AppText>

      <Card style={styles.article}>
        <View style={styles.head}>
          <View style={styles.flex}>
            <AppText weight="700" style={styles.title}>
              {p.titleVi}
            </AppText>
            <Hanzi size={30} color="primary" style={styles.zh}>
              {p.titleZh}
            </Hanzi>
          </View>
          <View style={[styles.badge, { backgroundColor: alpha(theme.primary, 0.1) }]}>
            <AppText variant="caption" weight="600" color="primary">
              HSK {p.hskLevel}
            </AppText>
          </View>
        </View>

        <AppText color="muted" style={styles.summary}>
          {p.summaryVi}
        </AppText>

        {patterns.length > 0 && (
          <View style={styles.block}>
            <AppText weight="600">Mẫu câu</AppText>
            <View style={styles.patterns}>
              {patterns.map((pt) => (
                <View key={pt} style={[styles.pattern, { backgroundColor: theme.surface2 }]}>
                  <AppText>{pt}</AppText>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.block}>
          <AppText weight="600">Giải thích</AppText>
          {/* explanationVi xuống dòng bằng \n — tách thành đoạn thay vì đổ nguyên khối chữ liền. */}
          <View style={styles.paragraphs}>
            {p.explanationVi
              .split('\n')
              .filter((line) => line.trim())
              .map((line, i) => (
                <AppText key={i} style={styles.paragraph}>
                  {line}
                </AppText>
              ))}
          </View>
        </View>

        {examples.length > 0 && (
          <View style={[styles.block, styles.examples, { borderColor: theme.border }]}>
            <AppText weight="600">Ví dụ</AppText>
            <View style={styles.exampleList}>
              {examples.map((ex, i) => (
                <View key={i}>
                  <Hanzi size={16}>{ex.zh}</Hanzi>
                  {ex.pinyin ? (
                    <AppText variant="caption" color="muted" style={styles.exampleLine}>
                      {ex.pinyin}
                    </AppText>
                  ) : null}
                  {ex.vi ? <AppText style={styles.exampleLine}>{ex.vi}</AppText> : null}
                </View>
              ))}
            </View>
          </View>
        )}
      </Card>

      <LearnCta
        title="Hiểu ngữ pháp rồi, giờ dùng được chưa?"
        text={`Hanni xếp ngữ pháp HSK ${p.hskLevel} cùng với từ vựng cùng cấp thành bài học theo chủ đề, và nhắc bạn ôn đúng lúc sắp quên — miễn phí toàn bộ nội dung học.`}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { gap: 24, paddingTop: 40 },
  flex: { flex: 1, minWidth: 0 },
  article: { gap: 0, padding: 24 },
  head: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  title: { fontSize: 24, lineHeight: 32, letterSpacing: -0.6 },
  zh: { marginTop: 8 },
  badge: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  summary: { marginTop: 20, lineHeight: 28 },
  block: { marginTop: 24 },
  patterns: { marginTop: 12, gap: 8 },
  pattern: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10 },
  paragraphs: { marginTop: 12, gap: 8 },
  paragraph: { lineHeight: 28 },
  examples: { borderTopWidth: 1, paddingTop: 20 },
  exampleList: { marginTop: 12, gap: 16 },
  exampleLine: { marginTop: 2 },
});
