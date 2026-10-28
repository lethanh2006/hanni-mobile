import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppText, Avatar, Button, Card, Hanzi, Icon, IconTile, Loading, PageHeader, Screen, SectionHeading, type IconName } from '@/components/ui';
import { alpha, Fonts } from '@/constants/theme';
import { DangerZone } from '@/features/account/danger-zone';
import { PasswordForm } from '@/features/account/password-form';
import { PremiumCard } from '@/features/account/premium-card';
import { ReferralCard } from '@/features/account/referral-card';
import { JoinClassForm } from '@/features/classroom/join-class-form';
import { useTheme } from '@/hooks/use-theme';
import { useRequireAuth } from '@/lib/auth';
import { useMyClassrooms } from '@/lib/classrooms';
import { TIMEZONES } from '@/lib/timezones';

/** Thêm 1 lối vào lớp học ngoài mục "Lớp học" ở menu — như Duolingo: học viên nhập mã lớp ở Cài đặt. */
function ClassroomCard() {
  const { data } = useMyClassrooms();
  const count = (data?.owned.length ?? 0) + (data?.joined.length ?? 0);
  return (
    <Card style={styles.card}>
      <View style={styles.cardHead}>
        <IconTile icon="users" iconSize={20} />
        <View style={styles.flex}>
          <AppText weight="600">Lớp học</AppText>
          <AppText color="muted" style={styles.desc}>
            {count > 0
              ? `Bạn đang ở ${count} lớp.`
              : 'Giáo viên gửi mã lớp cho bạn? Nhập ở đây để nhận bài được giao ngay ở Trang chủ.'}
          </AppText>
        </View>
        {count > 0 && <Button title="Mở lớp học" variant="secondary" onPress={() => router.navigate('/lop-hoc')} />}
      </View>
      <View style={styles.join}>
        <JoinClassForm />
      </View>
      <AppText color="muted" style={styles.teach}>
        Bạn dạy tiếng Trung?{' '}
        <AppText weight="600" color="primary" onPress={() => router.navigate('/lop-hoc')}>
          Tạo lớp miễn phí
        </AppText>
      </AppText>
    </Card>
  );
}

