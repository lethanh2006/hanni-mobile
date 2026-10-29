import { useEffect, useState, type ReactNode } from 'react';
import { Keyboard, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppText, Icon } from '@/components/ui';
import { alpha, Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * Ô soạn tin dùng chung cho trợ lý AI và luyện nói AI (`ChatComposer` của web): ô tự giãn tới ~5 dòng, giới hạn đúng
 * số ký tự server nhận (`maxLength`), bộ đếm hiện khi bắt đầu gõ và đổi màu khi gần chạm giới hạn.
 */
export function ChatComposer({
  value,
  onChange,
  onSubmit,
  maxLength,
  placeholder,
  busy = false,
  before,
  bottomInset = 0,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  maxLength: number;
  placeholder: string;
  /** Đang gửi: vẫn cho gõ tiếp nhưng chưa cho gửi. */
  busy?: boolean;
  /** Nút phụ bên trái ô nhập (gợi ý…). */
  before?: ReactNode;
  /** Chừa thanh điều hướng của máy khi ô soạn nằm sát đáy màn hình. */
  bottomInset?: number;
}) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  const keyboardOpen = useKeyboardOpen();
  const length = value.length;
  const canSend = value.trim().length > 0 && length <= maxLength && !busy;

  return (
    <View style={[styles.composer, { borderColor: theme.border, backgroundColor: theme.surface, paddingBottom: (keyboardOpen ? 0 : bottomInset) + 12 }]}>
      <View style={styles.row}>
        {before}
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={theme.muted}
          maxLength={maxLength}
          multiline
          numberOfLines={1}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[
            styles.input,
            {
              color: theme.text,
              borderColor: focused ? theme.primary : alpha(theme.border, 0.8),
              backgroundColor: focused ? theme.surface : alpha(theme.surface, 0.8),
            },
          ]}
        />
        <Pressable
          onPress={() => canSend && onSubmit()}
          disabled={!canSend}
          accessibilityLabel="Gửi"
          style={[styles.send, { backgroundColor: theme.primary }, !canSend && styles.faded]}>
          <Icon name="arrow" size={18} color="primaryText" />
        </Pressable>
      </View>
      {length > 0 && (
        <AppText
          variant="caption"
          color={length >= maxLength ? 'danger' : length >= maxLength * 0.9 ? 'warn' : 'muted'}
          style={styles.counter}>
          {length >= maxLength
            ? `Đã tới giới hạn ${maxLength.toLocaleString('vi-VN')} ký tự`
            : `${length.toLocaleString('vi-VN')}/${maxLength.toLocaleString('vi-VN')} ký tự`}
        </AppText>
      )}
    </View>
  );
}

/** Bàn phím đang mở thì nó đã che thanh điều hướng, ô soạn không cần chừa `bottomInset` nữa. */
function useKeyboardOpen() {
  const [open, setOpen] = useState(Keyboard.isVisible());
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setOpen(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setOpen(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return open;
}

const styles = StyleSheet.create({
  composer: { borderTopWidth: 1, paddingHorizontal: 12, paddingTop: 12 },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  send: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  faded: { opacity: 0.45 },
  input: {
    flex: 1,
    minWidth: 0,
    minHeight: 44,
    maxHeight: 132,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: Fonts.sans,
    fontSize: 14,
    lineHeight: 24,
  },
  counter: { marginTop: 6, textAlign: 'right' },
});
