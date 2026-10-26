import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import useSWR from 'swr';

import { AppText, Icon } from '@/components/ui';
import { alpha } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { MockPracticeSetMeta } from '@/lib/types';

import { partInfo, SECTION_SHORT } from './part-info';

const SECTION_ICON = { listening: 'headphones', reading: 'book', writing: 'pencil' } as const;

/**
 * "Luyện từng dạng bài" của cấp đang chọn (khối cuối `MockExamList` của web): mỗi phần đề gom câu từ mọi đề cùng
 * cấp, làm câu nào chữa câu đó.
 */
export function PracticeSets({ level }: { level: number }) {
  const theme = useTheme();
  const { data } = useSWR<MockPracticeSetMeta[]>('/mock-exams/practice');
  const sets = (data ?? []).filter((s) => s.level === level);
  if (sets.length === 0) return null;

  return (
    <View style={[styles.box, { borderColor: theme.border, backgroundColor: theme.surface }]}>
      <AppText weight="700">Luyện từng dạng bài</AppText>
      <AppText variant="caption" color="muted" style={styles.desc}>
        Chỉ luyện đúng dạng câu mình hay sai — gom từ mọi đề cùng cấp, làm câu nào chữa câu đó.
      </AppText>
      <View style={styles.list}>
        {sets.map((s) => (
          <Pressable
            key={s.slug}
            onPress={() => router.push(`/thi-thu-hsk/dang-bai/${s.slug}`)}
            style={({ pressed }) => [
              styles.row,
              pressed
                ? { borderColor: alpha(theme.primary, 0.4), backgroundColor: alpha(theme.primary, 0.05) }
                : { borderColor: theme.border },
            ]}>
            <Icon name={SECTION_ICON[s.section]} size={15} color="primary" />
            <AppText numberOfLines={1} style={styles.flex}>
              <AppText weight="600">
                {SECTION_SHORT[s.section]} {s.part}
              </AppText>{' '}
              · {partInfo(s.section, s.type).label}
            </AppText>
            <AppText variant="caption" color="muted">
              {s.count} câu
            </AppText>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderWidth: 1, borderRadius: 16, padding: 16 },
  desc: { marginTop: 2 },
  list: { marginTop: 12, gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  flex: { flex: 1, minWidth: 0 },
});
