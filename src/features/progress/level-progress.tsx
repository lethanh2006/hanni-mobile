import { StyleSheet, View } from 'react-native';

import { AppText, Card, ProgressBar, SectionTitle } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { hskBand, hskLabel } from '@/lib/hsk';
import type { LevelBucket } from '@/lib/types';

/** Tiến độ từng cấp HSK: đã thuộc / đang học / đến hạn / chưa bắt đầu. */
export function LevelProgress({ levels }: { levels: LevelBucket[] }) {
  return (
    <>
      <SectionTitle title="Tiến độ theo cấp HSK" />
      {levels.map((l) => (
        <Card key={l.level}>
          <View style={styles.row}>
            <View style={styles.flex}>
              <AppText bold>
                {hskLabel(l.level)} · {l.nameVi}
              </AppText>
              <AppText variant="caption" color={hskBand(l.level).color}>
                {hskBand(l.level).label}
              </AppText>
            </View>
            <View style={styles.right}>
              <AppText variant="heading" color="primary">
                {Math.round(l.percentComplete)}%
              </AppText>
              <AppText variant="caption" color="muted">
                {l.learned}/{l.totalWords} từ đã thuộc
              </AppText>
            </View>
          </View>
          <ProgressBar value={l.percentComplete} />
          <AppText variant="caption" color="muted">
            Đã thuộc {l.learned} · Đang học {l.learning} · Đến hạn {l.due} · Chưa bắt đầu {l.notStarted}
          </AppText>
        </Card>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  flex: { flex: 1 },
  right: { alignItems: 'flex-end' },
});
