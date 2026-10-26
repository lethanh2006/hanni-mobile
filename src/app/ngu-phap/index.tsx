import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import useSWR from 'swr';

import { AppText, Card, EmptyState, Hanzi, Loading, Screen } from '@/components/ui';
import { alpha } from '@/constants/theme';
import { LearnCta } from '@/features/grammar/learn-cta';
import { useTheme } from '@/hooks/use-theme';
import type { GrammarListItem } from '@/lib/types';

const LEVELS = [1, 2, 3, 4, 5, 6, 7];

/** Ngữ pháp HSK (`/ngu-phap` của web), giải thích bằng tiếng Việt. Chỉ liệt kê điểm CÓ giải thích thật (`flat !== true`). */
export default function GrammarListScreen() {
  const theme = useTheme();
  const [level, setLevel] = useState(1);
  const { data, error } = useSWR<GrammarListItem[]>(`/grammar?level=${level}`, { keepPreviousData: true });
  const items = (data ?? []).filter((g) => g.flat !== true);

  return (
    <Screen contentStyle={styles.page}>
      <Stack.Screen options={{ title: 'Ngữ pháp' }} />
      <View style={styles.hero}>
        <AppText variant="caption" weight="600" color="muted" style={styles.eyebrow}>
          NGỮ PHÁP TIẾNG TRUNG
        </AppText>
        <AppText weight="700" center style={styles.title}>
          Ngữ pháp HSK {level === 7 ? '7–9' : level}
        </AppText>
        <AppText color="muted" center style={styles.lead}>
          Giải thích bằng tiếng Việt, kèm mẫu câu và ví dụ có pinyin — không phải bản dịch máy. Tra cứu miễn phí, không cần
          đăng nhập.
        </AppText>
      </View>

      <View style={styles.levels} accessibilityLabel="Lọc theo cấp HSK">
        {LEVELS.map((lv) => {
          const on = level === lv;
          return (
            <Pressable
              key={lv}
              onPress={() => setLevel(lv)}
              accessibilityState={{ selected: on }}
              style={[
                styles.level,
                on ? { borderColor: theme.primary, backgroundColor: alpha(theme.primary, 0.1) } : { borderColor: theme.border },
              ]}>
              <AppText weight="500" color={on ? 'primary' : 'muted'}>
                HSK {lv === 7 ? '7–9' : lv}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      {error ? (
        <EmptyState title="Chưa tải được ngữ pháp" description="Bạn kiểm tra kết nối rồi thử lại nhé." />
      ) : !data ? (
        <Loading />
      ) : items.length === 0 ? (
        <Card>
          <AppText color="muted" center>
            Cấp này chưa có điểm ngữ pháp nào được giải thích chi tiết.
          </AppText>
        </Card>
      ) : (
        <View style={styles.list}>
          {items.map((g) => (
            <Card key={g.slug} onPress={() => router.push(`/ngu-phap/${encodeURIComponent(g.slug)}`)} style={styles.item}>
              <Hanzi size={24} color="primary">
                {g.titleZh}
              </Hanzi>
              <AppText weight="600">{g.titleVi}</AppText>
              <AppText variant="caption" color="muted" numberOfLines={2} style={styles.summary}>
                {g.summaryVi}
              </AppText>
            </Card>
          ))}
        </View>
      )}

      <LearnCta
        title="Học ngữ pháp cùng từ vựng, không tách rời"
        text="Hanni gắn điểm ngữ pháp vào đúng bài học chứa từ vựng liên quan, nên bạn gặp lại cấu trúc ngay khi đang dùng nó."
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { gap: 28, paddingTop: 40 },
  hero: { alignItems: 'center' },
  eyebrow: { letterSpacing: 1.7 },
  title: { marginTop: 12, fontSize: 30, lineHeight: 36, letterSpacing: -0.75 },
  lead: { marginTop: 12, lineHeight: 28 },
  levels: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  level: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8 },
  list: { gap: 12 },
  item: { gap: 8, padding: 16 },
  summary: { lineHeight: 20 },
});
