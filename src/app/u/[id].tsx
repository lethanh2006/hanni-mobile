import { Stack, useLocalSearchParams } from 'expo-router';
import { Share, StyleSheet, View } from 'react-native';

import { AppText, Avatar, Button, Card, EmptyState, Icon, Loading, Screen, SectionTitle } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { StatGrid } from '@/features/progress/stat-grid';
import { useTheme } from '@/hooks/use-theme';
import { WEB_ORIGIN } from '@/lib/api';
import { useRequireAuth } from '@/lib/auth';
import { usePublicProfile } from '@/lib/hooks';
import { goBack } from '@/lib/navigation';

const joinedLabel = (iso: string) => new Date(iso).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });

/** Hồ sơ công khai: chuỗi ngày học, số liệu, huy hiệu đã mở. */
export default function PublicProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useRequireAuth();
  const theme = useTheme();
  const { data: p, error } = usePublicProfile(id);

  if (error) {
    return (
      <Screen>
        <EmptyState title="Không tải được hồ sơ này" description="Bạn thử lại sau nhé.">
          <Button title="Quay lại" variant="secondary" onPress={goBack} />
        </EmptyState>
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
      <Card>
        <View style={styles.row}>
          <Avatar user={p} size={64} />
          <View style={styles.flex}>
            <AppText variant="heading">{p.displayName}</AppText>
            <View style={styles.badges}>
              {p.equippedTitle && (
                <View style={[styles.badge, { backgroundColor: theme.goodSoft }]}>
                  <AppText variant="caption" bold color="good">
                    {p.equippedTitle}
                  </AppText>
                </View>
              )}
              {p.isPremium && (
                <View style={[styles.badge, { backgroundColor: theme.surface2 }]}>
                  <Icon name="crown" size={11} color="accent" />
                  <AppText variant="caption" bold color="accent">
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
          <Button
            title="Chia sẻ hồ sơ"
            icon="share"
            variant="secondary"
            onPress={() =>
              void Share.share({
                message: `Mình đã học được ${p.learnedWordsCount} từ và giữ chuỗi ${p.currentStreak} ngày trên Hanni — cùng học tiếng Trung nhé! ${WEB_ORIGIN}/u/${p.id}`,
              })
            }
          />
        )}
      </Card>

      <StatGrid
        stats={[
          { label: 'Chuỗi ngày học', value: p.currentStreak, hint: `Kỷ lục ${p.longestStreak} ngày`, icon: 'flame', color: 'warn' },
          { label: 'Từ đã thuộc', value: p.learnedWordsCount, icon: 'book', color: 'good' },
          { label: 'Bài đã xong', value: p.completedLessonsCount, icon: 'route', color: 'lavender' },
          { label: 'Huy hiệu', value: p.achievements.length, icon: 'trophy', color: 'primary' },
        ]}
      />

      <Card>
        <SectionTitle title="Huy hiệu" />
        {p.achievements.length === 0 ? (
          <AppText variant="small" color="muted">
            Chưa mở khoá huy hiệu nào.
          </AppText>
        ) : (
          p.achievements.map((a) => (
            <View key={a.code} style={[styles.achievement, { borderColor: theme.border }]}>
              <Icon name="trophy" size={18} color="primary" />
              <View style={styles.flex}>
                <AppText variant="small" bold>
                  {a.nameVi}
                </AppText>
                <AppText variant="caption" color="muted" numberOfLines={1}>
                  {a.descriptionVi}
                </AppText>
              </View>
            </View>
          ))
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  flex: { flex: 1, gap: 2 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: Radius.pill, paddingHorizontal: 8, paddingVertical: 2 },
  achievement: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, borderTopWidth: 1, paddingTop: Spacing.sm },
});
