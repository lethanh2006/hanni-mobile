import { router, type NativeStackHeaderProps } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Icon } from '@/components/ui';
import { alpha } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * Thanh trên của các màn mở chồng lên (trang từ, cài đặt, huy hiệu…): cùng nền, viền, chiều cao 64px với thanh trên
 * của khung app (như web), bên trái là nút quay lại thay cho logo, giữa là tên trang.
 */
export function StackHeader({ options, route, back }: NativeStackHeaderProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const title = typeof options.title === 'string' ? options.title : route.name;
  return (
    <View
      style={[
        styles.bar,
        { paddingTop: insets.top, backgroundColor: alpha(theme.surface, 0.95), borderColor: theme.border },
      ]}>
      <View style={styles.row}>
        <Pressable
          onPress={() => (back ? router.back() : router.replace('/'))}
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
          style={({ pressed }) => [styles.back, pressed && { backgroundColor: theme.surface2 }]}>
          <Icon name="back" size={20} />
        </Pressable>
        <AppText weight="600" numberOfLines={1} style={styles.title}>
          {title}
        </AppText>
        {typeof options.headerRight === 'function' ? (
          <View style={styles.right}>{options.headerRight({ tintColor: theme.text, canGoBack: !!back })}</View>
        ) : (
          <View style={styles.spacer} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { borderBottomWidth: 1 },
  row: { height: 64, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12 },
  back: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontSize: 16, textAlign: 'center' },
  right: { minWidth: 40, alignItems: 'flex-end' },
  spacer: { width: 40 },
});
