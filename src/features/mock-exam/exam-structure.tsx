import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Card } from '@/components/ui';
import { alpha } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Cấu trúc đề HSK hiện hành theo cấp — chép `ExamStructure` ở `components/mock-exam/exam-structure.tsx` của web. */
const STRUCTURES: { level: number; rows: { part: string; task: string; n: number }[]; total: string }[] = [
  {
    level: 1,
    rows: [
      { part: 'Nghe — Phần 1', task: 'Nghe từ, đối chiếu tranh: đúng ✓ / sai ✗', n: 5 },
      { part: 'Nghe — Phần 2', task: 'Nghe 1 câu, chọn 1 trong 3 tranh', n: 5 },
      { part: 'Nghe — Phần 3', task: 'Nghe hội thoại, ghép với tranh A–F', n: 5 },
      { part: 'Nghe — Phần 4', task: 'Nghe câu + câu hỏi, chọn đáp án', n: 5 },
      { part: 'Đọc — Phần 1', task: 'Đọc từ, đối chiếu tranh: đúng ✓ / sai ✗', n: 5 },
      { part: 'Đọc — Phần 2', task: 'Đọc câu, ghép với tranh A–F', n: 5 },
      { part: 'Đọc — Phần 3', task: 'Ghép câu hỏi với câu trả lời A–F', n: 5 },
      { part: 'Đọc — Phần 4', task: 'Chọn từ A–F điền vào chỗ trống', n: 5 },
    ],
    total: 'Tổng 40 câu · 35 phút làm bài · 200 điểm · đạt từ 120 điểm.',
  },
  {
    level: 2,
    rows: [
      { part: 'Nghe — Phần 1', task: 'Nghe câu, đối chiếu tranh: đúng ✓ / sai ✗', n: 10 },
      { part: 'Nghe — Phần 2', task: 'Nghe hội thoại, ghép tranh (2 bộ tranh)', n: 10 },
      { part: 'Nghe — Phần 3', task: 'Hội thoại ngắn + câu hỏi, chọn A/B/C', n: 10 },
      { part: 'Nghe — Phần 4', task: 'Hội thoại dài hơn + câu hỏi, chọn A/B/C', n: 5 },
      { part: 'Đọc — Phần 1', task: 'Đọc câu, ghép với tranh A–F', n: 5 },
      { part: 'Đọc — Phần 2', task: 'Chọn từ A–F điền vào chỗ trống', n: 5 },
      { part: 'Đọc — Phần 3', task: 'Đọc đoạn văn, xét câu ★ đúng / sai', n: 5 },
      { part: 'Đọc — Phần 4', task: 'Ghép câu hỏi – câu trả lời (2 bộ)', n: 10 },
    ],
    total: 'Tổng 60 câu · 50 phút làm bài · 200 điểm · đạt từ 120 điểm.',
  },
  {
    level: 3,
    rows: [
      { part: 'Nghe — Phần 1', task: 'Nghe hội thoại, ghép tranh (2 bộ tranh)', n: 10 },
      { part: 'Nghe — Phần 2', task: 'Nghe 1 đoạn, xét câu ★ đúng / sai', n: 10 },
      { part: 'Nghe — Phần 3', task: 'Hội thoại ngắn + câu hỏi, chọn A/B/C', n: 10 },
      { part: 'Nghe — Phần 4', task: 'Hội thoại dài hơn + câu hỏi, chọn A/B/C', n: 10 },
      { part: 'Đọc — Phần 1', task: 'Ghép câu với câu đáp (2 bộ)', n: 10 },
      { part: 'Đọc — Phần 2', task: 'Chọn từ điền chỗ trống (2 bộ)', n: 10 },
      { part: 'Đọc — Phần 3', task: 'Đọc đoạn văn, trả lời câu hỏi ★', n: 10 },
      { part: 'Viết — Phần 1', task: 'Sắp xếp từ thành câu', n: 5 },
      { part: 'Viết — Phần 2', task: 'Nhìn pinyin viết chữ Hán', n: 5 },
    ],
    total: 'Tổng 80 câu · 85 phút làm bài · 300 điểm · đạt từ 180 điểm.',
  },
];

/** Bảng "Cấu trúc đề thi HSK N" có nút chọn cấp. */
export function ExamStructure() {
  const theme = useTheme();
  const [level, setLevel] = useState(1);
  const s = STRUCTURES.find((x) => x.level === level) ?? STRUCTURES[0];
  return (
    <Card style={styles.card}>
      <View style={styles.head}>
        <AppText weight="700">Cấu trúc đề thi HSK {level}</AppText>
        <View style={styles.tabs}>
          {STRUCTURES.map((x) => {
            const on = x.level === level;
            return (
              <Pressable
                key={x.level}
                onPress={() => setLevel(x.level)}
                accessibilityState={{ selected: on }}
                style={[
                  styles.tab,
                  on
                    ? { borderColor: alpha(theme.primary, 0.5), backgroundColor: alpha(theme.primary, 0.1) }
                    : { borderColor: 'transparent', backgroundColor: theme.surface2 },
                ]}>
                <AppText variant="caption" weight="600" color={on ? 'primary' : 'muted'}>
                  HSK {x.level}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </View>
      <View style={styles.table}>
        {s.rows.map((r, i) => (
          <View
            key={r.part}
            style={[styles.row, i < s.rows.length - 1 && { borderBottomWidth: 1, borderColor: alpha(theme.border, 0.6) }]}>
            <AppText variant="caption" weight="600" style={styles.part}>
              {r.part}
            </AppText>
            <AppText variant="caption" color="muted" style={styles.task}>
              {r.task}
            </AppText>
            <AppText variant="caption" weight="600">
              {r.n}
            </AppText>
          </View>
        ))}
      </View>
      <AppText variant="caption" color="muted" style={styles.total}>
        {s.total}
      </AppText>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 0 },
  head: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  tabs: { flexDirection: 'row', gap: 4 },
  tab: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  table: { marginTop: 12 },
  row: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 8, gap: 8 },
  part: { width: 92 },
  task: { flex: 1 },
  total: { marginTop: 12 },
});
