import { router } from 'expo-router';
import { useState } from 'react';

import { AppText, Button, Card, ErrorNote, TextField } from '@/components/ui';
import { errorMessage } from '@/lib/api';
import { joinClassroom } from '@/lib/classrooms';

/** Học viên nhập mã lớp giáo viên gửi → vào lớp → mở trang lớp. */
export function JoinClassForm() {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function join() {
    setBusy(true);
    setError(null);
    try {
      const { id } = await joinClassroom(code.trim().toUpperCase());
      setCode('');
      router.push(`/lop-hoc/${id}`);
    } catch (err) {
      setError(errorMessage(err, 'Chưa vào được lớp. Bạn kiểm tra lại mã nhé.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <AppText variant="label" color="muted">
        Học viên
      </AppText>
      <AppText bold>Vào lớp bằng mã</AppText>
      <AppText variant="small" color="muted">
        Giáo viên gửi mã lớp cho bạn? Nhập ở đây để nhận bài được giao ngay ở Trang chủ.
      </AppText>
      <TextField
        label="Mã lớp"
        value={code}
        onChangeText={setCode}
        placeholder="VD: HSK1A2B"
        autoCapitalize="characters"
        autoCorrect={false}
        onSubmitEditing={join}
      />
      {error && <ErrorNote>{error}</ErrorNote>}
      <Button title="Vào lớp" icon="arrow" loading={busy} disabled={code.trim().length < 4} onPress={join} />
    </Card>
  );
}
