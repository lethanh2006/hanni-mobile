import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Hanzi } from '@/components/ui';
import { alpha } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { clearHistory, readHistory, type HistoryItem } from './history';

/** "Tra gần đây" (`RecentSearches` của web) — chỉ nằm trên máy này; đọc lại mỗi lần quay về tab. */
export function RecentSearches() {
  const theme = useTheme();
  const [items, setItems] = useState<HistoryItem[]>([]);
  useFocusEffect(useCallback(() => setItems(readHistory()), []));

  if (items.length === 0)
    return <AppText color="muted">Chưa tra từ nào. Từ bạn mở sẽ hiện ở đây để tra lại nhanh.</AppText>;
  return (
    <View>
      <View style={styles.chips}>
        {items.map((h) => (
          <Pressable
            key={h.s}
            onPress={() => router.push(`/tu-dien/${encodeURIComponent(h.s)}`)}
            style={({ pressed }) => [
              styles.chip,
              { borderColor: pressed ? alpha(theme.primary, 0.4) : theme.border, backgroundColor: theme.surface },
            ]}>
            <Hanzi size={14} color="primary">
              {h.s}
            </Hanzi>
            <AppText variant="caption" color="muted">
              {h.p}
            </AppText>
          </Pressable>
        ))}
      </View>
      <Pressable
        onPress={() => {
          clearHistory();
          setItems([]);
        }}
        hitSlop={6}
        style={styles.clear}>
        <AppText variant="caption" color="muted">
          Xoá lịch sử
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clear: { marginTop: 8, alignSelf: 'flex-start' },
});
