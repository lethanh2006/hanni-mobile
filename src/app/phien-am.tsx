import { router, Stack } from 'expo-router';
import { useRef } from 'react';
import { Pressable, StyleSheet, View, type ScrollViewInstance } from 'react-native';
import useSWR from 'swr';

import { AppText, Button, Card, Screen } from '@/components/ui';
import { alpha, tintPanel } from '@/constants/theme';
import {
  FinalSection,
  InitialSection,
  SectionIntro,
  SyllableChart,
  ToneRuleSection,
  ToneSection,
  TonePractice,
} from '@/features/practice/pinyin-sections';
import { startCourse } from '@/features/onboarding/start-course';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth';
import type { PinyinOverview } from '@/lib/types';

const SECTIONS = [
  ['thanh-dieu', 'Thanh điệu'],
  ['meo-han-viet', 'Mẹo Hán Việt'],
  ['thanh-mau', 'Thanh mẫu'],
  ['van-mau', 'Vận mẫu'],
  ['bang-ghep-am', 'Bảng ghép âm'],
  ['luyen-tap', 'Luyện nghe'],
] as const;

type SectionId = (typeof SECTIONS)[number][0];

/**
 * Bảng phiên âm (`/phien-am` của web): 4 thanh + biến điệu, mẹo đoán thanh từ âm Hán Việt (tỉ lệ đúng đo thật),
 * 21 thanh mẫu, 36 vận mẫu, bảng ghép âm và luyện nghe thanh — âm thanh là ghi âm thật (`GET /pinyin/overview`).
 */
export default function PinyinScreen() {
  const theme = useTheme();
  const { user } = useAuth();
  const { data } = useSWR<PinyinOverview>('/pinyin/overview');
  const overview = data ?? null;
  const scroll = useRef<ScrollViewInstance>(null);
  const offsets = useRef<Partial<Record<SectionId, number>>>({});

  // Khách → bài 1 HSK 1; đã đăng nhập → về lộ trình (không đổi cấp của người đang học cấp khác).
  const learn = () => (user ? router.navigate('/') : void startCourse(1, false));
  const learnLabel = user ? 'Về lộ trình học' : 'Học bài 1 HSK 1 — miễn phí';
  const record = (id: SectionId, y: number) => {
    offsets.current[id] = y;
  };

  return (
    <Screen scrollRef={scroll} contentStyle={styles.page}>
      <Stack.Screen options={{ title: 'Bảng phiên âm' }} />
      <View style={[styles.hero, tintPanel(theme)]}>
        <AppText weight="800" style={styles.title}>
          Bảng phiên âm tiếng Trung (pinyin)
        </AppText>
        <AppText color="muted" style={styles.heroText}>
          Học xong phần này là tự đọc được mọi từ mới — mỗi âm đều so với âm tiếng Việt gần nhất, bấm là nghe ghi âm thật.
        </AppText>
        <View style={styles.pills}>
          {['21 thanh mẫu', '36 vận mẫu', '4 thanh điệu + thanh nhẹ', 'Ghi âm thật'].map((t) => (
            <View key={t} style={[styles.pill, { borderColor: alpha(theme.primary, 0.2), backgroundColor: alpha(theme.surface, 0.7) }]}>
              <AppText variant="caption" weight="600">
                {t}
              </AppText>
            </View>
          ))}
        </View>
        <View style={styles.toc} accessibilityLabel="Mục lục">
          {SECTIONS.map(([id, label]) => (
            <Pressable
              key={id}
              onPress={() => scroll.current?.scrollTo({ y: Math.max(0, (offsets.current[id] ?? 0) - 12), animated: true })}
              style={[styles.tocItem, { backgroundColor: theme.surface }]}>
              <AppText variant="caption" weight="600" color="muted">
                {label}
              </AppText>
            </Pressable>
          ))}
        </View>
      </View>

      <View onLayout={(e) => record('thanh-dieu', e.nativeEvent.layout.y)}>
        <ToneSection data={overview} />
      </View>
      <View onLayout={(e) => record('meo-han-viet', e.nativeEvent.layout.y)}>
        <ToneRuleSection data={overview} />
      </View>
      <View onLayout={(e) => record('thanh-mau', e.nativeEvent.layout.y)}>
        <InitialSection data={overview} />
      </View>
      <View onLayout={(e) => record('van-mau', e.nativeEvent.layout.y)}>
        <FinalSection data={overview} />
      </View>
      <View onLayout={(e) => record('bang-ghep-am', e.nativeEvent.layout.y)} style={styles.block}>
        <SectionIntro title="Bảng ghép âm — bấm để nghe">
          Chọn phụ âm đầu để xem mọi âm tiết ghép được; mỗi ô là một thanh, kèm 1 chữ đọc đúng âm đó. Ô trống là thanh chưa
          có chữ đơn ghi âm trong từ điển Hanni.
        </SectionIntro>
        <Card style={styles.panel}>
          <SyllableChart data={overview} />
        </Card>
      </View>
      <View onLayout={(e) => record('luyen-tap', e.nativeEvent.layout.y)} style={styles.block}>
        <SectionIntro title="Luyện nghe thanh điệu" />
        <Card style={styles.practice}>
          <TonePractice data={overview} onLearn={learn} learnLabel={user ? 'Về lộ trình học' : 'Học bài 1 HSK 1'} />
        </Card>
      </View>

      <View style={[styles.cta, tintPanel(theme)]}>
        <AppText weight="700" center style={styles.ctaTitle}>
          Đọc được pinyin rồi — học từ đầu tiên thôi
        </AppText>
        <AppText color="muted" center style={styles.ctaText}>
          Bài 1 HSK 1 dạy 10 từ chào hỏi, mỗi từ có pinyin tô màu theo thanh và mẹo Hán Việt — 5 phút là xong.
        </AppText>
        <View style={styles.ctaActions}>
          <Button title={learnLabel} icon="arrow" onPress={learn} />
          <Button title="Tôi đã biết một chút" variant="secondary" onPress={() => router.push('/kiem-tra-trinh-do')} />
        </View>
        <AppText variant="caption" color="muted" center style={styles.source}>
          Âm thanh: ghi âm từ vựng HSK 3.0.
        </AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { gap: 40, paddingTop: 32 },
  hero: { borderWidth: 1, borderRadius: 16, padding: 20 },
  title: { fontSize: 24, lineHeight: 32, letterSpacing: -0.6 },
  heroText: { marginTop: 8, lineHeight: 24 },
  pills: { marginTop: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  toc: { marginTop: 20, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tocItem: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  block: { gap: 16 },
  panel: { padding: 16 },
  practice: { padding: 20 },
  cta: { borderWidth: 1, borderRadius: 16, padding: 24 },
  ctaTitle: { fontSize: 18, lineHeight: 26 },
  ctaText: { marginTop: 8, lineHeight: 24 },
  ctaActions: { marginTop: 16, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  source: { marginTop: 16 },
});
