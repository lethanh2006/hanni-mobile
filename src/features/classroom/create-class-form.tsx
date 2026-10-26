import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, ChipRow, TextField } from '@/components/ui';
import { errorMessage } from '@/lib/api';
import { createClassroom } from '@/lib/classrooms';
import { HSK_LEVELS, hskLabel } from '@/lib/hsk';

const LEVEL_OPTIONS = [{ value: 0, label: 'Chưa chọn' }, ...HSK_LEVELS.map((l) => ({ value: l, label: hskLabel(l) }))];

/**
 * Form tạo lớp (`CreateClassForm` ở `/lop-hoc` của web): Tên lớp · Cấp HSK (web là ô chọn, app là hàng chip) ·
 * nút "+ Tạo lớp". Ai có tài khoản cũng tạo được, người tạo là giáo viên của lớp.
 */
export function CreateClassForm() {
  const [name, setName] = useState('');
  const [level, setLevel] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    if (busy) return;
    if (name.trim().length < 2) {
      setError('Đặt tên lớp trước nhé (ít nhất 2 ký tự), vd: HSK 1 — tối thứ 3, 5.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const created = await createClassroom({ name: name.trim(), ...(level ? { hskLevel: level } : {}) });
      setName('');
      router.push(`/lop-hoc/${created.id}`);
    } catch (err) {
      setError(errorMessage(err, 'Chưa tạo được lớp, thử lại nhé.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.form}>
      <TextField label="Tên lớp" value={name} onChangeText={setName} maxLength={60} placeholder="VD: HSK 1 — tối thứ 3, 5" />
      <View style={styles.levels}>
        <AppText variant="caption" weight="600">
          Cấp HSK
        </AppText>
        <ChipRow options={LEVEL_OPTIONS} value={level} onChange={setLevel} />
      </View>
      {error && (
        <AppText variant="caption" color="danger">
          {error}
        </AppText>
      )}
      <Button title={busy ? 'Đang tạo…' : 'Tạo lớp'} leftIcon="plus" disabled={busy} onPress={() => void create()} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: 12 },
  levels: { gap: 8 },
});
