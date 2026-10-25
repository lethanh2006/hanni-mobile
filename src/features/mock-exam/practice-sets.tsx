import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import useSWR from 'swr';

import { AppText, Card, Icon, SectionTitle } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import type { MockPracticeSetMeta } from '@/lib/types';

import { partInfo, SECTION_SHORT } from './part-info';

/** "Luyện từng dạng bài" của 1 cấp: mỗi phần đề gom câu từ mọi đề cùng cấp, làm câu nào chấm câu đó. */
export function PracticeSets({ level }: { level: number }) {
  const { data } = useSWR<MockPracticeSetMeta[]>('/mock-exams/practice');
  const sets = (data ?? []).filter((s) => s.level === level);
  if (sets.length === 0) return null;

  return (
    <Card>
      <SectionTitle title="Luyện từng dạng bài" />
      <AppText variant="small" color="muted">
        Không đồng hồ, làm câu nào chấm và chữa câu đó ngay.
      </AppText>
      {sets.map((s) => (
        <Card key={s.slug} onPress={() => router.push(`/thi-thu-hsk/dang-bai/${s.slug}`)}>
          <View style={styles.row}>
            <View style={styles.flex}>
              <AppText variant="small" bold>
                {SECTION_SHORT[s.section]} {s.part} · {partInfo(s.section, s.type).label}
              </AppText>
              <AppText variant="caption" color="muted">
                {s.count} câu
              </AppText>
            </View>
            <Icon name="chevron" size={16} color="muted" />
          </View>
        </Card>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  flex: { flex: 1, gap: 2 },
});
