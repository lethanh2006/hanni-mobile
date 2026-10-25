import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, Card, ChipRow, EmptyState, ErrorNote, Loading, Screen, TextLink } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { WordCard } from '@/features/lesson/word-card';
import { ApiError } from '@/lib/api';
import { useLesson } from '@/lib/hooks';
import { hskLabel } from '@/lib/hsk';

type Tab = 'words' | 'examples';

/** Từ vựng của 1 bài kèm âm Hán Việt, câu ví dụ và ngữ pháp liên quan. Khách xem được. */
export default function LessonDetailScreen() {
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const { data, error, mutate } = useLesson(lessonId);
  const [tab, setTab] = useState<Tab>('words');
  const [showMeaning, setShowMeaning] = useState(true);

  if (error) {
    return (
      <Screen>
        <ErrorNote>
          {error instanceof ApiError && error.status === 404
            ? 'Không tìm thấy bài học này. Hãy chọn một bài khác trong lộ trình.'
            : 'Chưa tải được bài học. Vui lòng thử lại.'}
        </ErrorNote>
        <Button title="Tải lại bài học" variant="secondary" onPress={() => void mutate()} />
      </Screen>
    );
  }
  if (!data) {
    return (
      <Screen>
        <Loading />
      </Screen>
    );
  }

  const { lesson, words, relatedGrammar } = data;
  const examples = words.flatMap((w) => (w.examples ?? []).map((e) => ({ ...e, word: w.simplified })));
  // Nhảy vào bài bất kỳ thì trang bài phải tự nói được mình đang ở đâu.
  const startedWords = words.filter((w) => w.progressState && w.progressState !== 'NEW').length;
  const allStarted = startedWords >= words.length && words.length > 0;

  return (
    <Screen>
      <Stack.Screen options={{ title: `Bài ${lesson.orderIndex} · ${hskLabel(lesson.hskLevel)}` }} />
      <AppText variant="title">{lesson.title}</AppText>
      <AppText variant="small" color="muted">
        Đã học {startedWords}/{words.length} từ
      </AppText>

      {words.length > 0 && (
        <View style={styles.actions}>
          <Button
            title={allStarted ? 'Học lại bài này' : startedWords > 0 ? 'Học tiếp' : 'Bắt đầu học'}
            icon="play"
            onPress={() => router.push(`/bai-hoc/${lesson.id}`)}
          />
          {startedWords > 0 && (
            <Button
              title="Ôn bằng flashcard"
              variant="secondary"
              onPress={() => router.push({ pathname: '/review', params: { lesson: lesson.id } })}
            />
          )}
        </View>
      )}

      <View style={styles.toolbar}>
        <View style={styles.flex}>
          <ChipRow<Tab>
            options={[
              { value: 'words', label: `Từ vựng ${words.length}` },
              // Bài chưa có câu ví dụ thì ẩn hẳn tab, khỏi bấm vào ra màn trống.
              ...(examples.length > 0 ? [{ value: 'examples' as const, label: `Ví dụ ${examples.length}` }] : []),
            ]}
            value={tab}
            onChange={setTab}
          />
        </View>
        <TextLink
          title={showMeaning ? 'Ẩn nghĩa' : 'Hiện nghĩa'}
          color="muted"
          onPress={() => setShowMeaning(!showMeaning)}
        />
      </View>

      {tab === 'words' &&
        (words.length > 0 ? (
          words.map((w, i) => <WordCard key={w.id} word={w} index={i} showMeaning={showMeaning} />)
        ) : (
          <EmptyState
            title="Chưa có từ vựng"
            description="Nội dung bài học này đang được bổ sung. Hãy chọn bài khác trong lộ trình."
          />
        ))}

      {tab === 'examples' &&
        examples.map((e) => (
          <Card key={e.id}>
            <AppText variant="caption" bold color="primary">
              {e.word}
            </AppText>
            <AppText variant="heading">{e.zh}</AppText>
            {e.pinyin && <AppText color="primary">{e.pinyin}</AppText>}
            {showMeaning && (e.vi || e.en) && <AppText color="muted">{e.vi ?? e.en}</AppText>}
          </Card>
        ))}

      {relatedGrammar.length > 0 && (
        <Card>
          <AppText bold>Ngữ pháp trong bài</AppText>
          {relatedGrammar.map((g) => (
            <TextLink
              key={g.slug}
              title={`${g.titleZh} — ${g.titleVi} →`}
              onPress={() => router.push(`/ngu-phap/${encodeURIComponent(g.slug)}`)}
            />
          ))}
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: { gap: Spacing.sm },
  toolbar: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  flex: { flex: 1 },
});
