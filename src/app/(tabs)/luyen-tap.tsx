import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText, Card, Icon, PageHeader, Screen, SectionTitle } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { PRACTICE_SECTIONS, type PracticeTool } from '@/features/practice/sections';
import { useTheme } from '@/hooks/use-theme';

function ToolCard({ tool }: { tool: PracticeTool }) {
  const theme = useTheme();
  const href = tool.href;
  return (
    <Card onPress={href ? () => router.push(href) : undefined} style={[styles.tool, !href && styles.soon]}>
      <View style={[styles.icon, { backgroundColor: theme.primarySoft }]}>
        <Icon name={tool.icon} size={20} color="primary" />
      </View>
      <AppText bold>{tool.label}</AppText>
      <AppText variant="caption" color="muted">
        {href ? tool.description : 'Sắp có trên app'}
      </AppText>
    </Card>
  );
}

/** Tab Luyện tập: nghe, nói, viết, trò chơi, tra cứu — luyện thêm ngoài lộ trình. */
export default function PracticeTab() {
  return (
    <Screen>
      <PageHeader icon="grid" title="Luyện tập" description="Luyện thêm theo cách bạn thích, ngoài lộ trình bài học." />
      {PRACTICE_SECTIONS.map((section) => (
        <View key={section.title} style={styles.section}>
          <SectionTitle title={section.title} />
          <View style={styles.grid}>
            {section.items.map((tool) => (
              <ToolCard key={tool.label} tool={tool} />
            ))}
          </View>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: Spacing.md },
  tool: { width: '48%', gap: 6 },
  soon: { opacity: 0.55 },
  icon: { width: 40, height: 40, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
});
