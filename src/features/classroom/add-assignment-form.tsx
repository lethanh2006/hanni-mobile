import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import useSWR from 'swr';

import { AppText, Button, Card, ChipRow, ErrorNote, SectionTitle, TextLink } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { errorMessage } from '@/lib/api';
import { addAssignment } from '@/lib/classrooms';
import { useLearnPath } from '@/lib/hooks';
import { HSK_LEVELS, hskLabel } from '@/lib/hsk';
import type { MockExamMeta } from '@/lib/types';

type Kind = 'LESSON' | 'MOCK_EXAM';

/** Hạn nộp: hết ngày thứ N kể từ hôm nay, theo giờ Việt Nam. */
function dueInDays(days: number): string | undefined {
  if (!days) return undefined;
  const d = new Date(Date.now() + days * 86_400_000);
  const ymd = new Date(d.getTime() + 7 * 3600_000).toISOString().slice(0, 10);
  return new Date(`${ymd}T23:59:00+07:00`).toISOString();
}

const DUE_OPTIONS = [
  { value: 0, label: 'Không hạn' },
  { value: 1, label: 'Ngày mai' },
  { value: 3, label: '3 ngày' },
  { value: 7, label: '1 tuần' },
];

/** Giáo viên giao 1 bài học (theo cấp) hoặc 1 đề thi thử, có thể kèm hạn nộp. */
export function AddAssignmentForm({ classId, classLevel }: { classId: string; classLevel: number | null }) {
  const theme = useTheme();
  const [kind, setKind] = useState<Kind>('LESSON');
  const [level, setLevel] = useState(classLevel ?? 1);
  const [target, setTarget] = useState<{ id: string; label: string } | null>(null);
  const [picking, setPicking] = useState(false);
  const [due, setDue] = useState(0);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const path = useLearnPath(level);
  const exams = useSWR<MockExamMeta[]>('/mock-exams');

  const choices =
    kind === 'LESSON'
      ? (path.data?.level === level ? path.data.lessons : []).map((l) => ({ id: l.id, label: `Bài ${l.orderIndex}: ${l.title}` }))
      : (exams.data ?? []).filter((e) => e.level === level).map((e) => ({ id: e.slug, label: e.title }));

  async function submit() {
    if (!target) {
      setNote({ ok: false, text: kind === 'LESSON' ? 'Chọn bài học muốn giao trước nhé.' : 'Chọn đề thi muốn giao trước nhé.' });
      return;
    }
    setBusy(true);
    setNote(null);
    try {
      const dueAt = dueInDays(due);
      await addAssignment(
        classId,
        kind === 'LESSON' ? { kind, lessonId: target.id, dueAt } : { kind, examSlug: target.id, dueAt },
      );
      setTarget(null);
      setDue(0);
      setNote({ ok: true, text: 'Đã giao bài — học viên thấy ngay ở Trang chủ.' });
    } catch (err) {
      setNote({ ok: false, text: errorMessage(err, 'Chưa giao được bài.') });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <SectionTitle title="Giao bài" />
      <ChipRow<Kind>
        options={[
          { value: 'LESSON', label: 'Bài học' },
          { value: 'MOCK_EXAM', label: 'Đề thi thử' },
        ]}
        value={kind}
        onChange={(k) => {
          setKind(k);
          setTarget(null);
        }}
      />
      <ChipRow
        options={HSK_LEVELS.map((l) => ({ value: l, label: hskLabel(l) }))}
        value={level}
        onChange={(l) => {
          setLevel(l);
          setTarget(null);
        }}
      />
      <AppText bold>{target ? target.label : kind === 'LESSON' ? 'Chưa chọn bài học' : 'Chưa chọn đề thi'}</AppText>
      <TextLink title={picking ? 'Thu gọn' : target ? 'Chọn lại' : 'Chọn'} onPress={() => setPicking(!picking)} />
      {picking &&
        (choices.length === 0 ? (
          <AppText variant="small" color="muted">
            Cấp này chưa có {kind === 'LESSON' ? 'bài học' : 'đề thi thử'}.
          </AppText>
        ) : (
          choices.map((c) => (
            <Pressable
              key={c.id}
              onPress={() => {
                setTarget(c);
                setPicking(false);
              }}
              style={[styles.choice, { borderColor: theme.border }]}>
              <AppText variant="small" color={target?.id === c.id ? 'primary' : 'text'}>
                {c.label}
              </AppText>
            </Pressable>
          ))
        ))}
      <AppText variant="small" bold>
        Hạn nộp
      </AppText>
      <ChipRow options={DUE_OPTIONS} value={due} onChange={setDue} />
      {note && (note.ok ? <AppText variant="small" color="good">✓ {note.text}</AppText> : <ErrorNote>{note.text}</ErrorNote>)}
      <Button title="Giao bài" icon="arrow" loading={busy} onPress={submit} />
    </Card>
  );
}

const styles = StyleSheet.create({
  choice: { paddingVertical: Spacing.sm, borderTopWidth: 1 },
});
