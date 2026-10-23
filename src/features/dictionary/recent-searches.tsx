import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Card, SectionTitle, TextLink } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { clearHistory, readHistory, type HistoryItem } from './history';

/** "Tra gần đây" — đọc lại mỗi lần quay về tab để thấy từ vừa mở. */
export function RecentSearches() {
  const theme = useTheme();
  const [items, setItems] = useState<HistoryItem[]>([]);
  useFocusEffect(
    useCallback(() => {
      setItems(readHistory());
    }, []),
  );

  return (
    <Card>
      <SectionTitle
        title="Tra gần đây"
        right={
          items.length > 0 && (
            <TextLink
              title="Xoá"
              color="muted"
              onPress={() => {
                clearHistory();
                setItems([]);
              }}
            />
          )
        }
      />
      {items.length === 0 ? (
        <AppText variant="small" color="muted">
          Chưa tra từ nào. Từ bạn mở sẽ hiện ở đây để tra lại nhanh.
        </AppText>
      ) : (
        <View style={styles.chips}>
          {items.map((h) => (
            <Pressable
              key={h.s}
              onPress={() => router.push(`/tu-dien/${encodeURIComponent(h.s)}`)}
              style={[styles.chip, { borderColor: theme.border, backgroundColor: theme.surface }]}>
              <AppText color="primary">{h.s}</AppText>
              <AppText variant="caption" color="muted">
                {h.p}
              </AppText>
            </Pressable>
          ))}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
});
