import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, Card, ChipRow, ProgressBar, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { goBack } from '@/lib/navigation';
import type { MockAnswer, MockExamResult, MockPaper } from '@/lib/types';

import { mmss, SECTION_VI } from './labels';
import { PaperView } from './paper-view';

type Filter = 'wrong' | 'all';

/** Điểm, đạt/chưa đạt, điểm từng phần thi rồi chữa bài (mặc định chỉ câu sai). */
export function ExamResult({
  paper,
  result,
  answers,
  usedSec,
  isGuest,
  onRetry,
}: {
  paper: MockPaper;
  result: MockExamResult;
  answers: (MockAnswer | null)[];
  usedSec: number;
  isGuest: boolean;
  onRetry: () => void;
}) {
  const [filter, setFilter] = useState<Filter>('wrong');
  const [pinyin, setPinyin] = useState(paper.showPinyin);
  const review = new Map(result.review.map((r) => [r.no, r]));
  const wrong = new Set(result.review.filter((r) => !r.correct).map((r) => r.no));

  return (
    <Screen safeTop>
      <Card style={styles.center}>
        <Image source={require('@/assets/images/mascot.png')} style={styles.mascot} contentFit="contain" />
        <AppText variant="label" color={result.passed ? 'good' : 'danger'}>
          {result.passed ? 'Đạt' : 'Chưa đạt'} · {paper.title}
        </AppText>
        <AppText style={styles.score}>
          {result.score}
          <AppText variant="heading" color="muted">
            /{result.maxScore}
          </AppText>
        </AppText>
        <AppText variant="small" color="muted">
          Điểm đạt {result.passScore} · làm trong {mmss(usedSec)}
        </AppText>
      </Card>

      <Card>
        {result.sections.map((s) => (
          <View key={s.kind} style={styles.sectionRow}>
            <View style={styles.row}>
              <AppText bold style={styles.flex}>
                {SECTION_VI[s.kind].vi}
              </AppText>
              <AppText variant="small" color="muted">
                {s.correct}/{s.total} câu · {s.score} điểm
              </AppText>
            </View>
            <ProgressBar value={(s.correct / Math.max(1, s.total)) * 100} color={s.correct / s.total >= 0.6 ? 'good' : 'primary'} />
          </View>
        ))}
      </Card>

      {isGuest && (
        <Card>
          <AppText bold>Lưu điểm và lịch sử làm bài?</AppText>
          <AppText variant="small" color="muted">
            Tạo tài khoản miễn phí — bài vừa làm được nộp lại vào tài khoản của bạn.
          </AppText>
          <Button title="Tạo tài khoản để lưu điểm" onPress={() => router.push('/register')} />
        </Card>
      )}

      <View style={styles.actions}>
        <Button title="Làm lại đề này" variant="secondary" onPress={onRetry} style={styles.flex} />
        <Button title="Về danh sách đề" variant="ghost" onPress={goBack} style={styles.flex} />
      </View>

      <AppText variant="heading">Chữa bài</AppText>
      <View style={styles.row}>
        <View style={styles.flex}>
          <ChipRow<Filter>
            options={[
              { value: 'wrong', label: `Câu sai ${wrong.size}` },
              { value: 'all', label: `Tất cả ${result.review.length}` },
            ]}
            value={filter}
            onChange={setFilter}
          />
        </View>
        <Button title={pinyin ? 'Ẩn pinyin' : 'Pinyin'} variant="ghost" onPress={() => setPinyin(!pinyin)} />
      </View>
      {filter === 'wrong' && wrong.size === 0 ? (
        <AppText color="good">Không sai câu nào — xuất sắc!</AppText>
      ) : (
        <PaperView
          paper={paper}
          answers={answers}
          pinyin={pinyin}
          review={review}
          only={filter === 'wrong' ? wrong : undefined}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center' },
  mascot: { width: 140, height: 118 },
  score: { fontSize: 48, lineHeight: 58, fontWeight: '800' },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  flex: { flex: 1 },
  sectionRow: { gap: 6, paddingVertical: 4 },
  actions: { flexDirection: 'row', gap: Spacing.sm },
});
