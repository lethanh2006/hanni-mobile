import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { Icon } from './icon';
import { AppText } from './text';

/** Ô nhập có nhãn. `secure` thêm nút ẩn/hiện mật khẩu. */
export function TextField({
  label,
  secure = false,
  ...inputProps
}: TextInputProps & { label: string; secure?: boolean }) {
  const theme = useTheme();
  const [hidden, setHidden] = useState(secure);
  return (
    <View style={styles.wrap}>
      <AppText variant="small" bold>
        {label}
      </AppText>
      <View style={[styles.box, { borderColor: theme.border, backgroundColor: theme.surface }]}>
        <TextInput
          style={[styles.input, { color: theme.text }]}
          placeholderTextColor={theme.muted}
          secureTextEntry={hidden}
          accessibilityLabel={label}
          {...inputProps}
        />
        {secure && (
          <Pressable
            onPress={() => setHidden(!hidden)}
            accessibilityLabel={hidden ? 'Hiện mật khẩu' : 'Ẩn mật khẩu'}
            hitSlop={8}
            style={styles.eye}>
            <Icon name={hidden ? 'eye' : 'eye-off'} size={18} color="muted" />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.md,
    minHeight: 48,
  },
  input: { flex: 1, fontSize: 15, paddingHorizontal: 14, paddingVertical: 12 },
  eye: { paddingHorizontal: 12 },
});
