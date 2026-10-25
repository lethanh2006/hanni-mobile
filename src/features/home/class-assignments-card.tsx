import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, Card, SectionTitle, TextLink } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { dueLabel, useMyAssignments } from '@/lib/classrooms';
import { appHref } from '@/lib/notifications';

/** Bài giáo viên giao mà mình CHƯA làm — ngay dưới thẻ Học tiếp (chỉ hiện khi có). */
export function ClassAssignmentsCard() {
  const theme = useTheme();
  const { data } = useMyAssignments();
  if (!data?.length) return null;

  return (
    <Card style={{ borderColor: theme.primary }}>
      <SectionTitle
        title={`Bài tập của lớp (${data.length})`}
        right={<TextLink title="Lớp học →" onPress={() => router.push('/lop-hoc')} />}
      />
      {data.slice(0, 3).map((a) => {
        const due = dueLabel(a.dueAt);
        return (
          <View key={a.id} style={[styles.row, { backgroundColor: theme.surface2 }]}>
            <View style={styles.flex}>
              <AppText variant="small" bold>
                {a.label}
              </AppText>
              <AppText variant="caption" color={due?.overdue ? 'danger' : 'muted'}>
                {a.className}
                {due ? ` · ${due.text}` : ''}
              </AppText>
            </View>
            <Button title="Làm ngay" onPress={() => router.push(appHref(a.href, '/'))} />
          </View>
        );
      })}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, borderRadius: 12, padding: Spacing.md },
  flex: { flex: 1, gap: 2 },
});
