import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppText, Hanzi, Icon } from '@/components/ui';
import { alpha, Fonts, mix } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { hskLabel } from '@/lib/hsk';

import { DICT_TABS, type DictTab } from './types';
import { useSuggestions } from './use-suggestions';
import { firstMeaning } from './word-row';

/**
 * Ô tra `DictionarySearch` của web: viên thuốc cao 56px viền đỏ nhạt, kính lúp · ô gõ · nút xoá · nút mũi tên đỏ
 * nổi khối; đang gõ (tab Từ vựng) thì hiện gợi ý ngay dưới; hàng tab Từ vựng / Hán tự / Ví dụ / Ngữ pháp bên dưới.
 * (Web còn nút micro, viết tay, quét ảnh — app chưa có.)
 */
export function DictionarySearch({
  value,
  onChange,
  onSubmit,
  tab,
  onTab,
  showTabs = true,
}: {
  value: string;
  onChange: (text: string) => void;
  onSubmit: (text: string) => void;
  tab: DictTab;
  onTab: (tab: DictTab) => void;
  showTabs?: boolean;
}) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  const { items } = useSuggestions(tab === 'tu-vung' && focused ? value : '');
  const placeholder = DICT_TABS.find((t) => t.key === tab)?.placeholder ?? '';

  return (
    <View>
      <View
        style={[
          styles.box,
          {
            borderColor: focused ? alpha(theme.primary, 0.7) : alpha(theme.primary, 0.2),
            backgroundColor: theme.surface,
            boxShadow: `0 6px 24px -14px ${alpha(theme.primary, 0.55)}`,
          },
        ]}>
        <Icon name="search" size={19} color="muted" />
        <TextInput
          value={value}
          onChangeText={onChange}
          onSubmitEditing={() => onSubmit(value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder={placeholder}
          placeholderTextColor={alpha(theme.muted, 0.8)}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel="Tra từ"
          style={[styles.input, { color: theme.text }]}
        />
        {value.length > 0 && (
          <Pressable
            onPress={() => onChange('')}
            accessibilityLabel="Xoá chữ đã gõ"
            style={({ pressed }) => [styles.clear, pressed && { backgroundColor: theme.surface2 }]}>
            <Icon name="close" size={18} color="muted" />
          </Pressable>
        )}
        <Pressable
          onPress={() => onSubmit(value)}
          accessibilityLabel="Tra"
          style={({ pressed }) => [
            styles.go,
            {
              backgroundColor: theme.primary,
              boxShadow: pressed ? undefined : `0 3px 0 ${mix(theme.primary, '#000000', 0.62)}`,
              transform: pressed ? [{ translateY: 1 }] : undefined,
            },
          ]}>
          <Icon name="arrow" size={20} color="primaryText" />
        </Pressable>
      </View>

      {focused && value.trim().length > 0 && items.length > 0 && (
        <View
          style={[
            styles.dropdown,
            { borderColor: theme.border, backgroundColor: theme.surface, boxShadow: `0 20px 25px -5px ${alpha(theme.text, 0.1)}` },
          ]}>
          {items.map((w) => (
            <Pressable
              key={w.id}
              onPress={() => router.push(`/tu-dien/${encodeURIComponent(w.simplified)}`)}
              style={({ pressed }) => [styles.suggestion, pressed && { backgroundColor: theme.surface2 }]}>
              <Hanzi size={20} color="primary">
                {w.simplified}
              </Hanzi>
              <View style={styles.flex}>
                <AppText variant="caption" color="muted" numberOfLines={1}>
                  {w.pinyin}
                  {w.hanViet ? (
                    <AppText variant="caption" weight="600" color="hanviet">
                      {'  '}
                      {w.hanViet.toUpperCase()}
                    </AppText>
                  ) : null}
                </AppText>
                <AppText numberOfLines={1}>{firstMeaning(w.meaningVi) || w.meaningEn}</AppText>
              </View>
              <View style={[styles.level, { backgroundColor: theme.surface2 }]}>
                <AppText variant="caption" color="muted">
                  {hskLabel(w.hskLevel)}
                </AppText>
              </View>
            </Pressable>
          ))}
        </View>
      )}

      {showTabs && (
        <View style={styles.tabs} accessibilityRole="tablist">
          {DICT_TABS.map((t) => {
            const on = t.key === tab;
            return (
              <Pressable
                key={t.key}
                onPress={() => onTab(t.key)}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                style={[
                  styles.tab,
                  on && {
                    borderColor: alpha(theme.primary, 0.5),
                    backgroundColor: alpha(theme.primary, 0.1),
                    boxShadow: `0 1px 2px ${alpha(theme.text, 0.05)}`,
                  },
                ]}>
                <AppText weight={on ? '700' : '600'} color={on ? 'primary' : 'muted'}>
                  {t.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 2,
    borderRadius: 999,
    paddingLeft: 20,
    paddingRight: 6,
  },
  input: { flex: 1, minWidth: 0, height: '100%', paddingHorizontal: 8, fontFamily: Fonts.sans, fontSize: 16 },
  clear: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  go: { marginLeft: 2, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  dropdown: { marginTop: 8, marginHorizontal: 8, borderWidth: 1, borderRadius: 16, overflow: 'hidden' },
  suggestion: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10 },
  flex: { flex: 1, minWidth: 0 },
  level: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  tabs: { marginTop: 12, flexDirection: 'row', justifyContent: 'center', gap: 4 },
  tab: { borderWidth: 1, borderColor: 'transparent', borderRadius: 999, paddingHorizontal: 16, paddingVertical: 6 },
});
