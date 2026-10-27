import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText, Button, Icon, type IconName } from '@/components/ui';
import { alpha } from '@/constants/theme';
import { ToneCheck } from '@/features/tone/tone-check';
import { useTheme } from '@/hooks/use-theme';

import { SentencePractice } from './sentence-practice';

type Tab = 'tone' | 'sentence' | 'write';
const TABS: { key: Tab; label: string; icon: IconName }[] = [
  { key: 'tone', label: 'Đọc & chấm thanh', icon: 'mic' },
  { key: 'sentence', label: 'Đặt câu (AI)', icon: 'spark' },
  { key: 'write', label: 'Viết chữ', icon: 'pencil' },
];

/** "Luyện với từ này" (`WordPractice` của web): chấm thanh điệu, đặt câu AI chấm, tập viết — một khung có tab. */
export function WordPractice({
  word,
}: {
  word: { id: string; simplified: string; pinyin: string; pinyinNumeric: string; audioUrl: string | null; meaningVi: string | null };
}) {
  const theme = useTheme();
  const [tab, setTab] = useState<Tab>('tone');
  const firstChar = Array.from(word.simplified).find((c) => /\p{Script=Han}/u.test(c)) ?? word.simplified;
  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs} style={styles.tabBar}>
        {TABS.map((t) => {
          const on = tab === t.key;
          return (
            <Pressable
              key={t.key}
              onPress={() => setTab(t.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              style={({ pressed }) => [
                styles.tab,
                on ? { backgroundColor: alpha(theme.primary, 0.1) } : pressed && { backgroundColor: theme.surface2 },
              ]}>
              <Icon name={t.icon} size={15} color={on ? 'primary' : 'muted'} />
              <AppText weight="600" color={on ? 'primary' : 'muted'}>
                {t.label}
              </AppText>
            </Pressable>
          );
        })}
      </ScrollView>
      {tab === 'tone' && (
        <ToneCheck hanzi={word.simplified} pinyin={word.pinyin} pinyinNumeric={word.pinyinNumeric} audioUrl={word.audioUrl} align="start" />
      )}
      {tab === 'sentence' && <SentencePractice word={{ id: word.id, simplified: word.simplified, meaningVi: word.meaningVi }} />}
      {tab === 'write' && (
        <View style={styles.write}>
          <AppText color="muted">Xem thứ tự nét rồi tự tô từng chữ, Hanni chấm nét đúng/sai.</AppText>
          <Button
            title={`Tập viết ${firstChar}`}
            leftIcon="pencil"
            onPress={() => router.push({ pathname: '/writing', params: { c: firstChar } })}
            style={styles.self}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: { marginBottom: 16 },
  tabs: { gap: 6 },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6 },
  write: { gap: 12 },
  self: { alignSelf: 'flex-start' },
});
