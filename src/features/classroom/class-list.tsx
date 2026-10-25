import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText, Card, Icon, SectionTitle } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import type { JoinedClass, OwnedClass } from '@/lib/classrooms';
import { hskLabel } from '@/lib/hsk';

function ClassRow({ id, name, detail, badge }: { id: string; name: string; detail: string; badge?: string }) {
  return (
    <Card onPress={() => router.push(`/lop-hoc/${id}`)}>
      <View style={styles.row}>
        <Icon name="users" size={22} color="lavender" />
        <View style={styles.flex}>
          <AppText bold>{name}</AppText>
          <AppText variant="caption" color="muted">
            {detail}
          </AppText>
          {badge && (
            <AppText variant="caption" bold color="primary">
              {badge}
            </AppText>
          )}
        </View>
        <Icon name="chevron" size={16} color="muted" />
      </View>
    </Card>
  );
}

/** Lớp tôi dạy + lớp tôi học. */
export function ClassList({ owned, joined }: { owned: OwnedClass[]; joined: JoinedClass[] }) {
  return (
    <>
      {owned.length > 0 && <SectionTitle title="Lớp tôi dạy" />}
      {owned.map((c) => (
        <ClassRow
          key={c.id}
          id={c.id}
          name={c.name}
          detail={`${c.hskLevel ? `${hskLabel(c.hskLevel)} · ` : ''}${c.memberCount} học viên · ${c.assignmentCount} bài giao · mã ${c.code}`}
        />
      ))}
      {joined.length > 0 && <SectionTitle title="Lớp tôi học" />}
      {joined.map((c) => (
        <ClassRow
          key={c.id}
          id={c.id}
          name={c.name}
          detail={`Giáo viên ${c.teacher.displayName} · ${c.memberCount} học viên`}
          badge={c.pendingCount > 0 ? `${c.pendingCount} bài chưa làm` : undefined}
        />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  flex: { flex: 1, gap: 2 },
});
