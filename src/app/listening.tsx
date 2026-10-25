import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, Card, EmptyState, Loading, ProgressBar, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { ListeningWord } from '@/features/practice/listening-word';
import type { ListenVerdict } from '@/features/practice/pinyin-answer';
import { ScopePicker, usePracticeWords } from '@/features/practice/practice-words';
import { useAuth } from '@/lib/auth';
import { recordPracticeAttempt, usePracticeStats } from '@/lib/hooks';
import type { Word } from '@/lib/types';

/** Luyện nghe: nghe 1 từ, gõ lại bằng pinyin hoặc chữ Hán. Khách luyện được, chỉ không lưu lượt luyện. */
export default function ListeningScreen() {
  const { user } = useAuth();
  const { words, loading, error, scope } = usePracticeWords();

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Luyện nghe' }} />
      {!user && (
        <AppText variant="small" color="muted">
          Bạn đang luyện thử — kết quả chưa được lưu. Tạo tài khoản để Hanni ghi lại từ bạn hay sai.
        </AppText>
      )}
      <ScopePicker scope={scope} />
      {error ? (
        <EmptyState title="Chưa tải được từ vựng" description="Bạn kiểm tra kết nối rồi thử lại nhé." />
      ) : loading ? (
        <Loading />
      ) : words.length === 0 ? (
        <EmptyState title="Chưa có từ để luyện" description="Chọn cấp HSK khác để luyện nhé." />
      ) : (
        // Đổi nhóm từ thì làm lại từ đầu.
        <ListeningSession key={words.map((w) => w.id).join()} words={words} loggedIn={Boolean(user)} />
      )}
    </Screen>
  );
}

function ListeningSession({ words, loggedIn }: { words: Word[]; loggedIn: boolean }) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { value: string; verdict: ListenVerdict }>>({});
  const stats = usePracticeStats('LISTENING');
  const word = words[index];
  const done = Object.keys(answers).length;
  const correct = Object.values(answers).filter((a) => a.verdict === 'right').length;

  return (
    <>
      <Card>
        <View style={styles.row}>
          <AppText bold style={styles.flex}>
            Bạn vừa nghe từ gì?
          </AppText>
          <AppText variant="small" color="muted">
            {index + 1}/{words.length}
          </AppText>
        </View>
        <ProgressBar value={(done / words.length) * 100} />
        <ListeningWord
          key={word.id}
          word={word}
          saved={answers[word.id]}
          onCheck={(value, verdict) => {
            setAnswers((current) => ({ ...current, [word.id]: { value, verdict } }));
            if (loggedIn) void recordPracticeAttempt(word.id, 'LISTENING', verdict === 'right').then(() => stats.mutate());
          }}
        />
      </Card>
      <View style={styles.row}>
        <Button title="Từ trước" variant="secondary" disabled={index === 0} onPress={() => setIndex(index - 1)} style={styles.flex} />
        <Button title="Từ tiếp theo" icon="arrow" disabled={index === words.length - 1} onPress={() => setIndex(index + 1)} style={styles.flex} />
      </View>

      {done === words.length && (
        <Card>
          <AppText bold color="good">
            Xong nhóm từ này!
          </AppText>
          <AppText variant="small" color="muted">
            Nghe đúng {correct}/{words.length} từ. Ôn lại bằng flashcard để nhớ chắc hơn.
          </AppText>
          <Button title="Ôn tập" variant="secondary" onPress={() => router.navigate('/study')} />
        </Card>
      )}

      {stats.data && stats.data.totalAttempts > 0 && (
        <Card>
          <AppText bold>Luyện nghe từ trước đến nay</AppText>
          <AppText variant="small" color="muted">
            {stats.data.totalAttempts.toLocaleString('vi-VN')} lượt · đúng {stats.data.accuracyPct ?? 0}% ·{' '}
            {stats.data.distinctWordsCount.toLocaleString('vi-VN')} từ khác nhau
          </AppText>
        </Card>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  flex: { flex: 1 },
});
