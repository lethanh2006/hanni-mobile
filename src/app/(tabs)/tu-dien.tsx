import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Card, Chip, Loading, PageHeader, Screen, SectionTitle } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { RecentSearches } from '@/features/dictionary/recent-searches';
import { SearchBox } from '@/features/dictionary/search-box';
import { useSuggestions } from '@/features/dictionary/use-suggestions';
import { WordRow } from '@/features/dictionary/word-row';

/** Từ khoá phổ biến (giống trang chủ từ điển của web). */
const HOT_WORDS = ['你好', '谢谢', '学习', '喜欢', '朋友', '工作', '时间', '汉语', '漂亮', '努力', '加油', '没关系'];

const openWord = (s: string) => router.push(`/tu-dien/${encodeURIComponent(s)}`);

/** Tab Từ điển: gõ là có gợi ý; ô trống thì hiện tra gần đây + từ khoá phổ biến. */
export default function DictionaryTab() {
  const [query, setQuery] = useState('');
  const { items, loading } = useSuggestions(query);
  const typing = query.trim().length > 0;

  return (
    <Screen safeTop>
      <PageHeader icon="search" title="Từ điển" description="Tra từ kèm pinyin, âm Hán Việt và câu ví dụ." />
      <SearchBox value={query} onChange={setQuery} onSubmit={() => items[0] && openWord(items[0].simplified)} />

      {typing ? (
        <Card>
          {items.length > 0 ? (
            items.map((w) => (
              <WordRow key={w.id} simplified={w.simplified} pinyin={w.pinyin} meaning={w.meaningVi} hanViet={w.hanViet} />
            ))
          ) : loading ? (
            <Loading label="Đang tra…" />
          ) : (
            <AppText variant="small" color="muted">
              Không có từ nào khớp “{query.trim()}”. Thử gõ pinyin không dấu (vd: xuexi) hoặc nghĩa tiếng Việt.
            </AppText>
          )}
        </Card>
      ) : (
        <>
          <RecentSearches />
          <Card>
            <SectionTitle title="Từ khoá phổ biến" />
            <View style={styles.chips}>
              {HOT_WORDS.map((w) => (
                <Chip key={w} label={w} active={false} onPress={() => openWord(w)} />
              ))}
            </View>
          </Card>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
});
