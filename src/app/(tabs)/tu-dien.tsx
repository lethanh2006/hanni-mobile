import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import useSWR from 'swr';

import { AppText, Button, Hanzi, IconTile, Screen, type IconName } from '@/components/ui';
import { alpha, Radius, tintPanel } from '@/constants/theme';
import { HanVietTips } from '@/features/dictionary/hanviet-tips';
import { RecentSearches } from '@/features/dictionary/recent-searches';
import {
  CharResults,
  DictCard,
  ExampleResults,
  GrammarResults,
  LevelList,
  WordResults,
} from '@/features/dictionary/results';
import { DictionarySearch } from '@/features/dictionary/search-box';
import { DICT_TABS, type DictTab } from '@/features/dictionary/types';
import { WordOfTheDay } from '@/features/home/word-of-the-day';
import { useTheme } from '@/hooks/use-theme';
import { useLearnPath, useLevels } from '@/lib/hooks';
import { HSK_LEVELS, hskLabel } from '@/lib/hsk';

/** Từ khoá phổ biến (giống trang chủ từ điển của web). */
const HOT_WORDS = ['你好', '谢谢', '学习', '喜欢', '朋友', '工作', '时间', '汉语', '漂亮', '努力', '加油', '没关系'];

const TOOLS: [string, IconName, string, string][] = [
  ['/phien-am', 'sound', 'Bảng phiên âm', 'Thanh điệu, ghép âm, bấm nghe từng âm'],
  ['/writing', 'pencil', 'Luyện viết chữ Hán', 'Thứ tự nét, tự tô và chấm nét'],
  ['/ngu-phap', 'book', 'Ngữ pháp & mẫu câu', '235 điểm giải thích bằng tiếng Việt'],
  ['/kiem-tra-trinh-do', 'chart', 'Kiểm tra trình độ', 'Vài phút biết nên học HSK mấy'],
];

const openWord = (s: string) => router.push(`/tu-dien/${encodeURIComponent(s)}`);
const isTab = (t: string | undefined): t is DictTab => DICT_TABS.some((x) => x.key === t);

/**
 * Tab Từ điển — 3 chế độ như trang `/tu-dien` của web:
 * - không tham số: trang chủ tra cứu (tiêu đề, ô tra + 4 tab, từ khoá phổ biến, tra gần đây, chủ đề HSK 1, mẹo Hán
 *   Việt, tra theo cấp, từ hôm nay, công cụ tra cứu);
 * - `?q=` (+ `tab=han-tu|vi-du|ngu-phap`): kết quả theo tab;
 * - `?level=N`: danh sách từ theo cấp HSK.
 */
export default function DictionaryTab() {
  const params = useLocalSearchParams<{ q?: string; tab?: string; level?: string; page?: string }>();
  const q = params.q?.trim() || undefined;
  const tab: DictTab = isTab(params.tab) ? params.tab : 'tu-vung';
  const level = Number(params.level);
  const page = Math.max(1, Number(params.page) || 1);
  // Chữ đang gõ: mặc định là `q` trên đường dẫn; gõ khác đi thì giữ chữ đã gõ cho tới khi tra lại.
  const [typed, setTyped] = useState<{ for?: string; value: string }>({ value: '' });
  const text = typed.for === q ? typed.value : (q ?? '');

  const search = (value: string, nextTab: DictTab = tab) => {
    const term = value.trim();
    if (!term) {
      router.setParams({ q: undefined, tab: nextTab === 'tu-vung' ? undefined : nextTab, page: undefined, level: undefined });
      return;
    }
    setTyped({ for: term, value: term });
    router.setParams({ q: term, tab: nextTab === 'tu-vung' ? undefined : nextTab, page: undefined, level: undefined });
  };

  const searchBox = (
    <DictionarySearch
      value={text}
      onChange={(value) => setTyped({ for: q, value })}
      onSubmit={(value) => search(value)}
      tab={tab}
      onTab={(t) => (text.trim() ? search(text, t) : router.setParams({ tab: t === 'tu-vung' ? undefined : t }))}
    />
  );

  return (
    <Screen contentStyle={styles.page}>
      {q ? (
        <>
          {searchBox}
          {tab === 'tu-vung' && <WordResults q={q} page={page} onPage={(p) => router.setParams({ page: String(p) })} />}
          {tab === 'han-tu' && <CharResults q={q} />}
          {tab === 'vi-du' && <ExampleResults q={q} page={page} onPage={(p) => router.setParams({ page: String(p) })} />}
          {tab === 'ngu-phap' && <GrammarResults q={q} />}
        </>
      ) : (HSK_LEVELS as readonly number[]).includes(level) ? (
        <>
          {searchBox}
          <LevelList
            level={level}
            page={page}
            levels={[...HSK_LEVELS]}
            onLevel={(l) => router.setParams({ level: String(l), page: undefined })}
            onPage={(p) => router.setParams({ page: String(p) })}
          />
        </>
      ) : (
        <DictionaryHome searchBox={searchBox} />
      )}
    </Screen>
  );
}

