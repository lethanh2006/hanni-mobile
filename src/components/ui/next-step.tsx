import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { tintPanel } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { Icon, type IconName } from './icon';
import { AppText } from './text';

/**
 * Khối "bước tiếp theo" cuối các trang hoạt động (`NextStep` của web): làm xong không bị cụt đường, gợi ý bước tự
 * nhiên của việc vừa làm.
 */
export function NextStep({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions: { href: Href; label: string; icon: IconName }[];
}) {
  const theme = useTheme();
  return (
    <View style={[styles.panel, tintPanel(theme)]}>
      <AppText weight="600">{title}</AppText>
      <AppText variant="caption" color="muted" style={styles.description}>
        {description}
      </AppText>
      <View style={styles.actions}>
        {actions.map((a) => (
          <Pressable
            key={String(a.href)}
            onPress={() => router.push(a.href)}
            style={({ pressed }) => [
              styles.action,
              { borderColor: theme.border, backgroundColor: pressed ? theme.surface2 : theme.surface },
            ]}>
            <Icon name={a.icon} size={16} color="primary" />
            <AppText weight="500">{a.label}</AppText>
            <Icon name="arrow" size={14} color="muted" />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { borderWidth: 1, borderRadius: 16, padding: 20 },
  description: { marginTop: 6, lineHeight: 20 },
  actions: { marginTop: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
});
