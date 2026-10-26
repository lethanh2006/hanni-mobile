import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Avatar, Card, ErrorNote, Icon, IconTile, Loading, Screen, ShareButton, Stat } from '@/components/ui';
import { alpha } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { WEB_ORIGIN } from '@/lib/api';
import { useRequireAuth } from '@/lib/auth';
import { usePublicProfile } from '@/lib/hooks';
import { pairs } from '@/lib/pairs';

const joinedLabel = (iso: string) => new Date(iso).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });

/** Hồ sơ công khai (trang `/u/[id]` của web): chuỗi ngày học, số liệu, huy hiệu đã mở. */
export default function PublicProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useRequireAuth();
  const theme = useTheme();
  const { data: p, error } = usePublicProfile(id);

  if (error) {
    return (
      <Screen contentStyle={styles.errorPage}>
        <ErrorNote>Không tải được hồ sơ này.</ErrorNote>
        <Pressable onPress={() => router.navigate('/leaderboard')} style={styles.self} hitSlop={6}>
          <AppText weight="600" color="primary">
            ← Về bảng xếp hạng
          </AppText>
        </Pressable>
      </Screen>
    );
  }
  if (!user || !p) {
    return (
      <Screen>
        <Loading />
      </Screen>
    );
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: p.isMe ? 'Hồ sơ của bạn' : p.displayName }} />
      <Card style={styles.profile}>
        <View style={styles.identity}>
          <Avatar user={p} size={64} />
          <View style={styles.flex}>
            <View style={styles.name}>
              <AppText weight="700" style={styles.nameText}>
                {p.displayName}
              </AppText>
              {p.equippedTitle && (
                <View style={[styles.badge, { backgroundColor: alpha(theme.good, 0.1) }]}>
                  <AppText variant="caption" weight="700" color="good">
                    {p.equippedTitle}
                  </AppText>
                </View>
              )}
              {p.isPremium && (
                <View style={[styles.badge, { backgroundColor: alpha(theme.accent, 0.1) }]}>
                  <Icon name="crown" size={11} color="accent" />
                  <AppText variant="caption" weight="700" color="accent">
                    PREMIUM
                  </AppText>
                </View>
              )}
            </View>
            <AppText variant="caption" color="muted">
              Tham gia từ {joinedLabel(p.joinedAt)}
            </AppText>
          </View>
        </View>
        {p.isMe && (
          <ShareButton
            message={`Mình đã học được ${p.learnedWordsCount} từ và giữ chuỗi ${p.currentStreak} ngày trên Hanni — cùng học tiếng Trung nhé! ${WEB_ORIGIN}/u/${p.id}`}
          />
        )}
      </Card>

      <View style={styles.grid}>
        {(
          [
            { label: 'Chuỗi ngày học', value: p.currentStreak, hint: `Kỷ lục ${p.longestStreak} ngày`, icon: 'flame', tone: 'warn' },
            { label: 'Từ đã thuộc', value: p.learnedWordsCount, icon: 'book', tone: 'good' },
            { label: 'Bài đã xong', value: p.completedLessonsCount, icon: 'route', tone: 'lavender' },
            { label: 'Huy hiệu', value: p.achievements.length, icon: 'trophy', tone: 'primary' },
          ] as const
        ).map((s) => (
          <View key={s.label} style={styles.cell}>
            <Stat {...s} />
          </View>
        ))}
      </View>

      <Card style={styles.badges}>
        <AppText weight="600" style={[styles.heading, { borderColor: theme.border }]}>
          Huy hiệu
        </AppText>
        {p.achievements.length === 0 ? (
          <AppText color="muted" center style={styles.empty}>
            Chưa mở khoá huy hiệu nào.
          </AppText>
        ) : (
          <View style={styles.achievements}>
            {pairs(p.achievements).map((row) => (
              <View key={row[0].code} style={styles.pair}>
                {row.map((a) => (
                  <View key={a.code} style={[styles.achievement, { borderColor: theme.border }]}>
                    <IconTile size={40}>
                      <Icon name="trophy" size={16} color="primary" />
                    </IconTile>
                    <View style={styles.flex}>
                      <AppText weight="600" numberOfLines={1}>
                        {a.nameVi}
                      </AppText>
                      <AppText variant="caption" color="muted" numberOfLines={1}>
                        {a.descriptionVi}
                      </AppText>
                    </View>
                  </View>
                ))}
                {row.length === 1 && <View style={styles.flex} />}
              </View>
            ))}
          </View>
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  errorPage: { gap: 16 },
  self: { alignSelf: 'flex-start' },
  profile: { gap: 16 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  flex: { flex: 1, minWidth: 0 },
  name: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  nameText: { fontSize: 18, lineHeight: 28 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -8, rowGap: 16 },
  cell: { width: '50%', paddingHorizontal: 8 },
  badges: { gap: 0 },
  heading: { marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1 },
  empty: { paddingVertical: 24 },
  achievements: { gap: 12 },
  pair: { flexDirection: 'row', gap: 12 },
  achievement: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
});
