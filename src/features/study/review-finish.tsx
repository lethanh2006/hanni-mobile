import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Icon, type IconName } from '@/components/ui';
import { alpha, mix } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Khung kết quả (`.finish` của `/study` web): ô biểu tượng xanh 72px có bóng đáy, nhãn xanh, tiêu đề, mô tả, các nút. */
export function ReviewFinish({
  icon,
  eyebrow,
  title,
  description,
  score,
  children,
  actions,
}: {
  icon: IconName;
  eyebrow: string;
  title: string;
  description: string;
  /** Điểm quiz — nằm giữa tiêu đề và mô tả. */
  score?: number | null;
  /** Phần thêm dưới mô tả (chuỗi ngày, 3 ô kết quả). */
  children?: ReactNode;
  actions: ReactNode;
}) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.finish,
        {
          borderColor: theme.border,
          backgroundColor: theme.surface,
          backgroundImage: `radial-gradient(ellipse at 50% 0%, ${alpha(theme.good, 0.08)}, transparent 60%)`,
        },
      ]}>
      <View
        style={[
          styles.icon,
          {
            borderColor: alpha(theme.good, 0.15),
            backgroundColor: mix(theme.good, theme.surface, 0.1),
            boxShadow: `0 5px 0 ${mix(theme.good, theme.surface, 0.16)}`,
          },
        ]}>
        <Icon name={icon} size={32} color="good" />
      </View>
      <AppText weight="600" color="good" center style={styles.eyebrow}>
        {eyebrow.toUpperCase()}
      </AppText>
      <AppText weight="600" center style={styles.title}>
        {title}
      </AppText>
      {score != null && (
        <AppText weight="600" color="primary" center style={styles.score}>
          {score}%
        </AppText>
      )}
      <AppText color="muted" center style={styles.description}>
        {description}
      </AppText>
      {children}
      <View style={styles.actions}>{actions}</View>
    </View>
  );
}

/** Dải chuỗi ngày ngay ở màn kết quả — phần thưởng đúng lúc vừa hoàn thành. */
export function StreakNote({ text }: { text: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.streak, { backgroundColor: mix(theme.warn, theme.surface, 0.12) }]}>
      <Icon name="flame" size={16} color="warn" />
      <AppText weight="600" color="warn" style={styles.streakText}>
        {text}
      </AppText>
    </View>
  );
}

/** 3 ô kết quả (thẻ đã ôn · thẻ đã nhớ · tỉ lệ ghi nhớ) có vạch ngăn. */
export function ResultRow({ items }: { items: { value: string; label: string }[] }) {
  const theme = useTheme();
  return (
    <View style={[styles.results, { borderColor: theme.border }]}>
      {items.map((r, i) => (
        <View key={r.label} style={[styles.result, i > 0 && { borderLeftWidth: 1, borderColor: theme.border }]}>
          <AppText weight="600" color="good" center style={styles.resultValue}>
            {r.value}
          </AppText>
          <AppText variant="caption" color="muted" center>
            {r.label}
          </AppText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  finish: {
    marginTop: 18,
    overflow: 'hidden',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 26,
    paddingHorizontal: 20,
    paddingVertical: 28,
  },
  icon: {
    width: 72,
    height: 72,
    marginBottom: 22,
    borderWidth: 1,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: { fontSize: 12, lineHeight: 16, letterSpacing: 1 },
  title: { marginTop: 12, fontSize: 23, lineHeight: 30, letterSpacing: -0.8 },
  description: { marginTop: 12, fontSize: 13, lineHeight: 23 },
  score: { marginTop: 18, fontSize: 64, lineHeight: 72, letterSpacing: -4.8 },
  actions: { alignSelf: 'stretch', marginTop: 26, gap: 10 },
  streak: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  streakText: { fontSize: 13, lineHeight: 18 },
  results: { alignSelf: 'stretch', marginTop: 25, flexDirection: 'row', borderTopWidth: 1, borderBottomWidth: 1, paddingVertical: 20 },
  result: { flex: 1, gap: 5 },
  resultValue: { fontSize: 25, lineHeight: 30, letterSpacing: -1.4 },
});
