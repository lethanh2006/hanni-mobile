import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { alpha, Fonts, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { Icon } from './icon';
import { AppText } from './text';

/**
 * Ô nhập `.field` của web: bo 12px, viền mảnh, chữ 14px; đang gõ thì viền đỏ + quầng đỏ nhạt 4px.
 * Nhãn chữ nhỏ đậm phía trên (`text-xs font-semibold`), `labelRight` cho link cùng hàng (vd "Quên mật khẩu?").
 * `secure` thêm nút ẩn/hiện mật khẩu.
 */
export function TextField({
  label,
  labelRight,
  secure = false,
  style,
  ...inputProps
}: TextInputProps & { label?: string; labelRight?: ReactNode; secure?: boolean }) {
  const theme = useTheme();
  const [hidden, setHidden] = useState(secure);
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.wrap}>
      {(label || labelRight) && (
        <View style={styles.labelRow}>
          {label && (
            <AppText variant="caption" weight="600" style={styles.flex}>
              {label}
            </AppText>
          )}
          {labelRight}
        </View>
      )}
      <View
        style={[
          styles.box,
          {
            borderColor: focused ? theme.primary : alpha(theme.border, 0.8),
            backgroundColor: focused ? theme.surface : alpha(theme.surface, 0.8),
            boxShadow: focused ? `0 0 0 4px ${alpha(theme.primary, 0.1)}` : undefined,
          },
        ]}>
        <TextInput
          style={[styles.input, { color: theme.text }, style]}
          placeholderTextColor={theme.muted}
          secureTextEntry={hidden}
          accessibilityLabel={label}
          {...inputProps}
          onFocus={(e) => {
            setFocused(true);
            inputProps.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            inputProps.onBlur?.(e);
          }}
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
  wrap: { gap: 8 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flex: { flex: 1 },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.md,
    minHeight: 46,
  },
  input: { flex: 1, fontFamily: Fonts.sans, fontSize: 14, paddingHorizontal: 14, paddingVertical: 12 },
  eye: { paddingHorizontal: 14 },
});
