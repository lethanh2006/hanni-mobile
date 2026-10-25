import { router } from 'expo-router';
import { useState } from 'react';

import { AppText, Button, Card, ChipRow, ErrorNote, TextField } from '@/components/ui';
import { errorMessage } from '@/lib/api';
import { createClassroom } from '@/lib/classrooms';
import { HSK_LEVELS, hskLabel } from '@/lib/hsk';

const LEVEL_OPTIONS = [{ value: 0, label: 'Chưa chọn cấp' }, ...HSK_LEVELS.map((l) => ({ value: l, label: hskLabel(l) }))];

/** Ai có tài khoản cũng tạo được lớp miễn phí; người tạo là giáo viên của lớp. */
export function CreateClassForm() {
  const [name, setName] = useState('');
  const [level, setLevel] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    if (!name.trim()) {
      setError('Bạn đặt tên lớp trước nhé (vd: HSK 1 — Tối thứ 3).');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const created = await createClassroom({ name: name.trim(), hskLevel: level || undefined });
      setName('');
      router.push(`/lop-hoc/${created.id}`);
    } catch (err) {
      setError(errorMessage(err, 'Chưa tạo được lớp. Thử lại nhé.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <AppText variant="label" color="muted">
        Giáo viên
      </AppText>
      <AppText bold>Tạo lớp miễn phí</AppText>
      <AppText variant="small" color="muted">
        Tạo xong bạn có mã lớp để gửi học viên, giao bài học / đề thi và xem tiến độ từng bạn.
      </AppText>
      <TextField label="Tên lớp" value={name} onChangeText={setName} placeholder="VD: HSK 1 — Tối thứ 3" />
      <ChipRow options={LEVEL_OPTIONS} value={level} onChange={setLevel} />
      {error && <ErrorNote>{error}</ErrorNote>}
      <Button title="Tạo lớp" variant="secondary" icon="plus" loading={busy} onPress={create} />
    </Card>
  );
}
