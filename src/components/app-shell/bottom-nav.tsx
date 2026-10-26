import { router } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Icon, type IconName } from '@/components/ui';
import { alpha } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useStudyStats } from '@/lib/hooks';
import { IN_MORE, TABS } from '@/lib/nav';

import { MoreMenu } from './more-menu';

/**
 * Thanh tab dưới đáy (`bottom-nav.tsx` của web): Trang chủ · Ôn tập · Luyện thi · Luyện tập · Thêm.
 * Ô đang chọn: biểu tượng trong viên thuốc đỏ nhạt + chữ đỏ. "Thêm" mở ngăn menu đầy đủ.
 */
export function BottomNav({ state }: BottomTabBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [menuOpen, setMenuOpen] = useState(false);
  const due = useStudyStats().data?.dueNow ?? 0;
  const current = state.routes[state.index]?.name;
  const moreActive = IN_MORE.includes(current);

  return (
    <>
      <View
        style={[
          styles.bar,
          { paddingBottom: insets.bottom, backgroundColor: alpha(theme.surface, 0.95), borderColor: theme.border },
        ]}>
        <View style={styles.row}>
          {TABS.map((tab) => (
            <Cell
              key={tab.name}
              label={tab.label}
              icon={tab.icon}
              active={current === tab.name}
              badge={tab.name === 'study' ? due : 0}
              href={tab.href}
            />
          ))}
          <Cell label="Thêm" icon="menu" active={moreActive || menuOpen} onPress={() => setMenuOpen(true)} />
        </View>
      </View>
      <MoreMenu open={menuOpen} onClose={() => setMenuOpen(false)} current={current} />
    </>
  );
}

function Cell({
  label,
  icon,
  active,
  badge = 0,
  href,
  onPress,
}: {
  label: string;
  icon: IconName;
  active: boolean;
  badge?: number;
  href?: (typeof TABS)[number]['href'];
  onPress?: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={() => {
        if (onPress) onPress();
        else if (href) router.navigate(href);
      }}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      style={styles.cell}>
      <View style={[styles.pill, active && { backgroundColor: alpha(theme.primary, 0.12) }]}>
        <Icon name={icon} size={21} color={active ? 'primary' : 'muted'} />
      </View>
      <AppText variant="caption" weight="600" color={active ? 'primary' : 'muted'} numberOfLines={1}>
        {label}
      </AppText>
      {badge > 0 && (
        <View style={[styles.badge, { backgroundColor: theme.primary }]}>
          <Text style={[styles.badgeText, { color: theme.primaryText }]}>{badge > 99 ? '99+' : badge}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: { borderTopWidth: 1 },
  row: { height: 64, flexDirection: 'row', alignItems: 'stretch', paddingHorizontal: 4, alignSelf: 'center', width: '100%', maxWidth: 576 },
  cell: { flex: 1, minWidth: 0, alignItems: 'center', justifyContent: 'center', gap: 2, paddingTop: 6, paddingBottom: 4 },
  pill: { height: 28, width: 48, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    top: 4,
    left: '50%',
    marginLeft: 8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontSize: 9, fontWeight: '700' },
});
