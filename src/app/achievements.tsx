import { Stack } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, Card, ChipRow, EmptyState, ErrorNote, Loading, ProgressBar, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { MEDAL, Medal } from '@/features/achievements/medal';
import { TitlePicker } from '@/features/achievements/title-picker';
import { useRequireAuth } from '@/lib/auth';
import { useAchievements } from '@/lib/hooks';
import type { Achievement } from '@/lib/types';

type Filter = 'all' | 'unlocked' | 'locked';

const ratio = (a: Achievement) =>
  a.progressTarget > 0 ? Math.min(a.progressCurrent, a.progressTarget) / a.progressTarget : 0;

/** Chưa mở xếp trước, cái GẦN ĐẠT NHẤT lên đầu ("còn 2 lượt nữa là xong" thúc đẩy hơn thứ tự catalog). */
function sortForMotivation(list: Achievement[]) {
  return [...list].sort((a, b) => {
    if (a.unlocked !== b.unlocked) return a.unlocked ? 1 : -1;
    return a.unlocked ? 0 : ratio(b) - ratio(a);
  });
}

function statusText(a: Achievement) {
  if (a.unlocked) return a.unlockedAt ? `Mở ngày ${new Date(a.unlockedAt).toLocaleDateString('vi-VN')}` : 'Đã mở';
  if (a.progressTarget > 0) {
    return `${Math.min(a.progressCurrent, a.progressTarget).toLocaleString('vi-VN')} / ${a.progressTarget.toLocaleString('vi-VN')} ${MEDAL[a.category]?.unit ?? ''}`;
  }
  return '';
}

/** Bộ sưu tập huy hiệu — đạt mốc là mở huy hiệu, mỗi huy hiệu mở thêm một danh hiệu. */
export default function AchievementsScreen() {
  const { user } = useRequireAuth();
  const { data, error, mutate } = useAchievements();
  const [filter, setFilter] = useState<Filter>('all');

  if (!user || (!data && !error)) {
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Huy hiệu' }} />
        <Loading />
      </Screen>
    );
  }
  if (error || !data) {
    return (
      <Screen>
        <ErrorNote>Chưa tải được huy hiệu.</ErrorNote>
        <Button title="Thử lại" variant="secondary" onPress={() => void mutate()} />
      </Screen>
    );
  }

  const unlocked = data.filter((a) => a.unlocked).length;
  const visible = sortForMotivation(
    data.filter((a) => filter === 'all' || (filter === 'unlocked' ? a.unlocked : !a.unlocked)),
  );

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Huy hiệu' }} />
      <Card>
        <AppText variant="heading">
          {unlocked ? 'Nỗ lực của bạn đang đơm hoa' : 'Huy hiệu đầu tiên đang chờ bạn'}
        </AppText>
        <AppText variant="small" color="muted">
          Đã mở khoá {unlocked} / {data.length} huy hiệu
        </AppText>
        <ProgressBar value={data.length ? (unlocked / data.length) * 100 : 0} />
      </Card>

      <ChipRow<Filter>
        options={[
          { value: 'all', label: `Tất cả ${data.length}` },
          { value: 'unlocked', label: `Đã mở ${unlocked}` },
          { value: 'locked', label: `Đang chinh phục ${data.length - unlocked}` },
        ]}
        value={filter}
        onChange={setFilter}
      />

      {visible.length ? (
        <View style={styles.grid}>
          {visible.map((a) => (
            <Card key={a.id} style={styles.cell}>
              <Medal achievement={a} />
              <AppText variant="small" bold center>
                {a.nameVi}
              </AppText>
              <AppText variant="caption" color="muted" center numberOfLines={2}>
                {a.descriptionVi}
              </AppText>
              <AppText variant="caption" bold color={a.unlocked ? 'good' : 'muted'} center>
                {statusText(a)}
              </AppText>
            </Card>
          ))}
        </View>
      ) : (
        <EmptyState
          title={filter === 'unlocked' ? 'Huy hiệu đầu tiên đang chờ bạn' : 'Bạn đã mở khoá tất cả huy hiệu'}
          description={
            filter === 'unlocked'
              ? 'Học một bài và giữ thói quen mỗi ngày để chinh phục các cột mốc.'
              : 'Hãy tiếp tục luyện tập để giữ vững những gì đã học.'
          }
        />
      )}

      <TitlePicker />
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: Spacing.md },
  // 2 cột cố định — để giãn thì huy hiệu lẻ cuối cùng chiếm cả hàng.
  cell: { width: '48%', alignItems: 'center', gap: 6 },
});
