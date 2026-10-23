import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText, Card, Icon, TextLink } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { hskLabel } from '@/lib/hsk';
import type { ProgressOverview } from '@/lib/types';

/**
 * "Vốn từ — N từ đã học · M từ đã thuộc" + thanh của CẤP đang học (cấp thấp nhất còn từ chưa thuộc):
 * tính trên cả 10.958 từ thì mãi là 0%, theo cấp thì nhích từ ngày đầu.
 */
export function VocabSummary({ data }: { data: ProgressOverview }) {
  const theme = useTheme();
  const touched = data.totals.learned + data.totals.learning;
  const focus = data.levels.find((l) => l.learned + l.learning > 0 && l.learned < l.totalWords) ?? data.levels[0];
  const share = (n: number) => `${(n / Math.max(1, focus?.totalWords ?? 1)) * 100}%` as const;

  return (
    <Card>
      <AppText variant="label" color="muted">
        Vốn từ của bạn
      </AppText>
      <AppText variant="title">
        {touched.toLocaleString('vi-VN')}{' '}
        <AppText variant="body" bold>
          từ đã học
        </AppText>
      </AppText>
      <AppText variant="small" color="muted">
        {data.totals.learned.toLocaleString('vi-VN')} từ đã thuộc
      </AppText>
      {focus && (
        <View style={styles.focus}>
          <View style={styles.row}>
            <AppText variant="small" bold style={styles.flex}>
              {hskLabel(focus.level)}
            </AppText>
            <AppText variant="small" color="muted">
              {(focus.learned + focus.learning).toLocaleString('vi-VN')}/{focus.totalWords.toLocaleString('vi-VN')} từ
            </AppText>
          </View>
          <View style={[styles.bar, { backgroundColor: theme.surface2 }]}>
            <View style={{ width: share(focus.learned), backgroundColor: theme.good }} />
            <View style={{ width: share(focus.learning), backgroundColor: theme.primary, opacity: 0.7 }} />
          </View>
          <AppText variant="caption" color="muted">
            Xanh: đã thuộc (ôn đúng đủ ~21 ngày) · Đỏ: đang học
          </AppText>
        </View>
      )}
    </Card>
  );
}

/** Chỉ giục ôn khi có từ ĐẾN HẠN thật — từ ôn trong 24 giờ tới thì để mai, hôm nay học bài mới. */
export function TodaySuggestion({ data }: { data: ProgressOverview }) {
  const theme = useTheme();
  const { due, atRisk } = data.totals;
  return (
    <Card style={{ backgroundColor: theme.primarySoft, borderColor: theme.primarySoft }}>
      <View style={styles.row}>
        <Icon name="spark" size={18} color="primary" />
        <AppText variant="small" bold color="primary">
          Gợi ý cho hôm nay
        </AppText>
      </View>
      <AppText bold>{due > 0 ? `Bạn có ${due} từ đến lịch ôn` : 'Hôm nay học thêm một bài mới'}</AppText>
      <AppText variant="small" color="muted">
        {due > 0
          ? 'Ôn đúng lúc sắp quên là cách nhớ lâu nhất.'
          : atRisk > 0
            ? `${atRisk} từ sẽ đến hạn ôn trong 24 giờ tới — Hanni sẽ nhắc.`
            : 'Chưa có từ nào đến hạn ôn.'}
      </AppText>
      <TextLink
        title={due > 0 ? 'Mở buổi ôn tập →' : 'Học tiếp lộ trình →'}
        onPress={() =>
          due > 0 ? router.push({ pathname: '/review', params: { review: '1' } }) : router.dismissTo('/')
        }
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  flex: { flex: 1 },
  focus: { gap: 6, marginTop: Spacing.sm },
  bar: { height: 12, borderRadius: Radius.pill, overflow: 'hidden', flexDirection: 'row' },
});
