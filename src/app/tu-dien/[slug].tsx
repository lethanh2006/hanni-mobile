import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, type ScrollViewInstance } from 'react-native';
import useSWR from 'swr';

import { AppText, Button, EmptyState, Loading, Screen } from '@/components/ui';
import { alpha, Radius, tintPanel } from '@/constants/theme';
import { GlyphPanel } from '@/features/dictionary/glyph-panel';
import { HanVietSection } from '@/features/dictionary/hanviet-section';
import { rememberWord } from '@/features/dictionary/history';
import { MeaningSection } from '@/features/dictionary/meaning-section';
import { CompoundsSection, MeasuresSection, RelatedSection } from '@/features/dictionary/related-sections';
import { DictionarySearch } from '@/features/dictionary/search-box';
import type { DictTab, LookupResult } from '@/features/dictionary/types';
import { WordHeader, WordSection } from '@/features/dictionary/word-header';
import { useTheme } from '@/hooks/use-theme';
import { ApiError } from '@/lib/api';
import { hskLabel } from '@/lib/hsk';
import { goBack } from '@/lib/navigation';

type SectionId = 'nghia' | 'nho' | 'luong-tu' | 'tu-ghep' | 'chu-de' | 'luyen';

/**
 * Trang 1 từ (`/tu-dien/[slug]` của web ở khổ điện thoại): ô tra · mục lục dính đầu trang · đầu mục từ · Nghĩa ·
 * Nhớ bằng Hán Việt · Lượng từ · Từ ghép · Cùng chủ đề · Luyện với từ này · khung Hán tự · học trong lộ trình.
 */
