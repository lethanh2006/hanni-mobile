import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppText, Card, Icon, IconTile, PageHeader, Screen } from '@/components/ui';
import { alpha, Fonts } from '@/constants/theme';
import { PRACTICE_SECTIONS, type PracticeTool } from '@/features/practice/sections';
import { useTheme } from '@/hooks/use-theme';

/** Ô công cụ (`.panel.hover-card` của web): ô biểu tượng trung tính + tên đậm + 1 dòng mô tả. */
function ToolCard({ tool }: { tool: PracticeTool }) {
  const href = tool.href;
  return (
    <Card onPress={href ? () => router.push(href) : undefined} style={[styles.tool, !href && styles.soon]}>
      <IconTile icon={tool.icon} iconSize={20} />
      <View>
        <AppText weight="700">{tool.label}</AppText>
        <AppText variant="caption" color="muted" style={styles.desc}>
          {href ? tool.description : 'Sắp có trên app'}
        </AppText>
      </View>
    </Card>
  );
}

/** Tra từ nhanh: gửi thẳng sang tab Từ điển (`/tu-dien?q=…`) như ô tra ở trang Luyện tập của web. */
function QuickSearch() {
  const theme = useTheme();
  const [q, setQ] = useState('');
  const [focused, setFocused] = useState(false);
  const submit = () => {
    const term = q.trim();
    router.navigate(term ? { pathname: '/tu-dien', params: { q: term } } : '/tu-dien');
  };
  return (
    <View style={styles.search}>
      <TextInput
        value={q}
        onChangeText={setQ}
        onSubmitEditing={submit}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        returnKeyType="search"
        placeholder="Tra từ: 你好, nihao, học sinh…"
        placeholderTextColor={theme.muted}
        accessibilityLabel="Tra từ"
        style={[
          styles.input,
          {
            color: theme.text,
            backgroundColor: theme.surface,
            borderColor: focused ? theme.primary : theme.border,
            boxShadow: focused ? `0 0 0 4px ${alpha(theme.primary, 0.1)}` : undefined,
          },
        ]}
      />
      <Pressable
        onPress={submit}
        accessibilityRole="button"
        accessibilityLabel="Tra từ"
        style={({ pressed }) => [styles.searchButton, { backgroundColor: theme.primary, opacity: pressed ? 0.85 : 1 }]}>
        <Icon name="search" size={18} color="primaryText" />
      </Pressable>
    </View>
  );
}

/** Tab Luyện tập (trang `/luyen-tap` của web): mọi cách luyện thêm ngoài lộ trình, mỗi công cụ một ô. */
export default function PracticeTab() {
  return (
    <Screen contentStyle={styles.page}>
      <View style={styles.head}>
        <PageHeader
          icon="grid"
          title="Luyện tập"
          description="Luyện thêm ngoài lộ trình — nghe, nói, viết đều lấy từ của bài bạn đang học."
        />
        <QuickSearch />
      </View>
      {PRACTICE_SECTIONS.map((section) => (
        <View key={section.title}>
          <AppText weight="700" color="muted" style={styles.sectionTitle}>
            {section.title}
          </AppText>
          <View style={styles.grid}>
            {section.items.map((tool) => (
              <View key={tool.label} style={styles.cell}>
                <ToolCard tool={tool} />
              </View>
            ))}
          </View>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { gap: 28 },
  head: { gap: 10 },
  search: { flexDirection: 'row', gap: 8 },
  input: {
    flex: 1,
    minWidth: 0,
    height: 44,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontFamily: Fonts.sans,
    fontSize: 14,
  },
  searchButton: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6, rowGap: 12 },
  cell: { width: '50%', paddingHorizontal: 6 },
  tool: { flex: 1, padding: 16, gap: 12 },
  desc: { marginTop: 2, lineHeight: 20 },
  soon: { opacity: 0.55 },
});
