import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, BackHandler, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useSWR from 'swr';

import { AppText, Button, Card, EmptyState, ErrorNote, Icon, Loading, Screen } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { ExamResult } from '@/features/mock-exam/exam-result';
import { mmss, SECTION_VI } from '@/features/mock-exam/labels';
import { PaperView } from '@/features/mock-exam/paper-view';
import { useExamRunner } from '@/features/mock-exam/use-exam-runner';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth';
import { goBack } from '@/lib/navigation';
import type { MockPaper } from '@/lib/types';

/** Làm 1 đề thi thử: giới thiệu → làm bài (đồng hồ, nộp bài) → điểm + chữa bài. */
export default function MockExamScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { user } = useAuth();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  // Đề cố định trong lúc làm — không tải lại khi quay lại app.
  const { data: paper, error } = useSWR<MockPaper>(`/mock-exams/${slug}`, {
    revalidateOnFocus: false,
    revalidateIfStale: false,
  });
  const exam = useExamRunner(slug, paper);
  const [pinyin, setPinyin] = useState<boolean | null>(null);
  const showPinyin = pinyin ?? paper?.showPinyin ?? false;

  function confirmExit() {
    Alert.alert('Thoát bài thi?', 'Bài đang làm được lưu trên máy — quay lại trong thời gian làm bài là làm tiếp được.', [
      { text: 'Làm tiếp', style: 'cancel' },
      { text: 'Thoát', style: 'destructive', onPress: goBack },
    ]);
  }

  function confirmSubmit() {
    const left = (paper?.questionCount ?? 0) - exam.answered;
    Alert.alert(
      'Nộp bài?',
      left > 0 ? `Còn ${left} câu chưa làm — câu bỏ trống tính sai.` : 'Bạn đã làm hết các câu.',
      [
        { text: 'Làm tiếp', style: 'cancel' },
        { text: 'Nộp bài', onPress: () => void exam.submit() },
      ],
    );
  }

  // Nút Back của Android lúc đang làm bài: hỏi lại trước khi thoát.
  useEffect(() => {
    if (exam.phase !== 'test') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      confirmExit();
      return true;
    });
    return () => sub.remove();
  }, [exam.phase]);

  if (error) {
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Thi thử HSK' }} />
        <EmptyState title="Chưa tải được đề thi" description="Bạn kiểm tra kết nối rồi thử lại sau nhé.">
          <Button title="Về danh sách đề" variant="secondary" onPress={goBack} />
        </EmptyState>
      </Screen>
    );
  }
  if (!paper) {
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Thi thử HSK' }} />
        <Loading label="Đang mở đề thi…" />
      </Screen>
    );
  }

  if (exam.phase === 'result' && exam.result) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <ExamResult
          paper={paper}
          result={exam.result}
          answers={exam.answers}
          usedSec={exam.usedSec}
          isGuest={!user}
          onRetry={() => exam.start(null)}
        />
      </>
    );
  }

  if (exam.phase === 'intro') {
    return (
      <Screen>
        <Stack.Screen options={{ title: paper.title, headerShown: true }} />
        <Card>
          <AppText variant="title">{paper.title}</AppText>
          {paper.sections.map((s) => (
            <AppText key={s.kind} color="muted">
              {SECTION_VI[s.kind].zh} {SECTION_VI[s.kind].vi}:{' '}
              {s.parts.reduce((n, p) => n + p.items.length, 0)} câu
            </AppText>
          ))}
          <AppText color="muted">
            {paper.durationMin} phút · {paper.maxScore} điểm · đạt từ {paper.passScore}
          </AppText>
        </Card>
        <AppText variant="small" color="muted">
          Đồng hồ chạy ngay khi bắt đầu, hết giờ tự nộp. Phần nghe đọc mỗi câu 2 lần như đề thật — nhớ bật âm thanh.
        </AppText>
        {exam.saved && (
          <Button
            title={`Làm tiếp (đã làm ${exam.saved.answers.filter((a) => a !== null).length} câu)`}
            icon="play"
            onPress={() => exam.start(exam.saved)}
          />
        )}
        <Button
          title={exam.saved ? 'Làm lại từ đầu' : 'Bắt đầu làm bài'}
          variant={exam.saved ? 'secondary' : 'primary'}
          icon="arrow"
          onPress={() => exam.start(null)}
        />
      </Screen>
    );
  }

  const lowTime = exam.remaining <= 5 * 60;
  return (
    <View style={[styles.fill, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false, gestureEnabled: false }} />
      <View style={[styles.header, { borderColor: theme.border, backgroundColor: theme.surface }]}>
        <Pressable onPress={confirmExit} hitSlop={8} accessibilityLabel="Thoát bài thi">
          <Icon name="close" size={22} color="muted" />
        </Pressable>
        <View style={styles.fill}>
          <AppText variant="small" bold numberOfLines={1}>
            {paper.title}
          </AppText>
          <AppText variant="caption" color="muted">
            Đã làm {exam.answered}/{paper.questionCount}
          </AppText>
        </View>
        <Pressable
          onPress={() => setPinyin(!showPinyin)}
          style={[styles.pill, { borderColor: showPinyin ? theme.primary : theme.border }]}>
          <AppText variant="caption" bold color={showPinyin ? 'primary' : 'muted'}>
            Pinyin
          </AppText>
        </Pressable>
        <View style={[styles.pill, { borderColor: lowTime ? theme.danger : theme.border }]}>
          <AppText variant="small" bold color={lowTime ? 'danger' : 'text'}>
            {mmss(exam.remaining)}
          </AppText>
        </View>
      </View>
      <ScrollView contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 120 }]}>
        <PaperView paper={paper} answers={exam.answers} pinyin={showPinyin} onAnswer={exam.setAnswer} />
        {exam.submitError && <ErrorNote>Chưa nộp được bài — bạn kiểm tra mạng rồi bấm nộp lại nhé.</ErrorNote>}
        <Button title="Nộp bài" icon="arrow" loading={exam.busy} onPress={confirmSubmit} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  pill: { borderWidth: 1, borderRadius: Radius.md, paddingHorizontal: 10, paddingVertical: 6 },
  body: { padding: Spacing.lg, gap: Spacing.lg },
});
