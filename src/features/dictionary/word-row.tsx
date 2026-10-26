import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Hanzi } from '@/components/ui';
import { alpha } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { hskLabel } from '@/lib/hsk';

/** Nghĩa ngắn: chỉ lấy nét nghĩa đầu tiên. */
export const firstMeaning = (m: string | null | undefined) => (m ? m.split(';')[0].trim() : '');

/**
 * 1 dòng từ (`WordRow` của trang từ điển web): thẻ bo 16px, chữ Hán đỏ to · pinyin + ÂM HÁN VIỆT · nghĩa xám ·
 * nhãn cấp HSK. Bấm để mở trang từ.
 */
export function WordRow({
  simplified,
  pinyin,
  meaning,
  hanViet,
  hskLevel,
}: {
  simplified: string;
  pinyin: string;
  meaning: string | null | undefined;
  hanViet?: string | null;
  hskLevel?: number;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={() => router.push(`/tu-dien/${encodeURIComponent(simplified)}`)}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.row,
        { borderColor: pressed ? alpha(theme.primary, 0.3) : theme.border, backgroundColor: theme.surface },
      ]}>
      <Hanzi size={24} color="primary" style={styles.hanzi}>
        {simplified}
      </Hanzi>
      <View style={styles.flex}>
        <AppText numberOfLines={1}>
          {pinyin}
          {hanViet ? (
            <AppText variant="caption" weight="700" color="hanviet" style={styles.hanViet}>
              {'  '}
              {hanViet.toUpperCase()}
            </AppText>
          ) : null}
        </AppText>
        <AppText color="muted" numberOfLines={1}>
          {firstMeaning(meaning) || 'Đang cập nhật'}
        </AppText>
      </View>
      {hskLevel !== undefined && (
        <View style={[styles.level, { backgroundColor: theme.surface2 }]}>
          <AppText variant="caption" weight="600" color="muted">
            {hskLabel(hskLevel)}
          </AppText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  hanzi: { minWidth: 60 },
  flex: { flex: 1, minWidth: 0 },
  hanViet: { letterSpacing: 0.6 },
  level: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
});
