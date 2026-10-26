import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Avatar, Icon, IconTile } from '@/components/ui';
import { alpha, Fonts, panelShadow } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { JoinedClass, OwnedClass } from '@/lib/classrooms';
import { hskLabel } from '@/lib/hsk';

/** Ô lớp (`.panel.hover-card` của web). */
function ClassCard({ id, children }: { id: string; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={() => router.push(`/lop-hoc/${id}`)}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: pressed ? alpha(theme.primary, 0.3) : alpha(theme.border, 0.8),
          boxShadow: panelShadow(theme),
        },
      ]}>
      {children}
    </Pressable>
  );
}

/** "Lớp bạn dạy" + "Lớp bạn học" (đầu trang `/lop-hoc` của web khi đã có lớp). */
export function ClassList({ owned, joined }: { owned: OwnedClass[]; joined: JoinedClass[] }) {
  const theme = useTheme();
  return (
    <>
      {owned.length > 0 && (
        <View style={styles.section}>
          <AppText weight="700">Lớp bạn dạy</AppText>
          {owned.map((c) => (
            <ClassCard key={c.id} id={c.id}>
              <IconTile icon="users" iconSize={18} size={40} />
              <View style={styles.flex}>
                <AppText weight="700" numberOfLines={1}>
                  {c.name}
                </AppText>
                <AppText variant="caption" color="muted" style={styles.detail}>
                  {c.hskLevel ? `${hskLabel(c.hskLevel)} · ` : ''}
                  {c.memberCount} học viên · {c.assignmentCount} bài đã giao
                </AppText>
              </View>
              <View style={[styles.code, { backgroundColor: theme.surface2 }]}>
                <AppText variant="caption" weight="700" style={styles.codeText}>
                  {c.code}
                </AppText>
              </View>
              <Icon name="arrow" size={16} color="muted" />
            </ClassCard>
          ))}
        </View>
      )}
      {joined.length > 0 && (
        <View style={styles.section}>
          <AppText weight="700">Lớp bạn học</AppText>
          {joined.map((c) => (
            <ClassCard key={c.id} id={c.id}>
              <Avatar user={c.teacher} size={40} />
              <View style={styles.flex}>
                <AppText weight="700" numberOfLines={1}>
                  {c.name}
                </AppText>
                <AppText variant="caption" color="muted" numberOfLines={1} style={styles.detail}>
                  Giáo viên {c.teacher.displayName} · {c.memberCount} học viên
                </AppText>
              </View>
              {c.pendingCount > 0 && (
                <View style={[styles.pending, { backgroundColor: theme.primary }]}>
                  <AppText variant="caption" weight="700" color="primaryText">
                    {c.pendingCount} bài cần làm
                  </AppText>
                </View>
              )}
              <Icon name="arrow" size={16} color="muted" />
            </ClassCard>
          ))}
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  section: { gap: 12 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 16, padding: 16 },
  flex: { flex: 1, minWidth: 0 },
  detail: { marginTop: 2 },
  code: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  codeText: { fontFamily: Fonts.mono, letterSpacing: 2 },
  pending: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
});
