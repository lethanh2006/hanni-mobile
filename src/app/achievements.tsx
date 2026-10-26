import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  AppText,
  Button,
  Card,
  EmptyState,
  ErrorNote,
  Icon,
  IconTile,
  Loading,
  PageHeader,
  ProgressBar,
  Screen,
  SectionHeading,
  ShareButton,
} from '@/components/ui';
import { alpha } from '@/constants/theme';
import { MEDAL, Medal } from '@/features/achievements/medal';
import { TitlePicker } from '@/features/achievements/title-picker';
import { useTheme } from '@/hooks/use-theme';
import { WEB_ORIGIN } from '@/lib/api';
import { useRequireAuth } from '@/lib/auth';
import { useAchievements } from '@/lib/hooks';
import { pairs } from '@/lib/pairs';
import type { Achievement } from '@/lib/types';

type Filter = 'all' | 'unlocked' | 'locked';

const CAT_VI: Record<string, string> = {
  STREAK: 'Chuỗi ngày',
  LEVEL: 'Cấp độ',
  VOLUME: 'Số lượng',
  ACCURACY: 'Độ chính xác',
  MILESTONE: 'Cột mốc',
};

const ratio = (a: Achievement) =>
  a.progressTarget > 0 ? Math.min(a.progressCurrent, a.progressTarget) / a.progressTarget : 0;

/** Chưa mở xếp trước, cái GẦN ĐẠT NHẤT lên đầu ("còn 2 lượt nữa là xong" thúc đẩy hơn thứ tự catalog). */
function sortForMotivation(list: Achievement[]) {
  return [...list].sort((a, b) => {
    if (a.unlocked !== b.unlocked) return a.unlocked ? 1 : -1;
    return a.unlocked ? 0 : ratio(b) - ratio(a);
  });
}

/** Bộ sưu tập huy hiệu (trang `/achievements` của web) — đạt mốc là mở huy hiệu, mỗi huy hiệu mở thêm một danh hiệu. */
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

  const unlocked = data?.filter((a) => a.unlocked).length ?? 0;
  const visible = sortForMotivation(
    data?.filter((a) => filter === 'all' || (filter === 'unlocked' ? a.unlocked : !a.unlocked)) ?? [],
  );

  return (
    <Screen contentStyle={styles.page}>
      <Stack.Screen options={{ title: 'Huy hiệu' }} />
      <View style={styles.head}>
        <PageHeader
          icon="trophy"
          tone="accent"
          title="Bộ sưu tập huy hiệu"
          description="Đạt mốc là mở huy hiệu — mỗi huy hiệu mở thêm một danh hiệu."
        />
        <Button
          title="Tiếp tục học"
          variant="secondary"
          icon="arrow"
          onPress={() => router.navigate('/study')}
          style={styles.self}
        />
      </View>
      {error || !data ? (
        <>
          <ErrorNote>Chưa tải được huy hiệu.</ErrorNote>
          <Button title="Thử lại" variant="secondary" onPress={() => void mutate()} style={styles.self} />
        </>
      ) : !data.length ? (
        <EmptyState
          title="Bộ sưu tập đang được chuẩn bị"
          description="Các huy hiệu sẽ xuất hiện ở đây khi có dữ liệu. Hãy tiếp tục giữ nhịp học của bạn nhé."
        />
      ) : (
        <>
          <Card style={styles.summary}>
            <IconTile size={56}>
              <Icon name="trophy" size={28} color="accent" />
            </IconTile>
            <View style={styles.flex}>
              <AppText weight="600">
                {unlocked ? 'Nỗ lực của bạn đang đơm hoa' : 'Huy hiệu đầu tiên đang chờ bạn'}
              </AppText>
              <AppText color="muted" style={styles.summaryText}>
                Đã mở khóa {unlocked} / {data.length} huy hiệu
              </AppText>
              <View style={styles.summaryBar}>
                <ProgressBar value={(unlocked / data.length) * 100} />
              </View>
            </View>
          </Card>

          <View style={styles.filters}>
            {(
              [
                { value: 'all', label: 'Tất cả', count: data.length },
                { value: 'unlocked', label: 'Đã mở khóa', count: unlocked },
                { value: 'locked', label: 'Đang chinh phục', count: data.length - unlocked },
              ] as const
            ).map((o) => (
              <FilterButton
                key={o.value}
                label={o.label}
                count={o.count}
                active={filter === o.value}
                onPress={() => setFilter(o.value)}
              />
            ))}
          </View>

          {visible.length ? (
            <View style={styles.grid}>
              {pairs(visible).map((row) => (
                <View key={row[0].id} style={styles.gridRow}>
                  {row.map((a) => (
                    <MedalCard key={a.id} achievement={a} userId={user.id} />
                  ))}
                  {row.length === 1 && <View style={styles.flex} />}
                </View>
              ))}
            </View>
          ) : (
            <EmptyState
              title={filter === 'unlocked' ? 'Huy hiệu đầu tiên đang chờ bạn' : 'Bạn đã mở khóa tất cả huy hiệu'}
              description={
                filter === 'unlocked'
                  ? 'Bắt đầu một bài học và giữ thói quen mỗi ngày để chinh phục các cột mốc.'
                  : 'Hãy tiếp tục luyện tập để giữ vững những gì đã học.'
              }>
              <Button title="Đến lộ trình học" icon="arrow" onPress={() => router.navigate('/study')} />
            </EmptyState>
          )}

          {/* Danh hiệu xuống dưới lưới huy chương như web — để danh sách dài không đẩy huy chương khỏi màn đầu. */}
          <View style={styles.titles}>
            <SectionHeading
              icon="trophy"
              tone="accent"
              title="Danh hiệu"
              description="Mỗi danh hiệu mở khi bạn đạt một huy hiệu ở trên — học thật mới có, không mua bằng xu."
            />
            <TitlePicker />
          </View>
        </>
      )}
    </Screen>
  );
}

