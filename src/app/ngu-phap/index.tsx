import { router, Stack } from 'expo-router';
import { useState } from 'react';
import useSWR from 'swr';

import { AppText, Card, ChipRow, EmptyState, Loading, Screen } from '@/components/ui';
import { HSK_LEVELS, hskLabel } from '@/lib/hsk';
import type { GrammarListItem } from '@/lib/types';

/** Ngữ pháp theo cấp HSK, giải thích bằng tiếng Việt. Chỉ liệt kê điểm CÓ giải thích thật (`flat !== true`). */
export default function GrammarListScreen() {
  const [level, setLevel] = useState(1);
  const { data, error } = useSWR<GrammarListItem[]>(`/grammar?level=${level}`, { keepPreviousData: true });
  const items = (data ?? []).filter((g) => g.flat !== true);

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Ngữ pháp' }} />
      <AppText color="muted">Giải thích bằng tiếng Việt, kèm mẫu câu và ví dụ có pinyin.</AppText>
      <ChipRow options={HSK_LEVELS.map((l) => ({ value: l, label: hskLabel(l) }))} value={level} onChange={setLevel} />
      {error ? (
        <EmptyState title="Chưa tải được ngữ pháp" description="Bạn kiểm tra kết nối rồi thử lại nhé." />
      ) : !data ? (
        <Loading />
      ) : items.length === 0 ? (
        <EmptyState title="Chưa có điểm ngữ pháp" description="Cấp này chưa có điểm ngữ pháp nào được giải thích chi tiết." />
      ) : (
        items.map((g) => (
          <Card key={g.slug} onPress={() => router.push(`/ngu-phap/${encodeURIComponent(g.slug)}`)}>
            <AppText variant="heading" color="primary">
              {g.titleZh}
            </AppText>
            <AppText bold>{g.titleVi}</AppText>
            <AppText variant="small" color="muted" numberOfLines={2}>
              {g.summaryVi}
            </AppText>
          </Card>
        ))
      )}
    </Screen>
  );
}
