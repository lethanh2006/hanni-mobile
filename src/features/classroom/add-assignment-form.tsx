import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import useSWR from 'swr';

import { AppText, Button, Card, Icon, Select, type IconName } from '@/components/ui';
import { alpha } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { errorMessage } from '@/lib/api';
import { addAssignment } from '@/lib/classrooms';
import { useLearnPath } from '@/lib/hooks';
import { HSK_LEVELS, hskLabel } from '@/lib/hsk';
import type { MockExamMeta } from '@/lib/types';

type Kind = 'LESSON' | 'MOCK_EXAM';

const KINDS: [Kind, string, IconName][] = [
  ['LESSON', 'Bài học', 'cards'],
  ['MOCK_EXAM', 'Đề thi thử', 'target'],
];

/** Ngày (yyyy-mm-dd theo giờ Việt Nam) của hôm nay + `days`. */
function vnDay(days: number): string {
  return new Date(Date.now() + days * 86_400_000 + 7 * 3600_000).toISOString().slice(0, 10);
}

/**
 * Web là ô chọn ngày (`<input type="date">`, từ hôm nay trở đi); app chưa có bộ chọn lịch nên cho chọn 1 trong
 * 15 ngày tới — đủ cho hạn nộp bài giao trên lớp.
 */
function dueOptions() {
  return [
    { value: '', label: 'Không có hạn' },
    ...Array.from({ length: 15 }, (_, i) => {
      const ymd = vnDay(i);
      const d = new Date(`${ymd}T12:00:00+07:00`);
      const date = d.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
      return { value: ymd, label: i === 0 ? `Hôm nay (${date})` : i === 1 ? `Ngày mai (${date})` : date };
    }),
  ];
}

/** "Giao bài" (`AssignForm` của web): bài học theo cấp hoặc 1 đề thi thử, hạn nộp tuỳ chọn. */
export function AddAssignmentForm({ classId, classLevel }: { classId: string; classLevel: number | null }) {
  const theme = useTheme();
  const [kind, setKind] = useState<Kind>('LESSON');
  const [level, setLevel] = useState(classLevel ?? 1);
  const [target, setTarget] = useState('');
  const [due, setDue] = useState('');
  const [dueChoices] = useState(dueOptions);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const path = useLearnPath(level);
  const exams = useSWR<MockExamMeta[]>('/mock-exams');
  const lessons = path.data?.level === level ? path.data.lessons : [];
  const levelExams = (exams.data ?? []).filter((e) => e.level === level);

  async function submit() {
    if (busy) return;
    if (!target) {
      setNote({ ok: false, text: kind === 'LESSON' ? 'Chọn bài học muốn giao trước nhé.' : 'Chọn đề thi muốn giao trước nhé.' });
      return;
    }
    setBusy(true);
    setNote(null);
    try {
      // Hạn nộp: hết ngày đã chọn theo giờ Việt Nam.
      const dueAt = due ? new Date(`${due}T23:59:00+07:00`).toISOString() : undefined;
      await addAssignment(classId, kind === 'LESSON' ? { kind, lessonId: target, dueAt } : { kind, examSlug: target, dueAt });
      setTarget('');
      setDue('');
      setNote({ ok: true, text: 'Đã giao bài — học viên thấy ngay ở Trang chủ.' });
    } catch (err) {
      setNote({ ok: false, text: errorMessage(err, 'Chưa giao được bài.') });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card style={styles.card}>
      <View style={styles.title}>
        <Icon name="flag" size={18} color="primary" />
        <AppText weight="700" style={styles.heading}>
          Giao bài
        </AppText>
      </View>
      <View style={styles.kinds} accessibilityRole="radiogroup">
        {KINDS.map(([k, label, icon]) => {
          const active = kind === k;
          return (
            <Pressable
              key={k}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
              onPress={() => {
                setKind(k);
                setTarget('');
              }}
              style={[
                styles.kind,
                active
                  ? { backgroundColor: alpha(theme.primary, 0.1), borderColor: alpha(theme.primary, 0.5) }
                  : { backgroundColor: theme.surface, borderColor: theme.border },
              ]}>
              <Icon name={icon} size={16} color={active ? 'primary' : 'muted'} />
              <AppText weight={active ? '700' : '600'} color={active ? 'primary' : 'muted'}>
                {label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
      <Field label="Cấp">
        <Select
          title="Cấp"
          value={level}
          options={HSK_LEVELS.map((l) => ({ value: l, label: hskLabel(l) }))}
          onChange={(l) => {
            setLevel(l);
            setTarget('');
          }}
        />
      </Field>
      <Field label={kind === 'LESSON' ? 'Bài học' : 'Đề thi thử'}>
        <Select
          title={kind === 'LESSON' ? 'Bài học' : 'Đề thi thử'}
          value={target || null}
          options={
            kind === 'LESSON'
              ? lessons.map((l) => ({ value: l.id, label: `Bài ${l.orderIndex}: ${l.title} (${l.wordCount} từ)` }))
              : levelExams.map((e) => ({ value: e.slug, label: `${e.title} · ${e.questionCount} câu · ${e.durationMin} phút` }))
          }
          onChange={setTarget}
        />
      </Field>
      {kind === 'MOCK_EXAM' && levelExams.length === 0 && (
        <AppText variant="caption" color="muted">
          Đề thi thử hiện có cho HSK 1–4.
        </AppText>
      )}
      <Field label="Hạn nộp (không bắt buộc)">
        <Select title="Hạn nộp" value={due} options={dueChoices} onChange={setDue} />
      </Field>
      {note && (
        <AppText variant="caption" color={note.ok ? 'good' : 'danger'}>
          {note.text}
        </AppText>
      )}
      <Button title={busy ? 'Đang giao…' : 'Giao cho cả lớp'} disabled={busy} onPress={() => void submit()} />
    </Card>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.field}>
      <AppText variant="caption" weight="500" color="muted">
        {label}
      </AppText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: 12 },
  heading: { fontSize: 16, lineHeight: 24 },
  title: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  kinds: { flexDirection: 'row', gap: 8 },
  kind: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  field: { gap: 4 },
});