/** Nút lọc của web (`rounded-xl px-4 py-2.5 text-sm font-semibold`) kèm ô đếm; đang chọn = `.chip-on`. */
function FilterButton({
  label,
  count,
  active,
  onPress,
}: {
  label: string;
  count: number;
  active: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [
        styles.filter,
        active
          ? {
              backgroundColor: alpha(theme.primary, 0.1),
              borderColor: alpha(theme.primary, 0.5),
              boxShadow: `0 1px 2px ${alpha(theme.text, 0.05)}`,
            }
          : { backgroundColor: pressed ? theme.surface2 : theme.surface, borderColor: alpha(theme.border, 0.8) },
      ]}>
      <AppText weight={active ? '700' : '600'} color={active ? 'primary' : 'muted'}>
        {label}
      </AppText>
      <View style={[styles.count, { backgroundColor: active ? alpha(theme.background, 0.2) : alpha(theme.surface2, 0.9) }]}>
        <AppText variant="caption" weight="700" color={active ? 'primary' : 'muted'}>
          {count}
        </AppText>
      </View>
    </Pressable>
  );
}

/** Thẻ huy hiệu trong lưới: huy chương, tên, mô tả 2 dòng, trạng thái (ngày mở / tiến độ) và nút "Chia sẻ" khi đã mở. */
function MedalCard({ achievement: a, userId }: { achievement: Achievement; userId: string }) {
  const theme = useTheme();
  const unlockedAt = a.unlockedAt && Number.isFinite(Date.parse(a.unlockedAt)) ? new Date(a.unlockedAt) : null;
  return (
    <Card style={[styles.cell, !a.unlocked && { backgroundColor: alpha(theme.surface, 0.7) }]}>
      <Medal achievement={a} pct={ratio(a)} />
      <AppText weight="700" center style={styles.cellTitle}>
        {a.nameVi}
      </AppText>
      <AppText variant="caption" color="muted" center numberOfLines={2} style={styles.cellDesc}>
        {a.descriptionVi}
      </AppText>
      <View style={styles.status}>
        {a.unlocked && <Icon name="check" size={12} color="good" />}
        <AppText variant="caption" weight="600" color={a.unlocked ? 'good' : 'muted'}>
          {a.unlocked
            ? unlockedAt
              ? unlockedAt.toLocaleDateString('vi-VN')
              : 'Đã mở'
            : a.progressTarget > 0
              ? `${Math.min(a.progressCurrent, a.progressTarget).toLocaleString('vi-VN')} / ${a.progressTarget.toLocaleString('vi-VN')} ${MEDAL[a.category]?.unit ?? ''}`
              : (CAT_VI[a.category] ?? a.category)}
        </AppText>
      </View>
      {a.unlocked && (
        <ShareButton
          compact
          message={`Mình vừa mở khóa huy hiệu "${a.nameVi}" trên Hanni — app học tiếng Trung theo chuẩn HSK 3.0! ${WEB_ORIGIN}/u/${userId}`}
          style={styles.share}
        />
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  page: { gap: 28 },
  head: { gap: 16 },
  self: { alignSelf: 'flex-start' },
  flex: { flex: 1, minWidth: 0 },
  summary: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  summaryText: { marginTop: 4 },
  summaryBar: { marginTop: 16 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  filter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  count: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  grid: { gap: 12 },
  gridRow: { flexDirection: 'row', gap: 12 },
  cell: { flex: 1, minWidth: 0, alignItems: 'center', padding: 16, gap: 0 },
  cellTitle: { marginTop: 12 },
  cellDesc: { marginTop: 4, lineHeight: 20 },
  status: { marginTop: 'auto', paddingTop: 8, flexDirection: 'row', alignItems: 'center', gap: 4 },
  share: { marginTop: 8 },
  titles: { gap: 16 },
});
