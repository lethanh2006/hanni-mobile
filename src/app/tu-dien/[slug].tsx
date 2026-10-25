import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import useSWR from 'swr';

import { Button, EmptyState, Loading, Screen, TextLink } from '@/components/ui';
import { HanVietSection } from '@/features/dictionary/hanviet-section';
import { rememberWord } from '@/features/dictionary/history';
import { MeaningSection } from '@/features/dictionary/meaning-section';
import { MeasuresSection, RelatedSection } from '@/features/dictionary/related-sections';
import type { LookupResult } from '@/features/dictionary/types';
import { WordHeader } from '@/features/dictionary/word-header';
import { ApiError } from '@/lib/api';
import { goBack } from '@/lib/navigation';

/** Trang 1 từ: nghĩa + ví dụ, nhớ bằng Hán Việt, lượng từ, từ ghép, cùng chủ đề. */
export default function WordScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const word = decodeURIComponent(slug);
  const { data, error } = useSWR<LookupResult>(`/dictionary/${encodeURIComponent(word)}`);
  const main = data?.words?.[0];

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

  return (
    <Screen>
      {header}
      <WordHeader word={main} topic={data.topic ?? null} />
      <TextLink
        title="Luyện viết chữ này (xem thứ tự nét) →"
        onPress={() => router.push({ pathname: '/writing', params: { c: Array.from(main.simplified)[0] } })}
      />
      <MeaningSection words={data.words ?? []} />
      <HanVietSection word={main} characters={data.characters ?? []} compounds={data.compounds ?? []} />
      <MeasuresSection measures={data.measures ?? []} />
      <RelatedSection title="Từ ghép" words={data.compounds ?? []} />
      <RelatedSection title="Cùng chủ đề" words={data.related ?? []} />
    </Screen>
  );
}
