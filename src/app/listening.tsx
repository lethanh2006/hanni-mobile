import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, Card, ProgressBar, Screen, SectionHeading } from '@/components/ui';
import { alpha } from '@/constants/theme';
import { ListeningWord } from '@/features/practice/listening-word';
import type { ListenVerdict } from '@/features/practice/pinyin-answer';
import { PracticeLibrary, PracticeTips } from '@/features/practice/practice-library';
import { usePracticeWords } from '@/features/practice/practice-words';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth';
import { recordPracticeAttempt, usePracticeStats } from '@/lib/hooks';
import type { Word } from '@/lib/types';

/** Luyện nghe (`/listening` của web): nghe 1 từ, gõ lại bằng pinyin hoặc chữ Hán. Khách luyện được, chỉ không lưu lượt luyện. */
export default function ListeningScreen() {
  const { user } = useAuth();
  const { lesson } = useLocalSearchParams<{ lesson?: string }>();
  const { words, loading, error, retry, scope } = usePracticeWords(lesson);

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Luyện nghe' }} />
      <PracticeLibrary
        icon="headphones"
        tone="accent"
        title="Luyện nghe"
        description="Nghe một từ, gõ lại bằng pinyin hoặc chữ Hán rồi đối chiếu để nhớ lâu hơn."
        startLabel="Bắt đầu luyện nghe"
        guideTitle="Lắng nghe. Ghi nhớ. Hiểu hơn."
        guideNote="Dùng tai nghe nếu có để nghe rõ từng thanh điệu."
        steps={[
          'Nhấn nút loa để nghe từ — có thể chỉnh tốc độ chậm/nhanh.',
          'Gõ lại bằng pinyin (vd ni3hao3 hoặc nǐ hǎo) hoặc chữ Hán rồi kiểm tra.',
          'Sai thì xem đáp án và nghĩa, rồi chuyển sang từ tiếp theo.',
        ]}
        words={words}
        loading={loading}
        error={error}
        scope={scope}
        onRetry={retry}>
        {/* Đổi nhóm từ thì làm lại từ đầu. */}
        {(list) => <ListeningSession key={list.map((w) => w.id).join()} words={list} loggedIn={Boolean(user)} />}
      </PracticeLibrary>
    </Screen>
  );
}

function ListeningSession({ words, loggedIn }: { words: Word[]; loggedIn: boolean }) {
  const theme = useTheme();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { value: string; verdict: ListenVerdict }>>({});
  const stats = usePracticeStats('LISTENING');
  const word = words[index];
  const completed = Object.keys(answers).length;
  const correct = Object.values(answers).filter((a) => a.verdict === 'right').length;

  return (
    <View style={styles.session}>
      <Card style={styles.card}>
        <SectionHeading
          icon="headphones"
          eyebrow="Nghe & viết"
          title="Bạn vừa nghe từ gì?"
          tone="accent"
          right={
            <View style={[styles.counter, { backgroundColor: alpha(theme.primary, 0.08) }]}>
              <AppText variant="caption" weight="600" color="primary">
                {index + 1} / {words.length}
              </AppText>
            </View>
          }
        />
        <ListeningWord
          key={word.id}
          word={word}
          saved={answers[word.id]}
          onCheck={(value, verdict) => {
            setAnswers((current) => ({ ...current, [word.id]: { value, verdict } }));
            // Khách luyện thử — không có tài khoản để lưu lượt luyện.
            if (loggedIn) void recordPracticeAttempt(word.id, 'LISTENING', verdict === 'right').then(() => stats.mutate());
          }}
        />
      </Card>
      <View style={styles.nav}>
        <Button title="Từ trước" leftIcon="back" variant="secondary" disabled={index === 0} onPress={() => setIndex(index - 1)} />
        <Button title="Từ tiếp theo" icon="arrow" disabled={index === words.length - 1} onPress={() => setIndex(index + 1)} />
      </View>

      <PracticeTips
        title="Nghe hiệu quả hơn"
        tips={[
          'Nghe lần đầu ở tốc độ thường, tập trung vào âm đầu và thanh điệu.',
          'Thử nghe chậm hơn nếu cần, rồi gõ pinyin kèm thanh (hoặc chữ Hán) bạn nhận ra.',
          'Đối chiếu đáp án rồi đọc lại thành tiếng để ghi nhớ từ.',
        ]}>
        <Card style={styles.card}>
          <SectionHeading icon="target" title="Tiến độ nhóm từ này" tone="good" />
          <AppText weight="600" style={styles.big}>
            {completed}
            <AppText color="muted"> / {words.length} từ</AppText>
          </AppText>
          <ProgressBar value={(completed / words.length) * 100} />
          <View style={styles.rowBetween}>
            <AppText color="muted">Trả lời đúng</AppText>
            <AppText weight="600" color="good">
              {correct}
            </AppText>
          </View>
          {/* Luyện hết nhóm từ mà không có gì báo thì hụt hẫng — báo xong và gợi ý làm gì tiếp. */}
          {completed === words.length && words.length > 0 && (
            <View style={[styles.done, { borderColor: theme.border }]}>
              <AppText weight="600" color="good" center>
                Xong nhóm từ này!
              </AppText>
              <AppText variant="caption" color="muted" center style={styles.doneText}>
                Nghe đúng {correct}/{words.length} từ. Ôn lại chính những từ vừa nghe bằng thẻ ghi nhớ sẽ nhớ chắc hơn.
              </AppText>
              <Button title="Ôn tập" leftIcon="cards" variant="secondary" onPress={() => router.navigate('/study')} style={styles.center} />
            </View>
          )}
        </Card>
        {stats.data && stats.data.totalAttempts > 0 && (
          <Card style={styles.card}>
            <SectionHeading icon="chart" eyebrow="Từ trước đến nay" title="Luyện nghe" tone="lavender" />
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <AppText weight="600" style={styles.statValue}>
                  {stats.data.totalAttempts.toLocaleString('vi-VN')}
                </AppText>
                <AppText variant="caption" color="muted">
                  lượt nghe
                </AppText>
              </View>
              <View style={styles.stat}>
                <AppText weight="600" color="primary" style={styles.statValue}>
                  {stats.data.accuracyPct ?? 0}%
                </AppText>
                <AppText variant="caption" color="muted">
                  độ chính xác
                </AppText>
              </View>
            </View>
            <AppText variant="caption" color="muted" style={styles.statNote}>
              {stats.data.distinctWordsCount.toLocaleString('vi-VN')} từ khác nhau đã được luyện nghe.
            </AppText>
          </Card>
        )}
      </PracticeTips>
    </View>
  );
}

const styles = StyleSheet.create({
  session: { gap: 20 },
  card: { gap: 20 },
  counter: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  nav: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  big: { fontSize: 30, lineHeight: 36 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between' },
  done: { borderTopWidth: 1, paddingTop: 16 },
  doneText: { marginTop: 4, lineHeight: 20 },
  center: { alignSelf: 'center', marginTop: 12 },
  statsRow: { flexDirection: 'row', gap: 12 },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 24, lineHeight: 32 },
  statNote: { lineHeight: 20 },
});
