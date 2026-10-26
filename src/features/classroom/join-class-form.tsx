import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { AppText, Button } from '@/components/ui';
import { alpha, Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { errorMessage } from '@/lib/api';
import { joinClassroom } from '@/lib/classrooms';

/**
 * Ô nhập mã lớp (`JoinClassForm` của web): nhãn "Mã lớp", ô chữ in hoa giãn cách + nút "Vào lớp" cùng hàng.
 * Học viên nhập mã giáo viên gửi → vào lớp → mở trang lớp.
 */
export function JoinClassForm() {
  const theme = useTheme();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);

  async function join() {
    const clean = code.trim().toUpperCase();
    if (clean.length < 4 || busy) return;
    setBusy(true);
    setError(null);
    try {
      const { id } = await joinClassroom(clean);
      setCode('');
      router.push(`/lop-hoc/${id}`);
    } catch (err) {
      setError(errorMessage(err, 'Chưa vào được lớp. Bạn kiểm tra lại mã nhé.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.wrap}>
      <AppText variant="caption" weight="500" color="muted">
        Mã lớp
      </AppText>
      <View style={styles.row}>
        <TextInput
          value={code}
          onChangeText={(t) => {
            setCode(t);
            setError(null);
          }}
          onSubmitEditing={() => void join()}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          maxLength={9}
          autoCapitalize="characters"
          autoCorrect={false}
          placeholder="VD: HN4K7P"
          placeholderTextColor={theme.muted}
          accessibilityLabel="Mã lớp"
          style={[
            styles.input,
            {
              color: theme.text,
              borderColor: focused ? theme.primary : theme.border,
              backgroundColor: theme.surface,
              boxShadow: focused ? `0 0 0 4px ${alpha(theme.primary, 0.1)}` : undefined,
            },
          ]}
        />
        <Button title="Vào lớp" loading={busy} onPress={() => void join()} />
      </View>
      {error && (
        <AppText variant="caption" color="danger">
          {error}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  row: { flexDirection: 'row', gap: 8 },
  input: {
    flex: 1,
    minWidth: 0,
    height: 44,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontFamily: Fonts.mono,
    fontSize: 14,
    letterSpacing: 2,
  },
});