export default function WordScreen() {
  const theme = useTheme();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const word = decodeURIComponent(slug);
  const { data, error } = useSWR<LookupResult>(`/dictionary/${encodeURIComponent(word)}`);
  const main = data?.words?.[0];
  const scroll = useRef<ScrollViewInstance>(null);
  const offsets = useRef<Partial<Record<SectionId, number>>>({});
  const [text, setText] = useState('');
  const [tab, setTab] = useState<DictTab>('tu-vung');

  // Ghi vào "Tra gần đây" khi mở được từ.
  useEffect(() => {
    if (main) rememberWord({ s: main.simplified, p: main.pinyin, m: main.meaningVi });
  }, [main]);

  const header = <Stack.Screen options={{ title: word }} />;

  if (error || (data && !main)) {
    const notFound = (error instanceof ApiError && error.status === 404) || (data && !main);
    return (
      <Screen>
        {header}
        <EmptyState
          title={notFound ? 'Không tìm thấy từ này' : 'Chưa tải được từ này'}
          description={notFound ? 'Thử tra bằng pinyin hoặc tiếng Việt nhé.' : 'Bạn kiểm tra kết nối rồi thử lại.'}>
          <Button title="Tra từ khác" variant="secondary" onPress={goBack} />
        </EmptyState>
      </Screen>
    );
  }
  if (!data || !main) {
    return (
      <Screen>
        {header}
        <Loading />
      </Screen>
    );
  }

  const measures = data.measures ?? [];
  const compounds = data.compounds ?? [];
  const related = data.related ?? [];
  const topic = data.topic ?? null;
  const toc: { id: SectionId; label: string }[] = [
    { id: 'nghia', label: 'Nghĩa' },
    { id: 'nho', label: 'Nhớ bằng Hán Việt' },
    ...(measures.length ? [{ id: 'luong-tu' as const, label: 'Lượng từ' }] : []),
    ...(compounds.length ? [{ id: 'tu-ghep' as const, label: 'Từ ghép' }] : []),
    ...(related.length ? [{ id: 'chu-de' as const, label: 'Cùng chủ đề' }] : []),
    { id: 'luyen', label: 'Luyện tập' },
  ];
  const record = (id: SectionId, y: number) => {
    offsets.current[id] = y;
  };
  const jump = (id: SectionId) => {
    const y = offsets.current[id];
    // Trừ phần dải mục lục đang dính ở đầu.
    if (y !== undefined) scroll.current?.scrollTo({ y: Math.max(0, y - 60), animated: true });
  };
  const search = (value: string, nextTab: DictTab = tab) => {
    const term = value.trim();
    if (term) router.navigate({ pathname: '/tu-dien', params: { q: term, tab: nextTab === 'tu-vung' ? undefined : nextTab } });
  };
  const firstChar = Array.from(main.simplified)[0];

  return (
    <Screen scrollRef={scroll} stickyHeaderIndices={[2]} contentStyle={styles.page}>
      {header}
      <DictionarySearch
        value={text}
        onChange={setText}
        onSubmit={(v) => search(v)}
        tab={tab}
        onTab={(t) => (text.trim() ? search(text, t) : setTab(t))}
      />
      {/* Mục lục thành 1 hàng chip dính dưới thanh trên (như điện thoại của web). */}
      <View style={[styles.toc, { backgroundColor: alpha(theme.background, 0.95), borderColor: theme.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tocRow}>
          {toc.map((t) => (
            <Pressable
              key={t.id}
              onPress={() => jump(t.id)}
              style={({ pressed }) => [
                styles.tocChip,
                { borderColor: theme.border, backgroundColor: theme.surface },
                pressed && { borderColor: alpha(theme.primary, 0.4) },
              ]}>
              <AppText variant="caption" weight="600" color="muted">
                {t.label}
              </AppText>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <WordHeader word={main} topic={topic} />
      <MeaningSection words={data.words ?? []} onLayout={(e) => record('nghia', e.nativeEvent.layout.y)} />
      <HanVietSection word={main} characters={data.characters ?? []} compounds={compounds} onLayout={(e) => record('nho', e.nativeEvent.layout.y)} />
      <MeasuresSection measures={measures} word={main} onLayout={(e) => record('luong-tu', e.nativeEvent.layout.y)} />
      <CompoundsSection words={compounds} char={firstChar} onLayout={(e) => record('tu-ghep', e.nativeEvent.layout.y)} />
      <RelatedSection words={related} topic={topic} level={main.hskLevel} onLayout={(e) => record('chu-de', e.nativeEvent.layout.y)} />
      <WordSection icon="target" title="Luyện với từ này" onLayout={(e) => record('luyen', e.nativeEvent.layout.y)}>
        <AppText color="muted" style={styles.practice}>
          Xem thứ tự nét từng chữ rồi tự tô lại, Hanni chấm từng nét.
        </AppText>
        <Button
          title="Luyện viết"
          leftIcon="pencil"
          variant="secondary"
          onPress={() => router.push({ pathname: '/writing', params: { c: firstChar } })}
          style={styles.self}
        />
      </WordSection>

      {(data.glyphs?.length ?? 0) > 0 && <GlyphPanel glyphs={data.glyphs!} />}
      <View style={[styles.learn, tintPanel(theme)]}>
        <AppText weight="700">Học từ này trong lộ trình</AppText>
        {topic ? (
          <>
            <AppText color="muted" style={styles.learnText}>
              {hskLabel(topic.hskLevel)} · Bài {topic.orderIndex}: {topic.title}
            </AppText>
            <Button title="Học bài này — 5 phút" icon="arrow" onPress={() => router.push(`/bai-hoc/${topic.id}`)} style={styles.learnButton} />
          </>
        ) : (
          <Button title="Học bài đầu tiên" icon="arrow" onPress={() => router.navigate('/')} style={styles.learnButton} />
        )}
        <AppText variant="caption" color="muted" style={styles.learnNote}>
          Giới thiệu từ, luyện nghe – nhìn – ghép cặp, điền câu; miễn phí, khách cũng học được.
        </AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { gap: 20 },
  toc: { marginHorizontal: -16, borderBottomWidth: 1, paddingVertical: 8 },
  tocRow: { gap: 6, paddingHorizontal: 16 },
  tocChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 },
  practice: { lineHeight: 24 },
  self: { marginTop: 12, alignSelf: 'flex-start' },
  learn: { borderWidth: 1, borderRadius: Radius.lg, padding: 20 },
  learnText: { marginTop: 6 },
  learnButton: { marginTop: 12 },
  learnNote: { marginTop: 12, lineHeight: 20 },
});
