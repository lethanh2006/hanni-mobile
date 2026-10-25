import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import useSWR from 'swr';

import { AppText, Button, EmptyState, ErrorNote, Loading, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { ExamItem, SharedBoard } from '@/features/mock-exam/exam-item';
import { partInfo, SECTION_SHORT } from '@/features/mock-exam/part-info';
import { api } from '@/lib/api';
import { hskLabel } from '@/lib/hsk';
import type { MockAnswer, MockPracticeSet, MockReviewItem } from '@/lib/types';

const keyOf = (examSlug: string, no: number) => `${examSlug}:${no}`;

/**
 * Luyện từng dạng bài: các câu cùng 1 phần đề gom từ mọi đề cùng cấp — không đồng hồ,
 * làm câu nào chấm + chữa câu đó ngay (`POST /mock-exams/practice/check`).
 */
export default function PracticeSetScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { data: set, error } = useSWR<MockPracticeSet>(`/mock-exams/practice/${slug}`);
  const [answers, setAnswers] = useState<Record<string, MockAnswer | null>>({});
  const [reviews, setReviews] = useState<Record<string, MockReviewItem>>({});
  const [checking, setChecking] = useState<Record<string, boolean>>({});
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  const [pinyin, setPinyin] = useState<boolean | null>(null);
  const [round, setRound] = useState(0);

  if (error) {
    return (
      <Screen>
        <EmptyState title="Chưa tải được dạng bài này" description="Bạn kiểm tra kết nối rồi thử lại nhé." />
      </Screen>
    );
  }
  if (!set) {
    return (
      <Screen>
        <Loading />
      </Screen>
    );
  }

  const showPinyin = pinyin ?? set.showPinyin;
  const done = Object.keys(reviews).length;
  const right = Object.values(reviews).filter((r) => r.correct).length;
  // Câu tự đặt (HSK 4 viết phần 2): gõ chỉ lưu, bấm nút mới chấm — chấm theo từng phím thì chữ đầu đã bị khoá sai.
  const typed = set.type === 'write-sentence';

  async function check(examSlug: string, no: number, v: MockAnswer | null) {
    const k = keyOf(examSlug, no);
    setAnswers((a) => ({ ...a, [k]: v }));
    if (v === null) return; // câu sắp xếp chưa đủ mảnh
    setChecking((c) => ({ ...c, [k]: true }));
    setFailed((f) => ({ ...f, [k]: false }));
    try {
      const r = await api.post<MockReviewItem>('/mock-exams/practice/check', { examSlug, no, answer: v });
      setReviews((rv) => ({ ...rv, [k]: r }));
    } catch {
      setFailed((f) => ({ ...f, [k]: true }));
    } finally {
      setChecking((c) => ({ ...c, [k]: false }));
    }
  }

  function restart() {
    setAnswers({});
    setReviews({});
    setFailed({});
    setRound((r) => r + 1);
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: `${hskLabel(set.level)} · ${SECTION_SHORT[set.section]} ${set.part}` }} />
      <AppText variant="heading">{partInfo(set.section, set.type).label}</AppText>
      <AppText variant="small" color="muted">
        {partInfo(set.section, set.type).tip}
      </AppText>
      <View style={styles.row}>
        <AppText bold style={styles.flex}>
          Đã làm {done}/{set.count}
          {done > 0 ? ` · đúng ${right}` : ''}
        </AppText>
        <Button title={showPinyin ? 'Ẩn pinyin' : 'Pinyin'} variant="ghost" onPress={() => setPinyin(!showPinyin)} />
        {done > 0 && <Button title="Làm lại" variant="secondary" onPress={restart} />}
      </View>

      {set.groups.map((g) => (
        <View key={`${g.examSlug}-${g.part.no}`} style={styles.group}>
          <AppText variant="small" bold color="muted">
            {g.examTitle}
          </AppText>
          <SharedBoard part={g.part} pinyin={showPinyin} />
          {g.part.items.map((item) => {
            const k = keyOf(g.examSlug, item.no);
            const review = reviews[k];
            return (
              <View key={`${k}-${round}`} style={styles.group}>
                <ExamItem
                  part={g.part}
                  item={item}
                  section={set.section}
                  given={answers[k] ?? null}
                  onChange={
                    review || checking[k]
                      ? undefined
                      : typed
                        ? (v) => setAnswers((a) => ({ ...a, [k]: v }))
                        : (v) => void check(g.examSlug, item.no, v)
                  }
                  review={review}
                  pinyin={showPinyin}
                />
                {typed && !review && (
                  <Button
                    title={checking[k] ? 'Đang chấm…' : 'Chấm câu này'}
                    disabled={!answers[k] || checking[k]}
                    onPress={() => void check(g.examSlug, item.no, answers[k] ?? null)}
                  />
                )}
                {failed[k] && <ErrorNote>Chưa chấm được — kiểm tra kết nối rồi chọn lại nhé.</ErrorNote>}
              </View>
            );
          })}
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  flex: { flex: 1 },
  group: { gap: Spacing.md },
});
