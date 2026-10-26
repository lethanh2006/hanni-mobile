import { Image } from 'expo-image';
import { useEffect, useState, type ReactNode } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { alpha, mix, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { Card } from './card';
import { Icon } from './icon';
import { AppText } from './text';

/**
 * Vòng tải `StudyLoader` (bản `compact`) của web: logo cáo 44px trong quầng đỏ nhạt, 2 vòng quay mảnh, 1 dòng chữ.
 */
export function Loading({ label = 'Đang tải nội dung học tập…' }: { label?: string }) {
  const theme = useTheme();
  const [spin] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 1400, easing: Easing.linear, useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [spin]);
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const rotateBack = spin.interpolate({ inputRange: [0, 1], outputRange: ['360deg', '0deg'] });
  return (
    <View style={styles.loading} accessibilityRole="progressbar" accessibilityLabel={label}>
      <View style={styles.emblem}>
        <View
          style={[
            styles.halo,
            {
              borderColor: alpha(theme.primary, 0.08),
              backgroundColor: mix(theme.primary, theme.surface, 0.08),
            },
          ]}
        />
        <Animated.View
          style={[
            styles.orbit,
            { borderTopColor: theme.primary, borderBottomColor: theme.primary, transform: [{ rotate }] },
          ]}
        />
        <Animated.View
          style={[
            styles.innerOrbit,
            {
              borderTopColor: alpha(theme.accent, 0.5),
              borderLeftColor: alpha(theme.accent, 0.5),
              transform: [{ rotate: rotateBack }],
            },
          ]}
        />
        <Image
          source={require('@/assets/images/fox-mark.png')}
          style={[styles.logo, { boxShadow: `0 12px 30px ${alpha(theme.primary, 0.25)}` }]}
        />
      </View>
      <AppText variant="caption" color="muted" center>
        {label}
      </AppText>
    </View>
  );
}

/** `ErrorNote` của web: khung đỏ nhạt, biểu tượng ⓘ, chữ đỏ. */
export function ErrorNote({ children }: { children: ReactNode }) {
  const theme = useTheme();
  return (
    <View
      accessibilityRole="alert"
      style={[styles.error, { backgroundColor: alpha(theme.danger, 0.05), borderColor: alpha(theme.danger, 0.2) }]}>
      <Icon name="info" size={20} color="danger" />
      <AppText color="danger" style={styles.flex}>
        {children}
      </AppText>
    </View>
  );
}

/** Trạng thái rỗng có cáo Hanni nguyên con (1 trong 3 vai của linh vật trên web) — kèm việc tiếp theo nếu có. */
export function EmptyState({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <Card style={styles.empty}>
      <Image source={require('@/assets/images/mascot.png')} style={styles.fox} contentFit="contain" />
      <AppText weight="600" center style={styles.emptyTitle}>
        {title}
      </AppText>
      <AppText color="muted" center style={styles.emptyText}>
        {description}
      </AppText>
      {children && <View style={styles.emptyActions}>{children}</View>}
    </Card>
  );
}

const styles = StyleSheet.create({
  loading: { paddingVertical: 30, paddingHorizontal: 16, alignItems: 'center', gap: 14 },
  emblem: { width: 96, height: 96, alignItems: 'center', justifyContent: 'center' },
  halo: { position: 'absolute', top: 8, left: 8, right: 8, bottom: 8, borderWidth: 1, borderRadius: 999 },
  orbit: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: 999,
  },
  innerOrbit: {
    position: 'absolute',
    top: 6,
    left: 6,
    right: 6,
    bottom: 6,
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 999,
  },
  logo: { width: 44, height: 44, borderRadius: 12 },
  error: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  flex: { flex: 1 },
  empty: { alignItems: 'center', paddingVertical: 48, gap: 0 },
  fox: { width: 114, height: 96, marginBottom: 16 },
  emptyTitle: { fontSize: 16 },
  emptyText: { marginTop: 8, lineHeight: 24, maxWidth: 420 },
  emptyActions: { marginTop: 20, alignSelf: 'stretch', alignItems: 'center', gap: 10 },
});
