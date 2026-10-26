import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Button, Card, Icon } from '@/components/ui';
import { alpha } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { dueLabel, useMyAssignments } from '@/lib/classrooms';
import { appHref } from '@/lib/notifications';

/** Bài giáo viên giao mà mình CHƯA làm (`ClassAssignmentsCard` của web) — ngay trên lộ trình, chỉ hiện khi có. */
export function ClassAssignmentsCard() {
  const theme = useTheme();
  const { data } = useMyAssignments();
  if (!data?.length) return null;

  return (
    <Card style={[styles.card, { borderColor: alpha(theme.primary, 0.25) }]}>
      <View style={styles.head}>
        <View style={styles.title}>
          <Icon name="flag" size={16} color="primary" />
          <AppText weight="700">Bài tập của lớp</AppText>
          <View style={[styles.count, { backgroundColor: theme.primary }]}>
            <AppText variant="caption" color="primaryText">
              {data.length}
            </AppText>
          </View>
        </View>
        <Pressable onPress={() => router.navigate('/lop-hoc')} hitSlop={6}>
          <AppText variant="caption" weight="600" color="primary">
            Lớp học →
          </AppText>
        </Pressable>
      </View>
      <View style={styles.list}>
        {data.slice(0, 3).map((a) => {
          const due = dueLabel(a.dueAt);
          return (
            <View key={a.id} style={[styles.row, { backgroundColor: alpha(theme.surface2, 0.6) }]}>
              <AppText weight="600">{a.label}</AppText>
              <AppText variant="caption" color={due?.overdue ? 'danger' : 'muted'}>
                {a.className}
                {due ? ` · ${due.text}` : ''}
              </AppText>
              <Button title="Làm ngay" onPress={() => router.push(appHref(a.href, '/'))} style={styles.button} />
            </View>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, gap: 12 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  title: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  count: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  list: { gap: 8 },
  row: { borderRadius: 12, padding: 12, gap: 2 },
  button: { marginTop: 8, alignSelf: 'flex-start', paddingHorizontal: 12, minHeight: 40 },
});
