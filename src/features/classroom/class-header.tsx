import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Avatar, Icon } from '@/components/ui';
import type { ClassDetail } from '@/lib/classrooms';
import { hskLabel } from '@/lib/hsk';

/** Đầu trang 1 lớp (`Header` của web): "← Lớp học", tên lớp, cấp · số học viên · giáo viên (học viên mới thấy). */
export function ClassHeader({ data }: { data: ClassDetail }) {
  const c = data.class;
  return (
    <View>
      <Pressable onPress={() => router.navigate('/lop-hoc')} style={styles.back} hitSlop={6}>
        <Icon name="back" size={14} color="muted" />
        <AppText variant="caption" weight="600" color="muted">
          Lớp học
        </AppText>
      </Pressable>
      <AppText weight="800" style={styles.name}>
        {c.name}
      </AppText>
      <View style={styles.meta}>
        {c.hskLevel ? (
          <>
            <AppText color="muted">{hskLabel(c.hskLevel)}</AppText>
            <AppText color="muted">·</AppText>
          </>
        ) : null}
        <AppText color="muted">{c.memberCount} học viên</AppText>
        {data.role === 'member' && (
          <>
            <AppText color="muted">·</AppText>
            <View style={styles.teacher}>
              <AppText color="muted">Giáo viên</AppText>
              <Avatar user={data.class.teacher} size={20} />
              <AppText weight="700">{data.class.teacher.displayName}</AppText>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  back: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' },
  name: { marginTop: 4, fontSize: 24, lineHeight: 32, letterSpacing: -0.6 },
  meta: { marginTop: 4, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 8 },
  teacher: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
