import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Avatar, Button, Card, Loading, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { DangerZone } from '@/features/account/danger-zone';
import { MenuRow } from '@/features/account/menu-row';
import { PasswordForm } from '@/features/account/password-form';
import { PremiumCard } from '@/features/account/premium-card';
import { ReferralCard } from '@/features/account/referral-card';
import { useRequireAuth } from '@/lib/auth';
import { TIMEZONES } from '@/lib/timezones';

/** Tài khoản: hồ sơ, lối vào các trang cá nhân, bảo mật, mời bạn bè, xoá tài khoản. */
export default function AccountScreen() {
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
  const goal = user.settings
    ? `${user.settings.dailyGoalValue} ${user.settings.dailyGoalType === 'MINUTES' ? 'phút' : 'từ ôn'} mỗi ngày`
    : 'Chưa đặt mục tiêu';

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Tài khoản' }} />
      <Card>
        <View style={styles.row}>
          <Avatar user={user} size={64} />
          <View style={styles.flex}>
            <AppText variant="heading">{user.displayName}</AppText>
            <AppText variant="small" color="muted">
              {user.email}
            </AppText>
            <AppText variant="caption" color={user.emailVerifiedAt ? 'good' : 'muted'}>
              {user.emailVerifiedAt ? '✓ Email đã xác minh' : 'Email chưa xác minh'}
            </AppText>
          </View>
        </View>
        <AppText variant="small" color="muted">
          Múi giờ: {timezone} · Mục tiêu: {goal}
        </AppText>
      </Card>

      <Card>
        <MenuRow icon="chart" title="Tiến độ học tập" hint="Vốn từ, lịch 30 ngày, từ hay quên" href="/progress" />
        <MenuRow icon="trophy" title="Huy hiệu" hint="Bộ sưu tập huy hiệu và danh hiệu" href="/achievements" />
        <MenuRow icon="flame" title="Bảng xếp hạng" hint="Giải đấu tuần, chuỗi ngày học" href="/leaderboard" />
        <MenuRow icon="users" title="Lớp học" hint="Vào lớp bằng mã, hoặc tạo lớp để giao bài" href="/lop-hoc" />
        <MenuRow icon="user" title="Hồ sơ công khai" hint="Người khác thấy gì về bạn" href={`/u/${user.id}`} />
        <MenuRow icon="settings" title="Cài đặt học tập" hint="Mục tiêu ngày, lịch ôn, múi giờ" href="/settings" />
      </Card>

      <Card>
        <AppText bold>Bảo mật tài khoản</AppText>
        <AppText variant="small" color="muted">
          {user.hasPassword
            ? 'Đổi mật khẩu ngay tại đây, hoặc đặt lại qua email nếu bạn quên.'
            : 'Bạn đang đăng nhập qua Google. Có thể đặt thêm mật khẩu để đăng nhập bằng email.'}
        </AppText>
        <PasswordForm hasPassword={user.hasPassword} onChanged={() => void refresh()} />
        <Button title={leaving ? 'Đang đăng xuất…' : 'Đăng xuất'} icon="logout" variant="ghost" loading={leaving} onPress={signOut} />
      </Card>

      <PremiumCard />
      <ReferralCard userId={user.id} />
      <DangerZone hasPassword={user.hasPassword} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  flex: { flex: 1, gap: 2 },
});
