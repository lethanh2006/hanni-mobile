import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Card, Icon } from '@/components/ui';
import { alpha } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { hskLabel } from '@/lib/hsk';
import type { ProgressOverview } from '@/lib/types';

/**
 * "Vốn từ của bạn — N từ đã học · M từ đã thuộc" + thanh 2 màu của CẤP đang học (như `/progress` của web): tính trên
 * cả 10.958 từ thì mãi là 0%, theo cấp thì nhích từ ngày đầu.
 */
export function VocabSummary({ data }: { data: ProgressOverview }) {
  const theme = useTheme();
  const touched = data.totals.learned + data.totals.learning;
  const focus = data.levels.find((l) => l.learned + l.learning > 0 && l.learned < l.totalWords) ?? data.levels[0];
  const share = (n: number) => `${(n / Math.max(1, focus?.totalWords ?? 1)) * 100}%` as const;
  return (
    <Card style={styles.card}>
      <AppText variant="label">Vốn từ của bạn</AppText>
      <View style={styles.big}>
        <AppText weight="800" style={styles.count}>
          {touched.toLocaleString('vi-VN')}
        </AppText>
        <AppText weight="600" style={styles.unit}>
          từ đã học
        </AppText>
        <AppText color="muted">· {data.totals.learned.toLocaleString('vi-VN')} từ đã thuộc</AppText>
      </View>
      {focus && (
        <View style={styles.focus}>
          <View style={styles.row}>
            <AppText weight="600">{hskLabel(focus.level)}</AppText>
            <AppText color="muted">
              {(focus.learned + focus.learning).toLocaleString('vi-VN')}/{focus.totalWords.toLocaleString('vi-VN')} từ
            </AppText>
          </View>
          <View style={[styles.bar, { backgroundColor: theme.surface2 }]}>
            <View style={{ width: share(focus.learned), backgroundColor: theme.good }} />
            <View style={{ width: share(focus.learning), backgroundColor: alpha(theme.primary, 0.7) }} />
          </View>
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: theme.good }]} />
              <AppText variant="caption" color="muted">
                Đã thuộc
              </AppText>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: alpha(theme.primary, 0.7) }]} />
              <AppText variant="caption" color="muted">
                Đang học
              </AppText>
            </View>
            <AppText variant="caption" color="muted">
              “Đã thuộc” = ôn đúng đủ khoảng 21 ngày
            </AppText>
          </View>
        </View>
      )}
    </Card>
  );
}

/** "Gợi ý cho hôm nay" — chỉ giục ôn khi có từ ĐẾN HẠN thật; từ ôn trong 24 giờ tới thì để mai, hôm nay học bài mới. */
export function TodaySuggestion({ data }: { data: ProgressOverview }) {
  const theme = useTheme();
  const { due, atRisk } = data.totals;
  return (
    <Card style={[styles.card, { borderColor: alpha(theme.primary, 0.15), backgroundColor: alpha(theme.primary, 0.05) }]}>
      <View style={styles.suggestHead}>
        <Icon name="spark" size={19} color="primary" />
        <AppText weight="600" color="primary">
          Gợi ý cho hôm nay
        </AppText>
      </View>
      <AppText weight="600" style={styles.suggestTitle}>
        {due > 0 ? `Bạn có ${due} từ đến lịch ôn` : 'Hôm nay học thêm một bài mới'}
      </AppText>
      <AppText color="muted" style={styles.suggestText}>
        {due > 0
          ? 'Ôn đúng lúc sắp quên là cách nhớ lâu nhất.'
          : atRisk > 0
            ? `${atRisk} từ sẽ đến hạn ôn trong 24 giờ tới — Hanni sẽ nhắc.`
            : 'Chưa có từ nào đến hạn ôn.'}
      </AppText>
      <Pressable
        onPress={() => (due > 0 ? router.push({ pathname: '/review', params: { review: '1' } }) : router.navigate('/'))}
        style={styles.link}
        hitSlop={6}>
        <AppText weight="600" color="primary">
          {due > 0 ? 'Mở buổi ôn tập' : 'Học tiếp lộ trình'}
        </AppText>
        <Icon name="arrow" size={16} color="primary" />
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 0 },
  big: { marginTop: 4, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', columnGap: 12, rowGap: 4 },
  count: { fontSize: 36, lineHeight: 40, letterSpacing: -0.9 },
  unit: { fontSize: 16 },
  focus: { marginTop: 16 },
  row: { marginBottom: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bar: { height: 12, borderRadius: 999, overflow: 'hidden', flexDirection: 'row' },
  legend: { marginTop: 8, flexDirection: 'row', flexWrap: 'wrap', columnGap: 16, rowGap: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  suggestHead: { marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  suggestTitle: { fontSize: 16 },
  suggestText: { marginTop: 8, lineHeight: 24 },
  link: { marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 8 },
});
