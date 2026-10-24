import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Icon, type IconName } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** 1 dòng menu trong màn Tài khoản: biểu tượng + tên + mô tả ngắn, bấm để mở màn. */
export function MenuRow({ icon, title, hint, href }: { icon: IconName; title: string; hint: string; href: Href }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={() => router.push(href)}
      accessibilityRole="button"
      style={({ pressed }) => [styles.row, { borderColor: theme.border }, pressed && { backgroundColor: theme.surface2 }]}>
      <Icon name={icon} size={20} color="primary" />
      <View style={styles.flex}>
        <AppText bold>{title}</AppText>
        <AppText variant="caption" color="muted">
          {hint}
        </AppText>
      </View>
      <Icon name="chevron" size={16} color="muted" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md, borderTopWidth: 1 },
  flex: { flex: 1 },
});