/** Tài khoản của tôi (trang `/account` của web): hồ sơ, bảo mật, lớp học, mời bạn bè, nhịp học, Premium, hành trình. */
export default function AccountScreen() {
  const theme = useTheme();
  const { user, logout, refresh } = useRequireAuth();
  const [leaving, setLeaving] = useState(false);

  if (!user) {
    return (
      <Screen>
        <Loading />
      </Screen>
    );
  }

  async function signOut() {
    setLeaving(true);
    await logout();
    router.dismissTo('/');
  }

  const timezone = TIMEZONES.find((t) => t.value === user.timezone)?.label ?? user.timezone;
  const locale = user.locale.toLowerCase().startsWith('vi')
    ? 'Tiếng Việt'
    : user.locale.toLowerCase().startsWith('en')
      ? 'Tiếng Anh'
      : user.locale;
  const journey: { href: Parameters<typeof router.push>[0]; icon: IconName; label: string }[] = [
    { href: '/progress', icon: 'chart', label: 'Tiến độ học tập' },
    { href: '/achievements', icon: 'trophy', label: 'Bộ sưu tập huy hiệu' },
    { href: '/', icon: 'route', label: 'Lộ trình HSK' },
    { href: `/u/${user.id}`, icon: 'user', label: 'Hồ sơ công khai' },
  ];

  return (
    <Screen contentStyle={styles.page}>
      <View style={styles.head}>
        <PageHeader
          icon="user"
          tone="lavender"
          title="Tài khoản của tôi"
          description="Hồ sơ, mật khẩu, lớp học, Premium và mời bạn bè."
        />
        <Button
          title="Cài đặt học tập"
          leftIcon="settings"
          variant="secondary"
          onPress={() => router.push('/settings')}
          style={styles.self}
        />
      </View>

      <View style={styles.column}>
        {/* Hồ sơ: dải bìa đỏ nhạt có chữ 你好 mờ, nhãn "Học viên Hanni", ảnh đại diện to đè lên mép bìa. */}
        <Card
          style={[
            styles.profile,
            { borderColor: alpha(theme.primary, 0.2), boxShadow: `0 4px 6px -1px ${alpha(theme.text, 0.1)}` },
          ]}>
          <View
            style={[
              styles.banner,
              {
                borderColor: alpha(theme.primary, 0.15),
                backgroundImage: `linear-gradient(90deg, ${alpha(theme.primary, 0.15)}, ${alpha(theme.primary, 0.08)}, ${alpha(theme.accent, 0.1)})`,
              },
            ]}>
            <View style={[styles.badge, { backgroundColor: alpha(theme.surface, 0.8) }]}>
              <AppText variant="caption" weight="700" color="primary">
                Học viên Hanni
              </AppText>
            </View>
            <Text style={[styles.ghost, { fontFamily: Fonts.hanzi, color: alpha(theme.primary, 0.12) }]}>你好</Text>
          </View>
          <View style={styles.profileBody}>
            <View style={styles.avatarRow}>
              <View style={[styles.avatarRing, { backgroundColor: theme.surface }]}>
                <Avatar user={user} size={80} />
              </View>
              <View style={[styles.verified, { backgroundColor: theme.surface2 }]}>
                <Icon name={user.emailVerifiedAt ? 'check' : 'info'} size={13} color="muted" />
                <AppText variant="caption" color="muted">
                  {user.emailVerifiedAt ? 'Email đã xác minh' : 'Email chưa xác minh'}
                </AppText>
              </View>
            </View>
            <AppText weight="600" style={styles.name}>
              {user.displayName}
            </AppText>
            <AppText color="muted" style={styles.email}>
              {user.email}
            </AppText>
            <View style={[styles.dl, { borderColor: theme.border }]}>
              {[
                ['Tên hiển thị', user.displayName],
                ['Múi giờ học tập', timezone],
                ['Ngôn ngữ tài khoản', locale],
              ].map(([k, v], i) => (
                <View key={k} style={[styles.dlRow, i > 0 && { borderTopWidth: 1, borderColor: theme.border }]}>
                  <AppText color="muted">{k}</AppText>
                  <AppText weight="500" style={styles.dd}>
                    {v}
                  </AppText>
                </View>
              ))}
            </View>
          </View>
        </Card>

        <Card style={styles.card}>
          <View style={styles.cardHead}>
            <IconTile icon="lock" iconSize={20} />
            <View style={styles.flex}>
              <AppText weight="600">Bảo mật tài khoản</AppText>
              <AppText color="muted" style={styles.desc}>
                {user.hasPassword
                  ? 'Đổi mật khẩu ngay tại đây, hoặc đặt lại qua email nếu bạn quên.'
                  : 'Bạn đang đăng nhập qua Google. Có thể đặt thêm mật khẩu để đăng nhập bằng email.'}
              </AppText>
            </View>
          </View>
          <PasswordForm hasPassword={user.hasPassword} onChanged={() => void refresh()} />
          <View style={[styles.security, { borderColor: theme.border }]}>
            {user.hasPassword && <Button title="Quên mật khẩu?" variant="ghost" onPress={() => router.push('/forgot-password')} />}
            <Button
              title={leaving ? 'Đang đăng xuất…' : 'Đăng xuất'}
              leftIcon="logout"
              variant="ghost"
              disabled={leaving}
              onPress={() => void signOut()}
            />
          </View>
        </Card>
        <ClassroomCard />
        <ReferralCard userId={user.id} />
        <DangerZone hasPassword={user.hasPassword} />

        <Card style={styles.card}>
          <View style={styles.rhythmHead}>
            <Icon name="target" size={19} color="primary" />
            <AppText weight="600">Nhịp học của bạn</AppText>
          </View>
          {user.settings ? (
            <>
              <AppText weight="600" style={styles.goal}>
                {user.settings.dailyGoalValue}
                <AppText color="muted">
                  {'  '}
                  {user.settings.dailyGoalType === 'MINUTES' ? 'phút / ngày' : 'từ ôn / ngày'}
                </AppText>
              </AppText>
            </>
          ) : (
            <AppText color="muted">Chọn mục tiêu và lịch ôn phù hợp trong cài đặt học tập.</AppText>
          )}
          <Pressable onPress={() => router.push('/settings')} style={[styles.adjust, { borderColor: theme.border }]}>
            <AppText weight="500" color="primary">
              Điều chỉnh mục tiêu
            </AppText>
            <Icon name="arrow" size={16} color="primary" />
          </Pressable>
        </Card>
        <PremiumCard />
        <Card style={styles.card}>
          <View style={styles.journeyHead}>
            <SectionHeading icon="route" tone="lavender" title="Hành trình của tôi" />
          </View>
          {journey.map((item) => (
            <Pressable
              key={item.label}
              onPress={() => router.navigate(item.href)}
              style={({ pressed }) => [styles.journey, pressed && { backgroundColor: alpha(theme.primary, 0.05) }]}>
              <Icon name={item.icon} size={18} color="muted" />
              <AppText color="muted" style={styles.flex}>
                {item.label}
              </AppText>
              <Icon name="arrow" size={15} color="muted" />
            </Pressable>
          ))}
        </Card>
        <View style={[styles.quote, { borderColor: alpha(theme.primary, 0.15), backgroundColor: alpha(theme.primary, 0.05) }]}>
          <Hanzi size={24} color="primary" style={styles.quoteZh}>
            学无止境
          </Hanzi>
          <AppText weight="500">Học không có điểm dừng.</AppText>
          <AppText variant="caption" color="muted" style={styles.quoteText}>
            Hanni đồng hành cùng bạn qua từng bài học nhỏ.
          </AppText>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { gap: 28 },
  head: { gap: 10 },
  self: { alignSelf: 'flex-start' },
  column: { gap: 20 },
  flex: { flex: 1, minWidth: 0 },
  card: { gap: 0 },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  desc: { marginTop: 4, lineHeight: 24 },
  join: { marginTop: 16 },
  teach: { marginTop: 12 },
  profile: { padding: 0, gap: 0, overflow: 'hidden' },
  banner: {
    height: 128,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    overflow: 'hidden',
    borderBottomWidth: 1,
    paddingHorizontal: 28,
    paddingVertical: 12,
  },
  badge: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 },
  ghost: { fontSize: 128, lineHeight: 140, fontWeight: '700', marginBottom: -24 },
  profileBody: { paddingHorizontal: 24, paddingBottom: 24 },
  avatarRow: { marginTop: -36, marginBottom: 20, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 },
  avatarRing: { borderRadius: 999, padding: 3 },
  verified: { marginBottom: 4, flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  name: { fontSize: 20, lineHeight: 28 },
  email: { marginTop: 4 },
  dl: { marginTop: 24, borderTopWidth: 1 },
  dlRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8, paddingVertical: 16 },
  dd: { flexShrink: 1, textAlign: 'right' },
  security: { marginTop: 20, paddingTop: 16, borderTopWidth: 1, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12 },
  rhythmHead: { marginBottom: 20, flexDirection: 'row', alignItems: 'center', gap: 8 },
  goal: { fontSize: 30, lineHeight: 36 },
  adjust: { marginTop: 20, paddingTop: 16, borderTopWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  journeyHead: { marginBottom: 8 },
  journey: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 12 },
  quote: { borderWidth: 1, borderRadius: 16, padding: 20 },
  quoteZh: { marginBottom: 8 },
  quoteText: { marginTop: 8, lineHeight: 20 },
});
