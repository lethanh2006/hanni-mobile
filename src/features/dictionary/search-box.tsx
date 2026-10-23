import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Icon } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Ô tra tròn lớn kiểu Hanzii: gõ chữ Hán, pinyin hoặc tiếng Việt. */
export function SearchBox({
  value,
  onChange,
  onSubmit,
  autoFocus = false,
}: {
  value: string;
  onChange: (text: string) => void;
  onSubmit?: () => void;
  autoFocus?: boolean;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.box, { borderColor: theme.primary, backgroundColor: theme.surface }]}>
      <Icon name="search" size={19} color="muted" />
      <TextInput
        value={value}
        onChangeText={onChange}
        onSubmitEditing={onSubmit}
        autoFocus={autoFocus}
        placeholder="你好, nihao, học sinh…"
        placeholderTextColor={theme.muted}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
        accessibilityLabel="Tra từ"
        style={[styles.input, { color: theme.text }]}
      />
      {value.length > 0 && (
        <Pressable onPress={() => onChange('')} hitSlop={8} accessibilityLabel="Xoá chữ đã gõ">
          <Icon name="close" size={18} color="muted" />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    height: 52,
    borderWidth: 2,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.lg,
  },
  input: { flex: 1, fontSize: 16, paddingVertical: 0 },
});
