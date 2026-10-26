import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Card, Icon, IconTile, ProgressBar, SectionHeading } from '@/components/ui';
import { alpha } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { LevelBucket } from '@/lib/types';

const BAND_VI: Record<string, string> = { ELEMENTARY: 'Sơ cấp', INTERMEDIATE: 'Trung cấp', ADVANCED: 'Cao cấp' };

/** "Tiến độ theo cấp HSK" (`/progress` của web): mỗi cấp 1 thẻ — số cấp, %, thanh, 4 chỉ số, "Khám phá từ vựng →". */
export function LevelProgress({ levels }: { levels: LevelBucket[] }) {
  const theme = useTheme();
  return (
    <View style={styles.wrap}>
      <SectionHeading
        icon="chart"
        tone="good"
        title="Tiến độ theo cấp HSK"
        description="Mỗi từ bạn nhớ đều góp vào hành trình này."
      />
      {levels.map((l) => (
        <Card key={l.level} style={styles.card}>
          <View style={styles.top}>
            <View style={styles.left}>
              <IconTile>
                <AppText weight="600" style={[styles.no, { color: alpha(theme.text, 0.75) }]}>
                  {String(l.level).padStart(2, '0')}
                </AppText>
              </IconTile>
              <View style={styles.flex}>
                <AppText weight="600">
                  HSK {l.level} · {l.nameVi}
                </AppText>
                <AppText variant="caption" color="muted" style={styles.band}>
                  {BAND_VI[l.band] ?? l.band}
                </AppText>
              </View>
            </View>
            <View>
              <AppText weight="600" color="primary" style={styles.pct}>
                {Math.round(l.percentComplete)}%
              </AppText>
              <AppText variant="caption" color="muted" style={styles.band}>
                {l.learned} / {l.totalWords} từ đã thuộc
              </AppText>
            </View>
          </View>
          <ProgressBar value={l.percentComplete} />
          <View style={styles.stats}>
            {[
              { title: 'Đã thuộc', value: l.learned, color: theme.good },
              { title: 'Đang học', value: l.learning, color: theme.primary },
              { title: 'Đến hạn', value: l.due, color: theme.warn },
              { title: 'Chưa bắt đầu', value: l.notStarted, color: alpha(theme.muted, 0.4) },
            ].map((s) => (
              <View key={s.title} style={styles.stat}>
                <View style={[styles.dot, { backgroundColor: s.color }]} />
                <AppText variant="caption" color="muted">
                  {s.title}:{' '}
                  <AppText variant="caption" weight="500">
                    {s.value}
                  </AppText>
                </AppText>
              </View>
            ))}
          </View>
          <View style={[styles.foot, { borderColor: theme.border }]}>
            <AppText variant="caption" color="muted" style={styles.flex}>
              {l.atRisk > 0
                ? `${l.atRisk} từ ôn trong 24 giờ tới`
                : l.learned > 0
                  ? 'Tiếp tục duy trì nhịp ôn tập của bạn'
                  : 'Bắt đầu với những từ đầu tiên'}
            </AppText>
            <Pressable
              onPress={() => router.navigate({ pathname: '/tu-dien', params: { level: String(l.level) } })}
              style={styles.link}
              hitSlop={6}>
              <AppText variant="caption" weight="600" color="primary">
                Khám phá từ vựng
              </AppText>
              <Icon name="arrow" size={14} color="primary" />
            </Pressable>
          </View>
        </Card>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 16 },
  card: { gap: 0 },
  top: { marginBottom: 20, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  left: { flexDirection: 'row', alignItems: 'center', gap: 16, flex: 1, minWidth: 180 },
  no: { fontSize: 16 },
  flex: { flex: 1, minWidth: 0 },
  band: { marginTop: 4 },
  pct: { fontSize: 20, lineHeight: 28 },
  stats: { marginTop: 16, flexDirection: 'row', flexWrap: 'wrap', rowGap: 12 },
  stat: { width: '50%', flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  foot: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  link: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