function DictionaryHome({ searchBox }: { searchBox: React.ReactNode }) {
  const theme = useTheme();
  const stats = useSWR<{ total: number; withHanViet: number }>('/words/stats');
  const path = useLearnPath(1);
  const levels = useLevels();
  const topics = new Map<string, { id: string; words: number; preview: string[] }>();
  for (const l of path.data?.lessons ?? []) {
    const name = l.title.replace(/\s*\(\d+\/\d+\)$/, '');
    const t = topics.get(name);
    if (t) t.words += l.wordCount;
    else topics.set(name, { id: l.id, words: l.wordCount, preview: l.previewWords ?? [] });
  }
  const fmt = (n?: number) => (n ? n.toLocaleString('vi-VN') : null);
  // `/levels` có thêm `wordsInDb` (số từ thật trong từ điển) ngoài các trường của `HskLevel`.
  const levelRows: { level: number; wordsInDb?: number }[] = levels.data ?? [];
  const wordsAt = (l: number) => levelRows.find((x) => x.level === l)?.wordsInDb;

  return (
    <>
      <View style={styles.hero}>
        <AppText variant="label" center>
          TỪ ĐIỂN TRUNG – VIỆT
        </AppText>
        <AppText weight="800" center style={styles.h1}>
          Tra từ tiếng Trung, có <Text style={{ color: theme.primary }}>âm Hán Việt</Text>
        </AppText>
        <AppText color="muted" center style={styles.lead}>
          {fmt(stats.data?.total) ?? '10.900+'} từ chuẩn HSK 3.0 · {fmt(stats.data?.withHanViet) ?? '9.800+'} từ có âm
          Hán Việt · câu ví dụ, lượng từ, bộ thủ, cách viết, phát âm chuẩn. Gõ Hán tự, pinyin hoặc tiếng Việt.
        </AppText>
      </View>
      {searchBox}

      <DictCard title="Từ khoá phổ biến" icon="flame">
        <View style={styles.hot}>
          {HOT_WORDS.map((w) => (
            <Pressable
              key={w}
              onPress={() => openWord(w)}
              style={({ pressed }) => [
                styles.hotWord,
                { backgroundColor: pressed ? alpha(theme.primary, 0.1) : theme.surface2 },
              ]}>
              <Hanzi size={16}>{w}</Hanzi>
            </Pressable>
          ))}
        </View>
      </DictCard>
      <DictCard title="Tra gần đây" icon="clock">
        <RecentSearches />
      </DictCard>
      {topics.size > 0 && (
        <DictCard
          title="Từ vựng theo chủ đề · HSK 1"
          icon="route"
          action={
            <Pressable onPress={() => router.navigate('/')} hitSlop={6}>
              <AppText variant="caption" weight="600" color="primary">
                Lộ trình →
              </AppText>
            </Pressable>
          }>
          <View style={styles.topicGrid}>
            {[...topics].slice(0, 8).map(([name, t]) => (
              <View key={name} style={styles.topicCell}>
                <Pressable
                  onPress={() => router.push(`/learn/${t.id}`)}
                  style={({ pressed }) => [
                    styles.topic,
                    { borderColor: pressed ? alpha(theme.primary, 0.3) : theme.border, backgroundColor: theme.surface },
                  ]}>
                  <AppText variant="caption" weight="600" numberOfLines={1}>
                    {name}
                  </AppText>
                  <Hanzi size={14} color="primary" numberOfLines={1} style={styles.topicZh}>
                    {t.preview.slice(0, 3).join(' · ')}
                  </Hanzi>
                  <AppText variant="caption" color="muted">
                    {t.words} từ
                  </AppText>
                </Pressable>
              </View>
            ))}
          </View>
        </DictCard>
      )}
      <DictCard title="Mẹo Hán Việt" icon="spark">
        <HanVietTips />
      </DictCard>
      <DictCard title="Tra theo cấp HSK" icon="target">
        <View style={styles.topicGrid}>
          {HSK_LEVELS.map((l) => (
            <View key={l} style={styles.topicCell}>
              <Pressable
                onPress={() => router.setParams({ level: String(l) })}
                style={({ pressed }) => [
                  styles.levelCell,
                  { borderColor: pressed ? alpha(theme.primary, 0.3) : theme.border, backgroundColor: theme.surface },
                ]}>
                <AppText weight="700" center>
                  {hskLabel(l)}
                </AppText>
                <AppText variant="caption" color="muted" center>
                  {fmt(wordsAt(l)) ?? '—'} từ
                </AppText>
              </Pressable>
            </View>
          ))}
        </View>
      </DictCard>
      <WordOfTheDay />
      <DictCard title="Công cụ tra cứu" icon="grid">
        <View style={styles.tools}>
          {TOOLS.map(([href, icon, label, desc]) => (
            <Pressable
              key={href}
              onPress={() => router.push(href as '/phien-am')}
              style={({ pressed }) => [
                styles.tool,
                { borderColor: pressed ? alpha(theme.primary, 0.3) : theme.border, backgroundColor: theme.surface },
              ]}>
              <IconTile icon={icon} iconSize={18} size={40} />
              <View style={styles.flex}>
                <AppText weight="600">{label}</AppText>
                <AppText variant="caption" color="muted" numberOfLines={1}>
                  {desc}
                </AppText>
              </View>
            </Pressable>
          ))}
        </View>
      </DictCard>
      <View style={[styles.learn, tintPanel(theme)]}>
        <AppText weight="700">Tra xong rồi học luôn</AppText>
        <AppText color="muted" style={styles.learnText}>
          Mỗi từ có nút “Lưu để ôn tập” — Hanni nhắc ôn đúng lúc sắp quên. Muốn học có lộ trình thì bắt đầu từ bài 1.
        </AppText>
        <Button title="Học bài đầu tiên — miễn phí" icon="arrow" onPress={() => router.navigate('/')} style={styles.learnButton} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  page: { gap: 20 },
  hero: { paddingTop: 12 },
  h1: { marginTop: 8, fontSize: 30, lineHeight: 36, letterSpacing: -0.75 },
  lead: { marginTop: 8, lineHeight: 24 },
  hot: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  hotWord: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 },
  topicGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4, rowGap: 8 },
  topicCell: { width: '50%', paddingHorizontal: 4 },
  topic: { flex: 1, borderWidth: 1, borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 10 },
  topicZh: { marginTop: 2 },
  levelCell: { flex: 1, borderWidth: 1, borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 10 },
  tools: { gap: 8 },
  tool: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: Radius.md, padding: 12 },
  flex: { flex: 1, minWidth: 0 },
  learn: { borderWidth: 1, borderRadius: Radius.lg, padding: 20 },
  learnText: { marginTop: 6, lineHeight: 24 },
  learnButton: { marginTop: 12 },
});
