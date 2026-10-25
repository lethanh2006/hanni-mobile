import { router, Stack } from 'expo-router';
import useSWR from 'swr';

import { AppText, Button, Screen } from '@/components/ui';
import { FINAL_GROUPS, INITIAL_GROUPS } from '@/features/practice/pinyin-data';
import { SoundGroupSection, ToneRuleSection, ToneSection } from '@/features/practice/pinyin-sections';
import type { PinyinOverview } from '@/lib/types';

/**
 * Bảng phiên âm: 4 thanh, mẹo đoán thanh từ âm Hán Việt, 21 thanh mẫu, 36 vận mẫu — bấm để nghe.
 * Âm thanh lấy từ `GET /pinyin/overview` (chỉ âm tiết có ghi âm thật); chưa tải được thì vẫn đọc được chữ.
 */
export default function PinyinScreen() {
  const { data } = useSWR<PinyinOverview>('/pinyin/overview');
  const overview = data ?? null;

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Bảng phiên âm' }} />
      <AppText color="muted">
        Pinyin là cách ghi âm tiếng Trung bằng chữ Latinh. Nắm 4 thanh và cách đọc từng âm là đọc được mọi từ mới.
      </AppText>
      <ToneSection data={overview} />
      <ToneRuleSection data={overview} />
      <SoundGroupSection title="21 thanh mẫu (phụ âm đầu)" groups={INITIAL_GROUPS} data={overview} />
      <SoundGroupSection title="36 vận mẫu (vần)" groups={FINAL_GROUPS} data={overview} />
      <Button title="Đọc được pinyin rồi — học từ đầu tiên" icon="arrow" onPress={() => router.navigate('/')} />
    </Screen>
  );
}
