import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Icon } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Nghĩa ngắn: chỉ lấy nét nghĩa đầu tiên. */
export const firstMeaning = (m: string | null | undefined) => (m ? m.split(';')[0].trim() : '');

/** 1 dòng từ (gợi ý, tra gần đây, từ ghép…) — bấm để mở trang từ. */
export function WordRow({
  simplified,
  pinyin,
  meaning,
  hanViet,
}: {
  simplified: string;
  pinyin: string;
  meaning: string | null | undefined;
  hanViet?: string | null;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={() => router.push(`/tu-dien/${encodeURIComponent(simplified)}`)}
      accessibilityRole="button"
      style={({ pressed }) => [styles.row, { borderColor: theme.border }, pressed && { backgroundColor: theme.surface2 }]}>
      <AppText variant="heading" color="primary">
        {simplified}
      </AppText>
      <View style={styles.flex}>
        <AppText variant="small" color="muted">
          {pinyin}
          {hanViet ? (
            <AppText variant="small" bold color="hanviet">
              {'  '}
              {hanViet}
            </AppText>
          ) : null}
        </AppText>
        <AppText variant="small" numberOfLines={1}>
          {firstMeaning(meaning)}
        </AppText>
      </View>
      <Icon name="chevron" size={16} color="muted" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  flex: { flex: 1 },
});
