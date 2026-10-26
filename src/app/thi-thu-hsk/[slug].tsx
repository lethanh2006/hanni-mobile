import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { BackHandler, Pressable, ScrollView, StyleSheet, View, type HostInstance, type ScrollViewInstance } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useSWR from 'swr';

import { AppText, Button, Icon, Loading } from '@/components/ui';
import { alpha, Fonts } from '@/constants/theme';
import { ExamDialog, ExamNavigator, NavigatorSheet } from '@/features/mock-exam/exam-chrome';
import { ExamIntro } from '@/features/mock-exam/exam-intro';
import { ExamResult } from '@/features/mock-exam/exam-result';
import { mmss } from '@/features/mock-exam/labels';
import { stopListening } from '@/features/mock-exam/listening';
import { PaperView } from '@/features/mock-exam/paper-view';
import { useExamRunner } from '@/features/mock-exam/use-exam-runner';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth';
import type { MockPaper } from '@/lib/types';

/** Làm 1 đề thi thử (phòng thi `/thi-thu-hsk/[slug]` của web): giới thiệu → làm bài (đồng hồ, nộp bài) → điểm + chữa bài. */
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
  const [confirm, setConfirm] = useState<'submit' | 'exit' | null>(null);
  const [navOpen, setNavOpen] = useState(false);
  const showPinyin = pinyin ?? paper?.showPinyin ?? false;
  const scrollRef = useRef<ScrollViewInstance>(null);
  const contentRef = useRef<HostInstance>(null);
  const itemViews = useRef(new Map<number, HostInstance>());

  // Nút Back của Android lúc đang làm bài: hỏi lại trước khi thoát.
  useEffect(() => {
    if (exam.phase !== 'test') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setConfirm('exit');
      return true;
    });
    return () => sub.remove();
  }, [exam.phase]);

  /** Cuộn tới câu `no` (đặt câu ở khoảng giữa màn). */
  function jump(no: number) {
    setNavOpen(false);
    const view = itemViews.current.get(no);
    const content = contentRef.current;
    if (!view || !content) return;
    view.measureLayout(content, (_x: number, y: number) => scrollRef.current?.scrollTo({ y: Math.max(0, y - 160), animated: true }));
  }

  const frame = (children: ReactNode) => (
    <View style={[styles.fill, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ headerShown: false, gestureEnabled: exam.phase !== 'test' }} />
      {children}
    </View>
  );

  if (error) {
    return frame(
      <View style={styles.center}>
        <AppText color="muted" center>
          Chưa tải được đề thi. Bạn thử lại sau nhé.
        </AppText>
        <AppText weight="600" color="primary" onPress={() => router.navigate('/thi-thu-hsk')}>
          Về danh sách đề
        </AppText>
      </View>,
    );
  }
  if (!paper) return frame(<Loading label="Đang mở đề thi…" />);

  if (exam.phase === 'intro') {
    return frame(<ExamIntro paper={paper} saved={exam.saved} onStart={exam.start} isGuest={!user} />);
  }

  if (exam.phase === 'result' && exam.result) {
    return frame(
      <ExamResult
        paper={paper}
        result={exam.result}
        answers={exam.answers}
        usedSec={exam.usedSec}
        pinyin={showPinyin}
        setPinyin={setPinyin}
        isGuest={!user}
        onRetry={() => exam.start(null)}
      />,
    );
  }

  const total = paper.questionCount;
  const lowTime = exam.remaining <= 5 * 60;
  // Tự nộp lúc hết giờ mà lỗi mạng: hộp nộp bài hiện ra để bấm lại.
  const dialog = confirm ?? (exam.submitError ? 'submit' : null);
  const closeDialog = () => {
    setConfirm(null);
    exam.clearSubmitError();
  };

  return frame(
    <>
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 10, borderColor: theme.border, backgroundColor: alpha(theme.surface, 0.95) },
        ]}>
        <Pressable
          onPress={() => setConfirm('exit')}
          accessibilityLabel="Thoát bài thi"
          style={({ pressed }) => [styles.exit, pressed && { backgroundColor: theme.surface2 }]}>
          <Icon name="back" size={18} color="muted" />
        </Pressable>
        <View style={styles.headCopy}>
          <AppText weight="700" numberOfLines={1}>
            {paper.title}
          </AppText>
          <AppText variant="caption" color="muted">
            Đã làm {exam.answered}/{total}
          </AppText>
        </View>
        <View
          accessibilityLabel="Thời gian còn lại"
          style={[
            styles.timer,
            lowTime
              ? { borderColor: alpha(theme.danger, 0.4), backgroundColor: alpha(theme.danger, 0.1) }
              : { borderColor: theme.border },
          ]}>
          <Icon name="clock" size={16} color={lowTime ? 'danger' : 'text'} />
          <AppText weight="700" color={lowTime ? 'danger' : 'text'} style={styles.timerText}>
            {mmss(exam.remaining)}
          </AppText>
        </View>
        <Button title="Nộp bài" onPress={() => setConfirm('submit')} style={styles.submit} />
      </View>

      <ScrollView ref={scrollRef} contentContainerStyle={{ paddingBottom: insets.bottom + 96 }}>
        <View ref={contentRef} style={styles.main}>
          <PaperView
            paper={paper}
            answers={exam.answers}
            pinyin={showPinyin}
            onAnswer={exam.setAnswer}
            flags={exam.flags}
            onFlag={exam.toggleFlag}
            itemRef={(no) => (view) => {
              if (view) itemViews.current.set(no, view);
              else itemViews.current.delete(no);
            }}
          />
          <View style={[styles.end, { borderColor: theme.border, backgroundColor: theme.surface }]}>
            <AppText color="muted" center>
              Đã làm {exam.answered}/{total} câu
              {exam.flags.length > 0 && ` · ${exam.flags.length} câu đánh dấu xem lại`}
            </AppText>
            <Button title="Nộp bài" icon="arrow" onPress={() => setConfirm('submit')} style={styles.endButton} />
          </View>
        </View>
      </ScrollView>

      {/* Điện thoại: bảng câu hỏi mở dạng tấm dưới đáy. */}
      <Pressable
        onPress={() => setNavOpen(true)}
        style={[
          styles.fab,
          { bottom: insets.bottom + 16, backgroundColor: theme.text, boxShadow: `0 10px 15px -3px ${alpha('#000000', 0.2)}` },
        ]}>
        <Icon name="menu" size={16} rawColor={theme.background} />
        <AppText weight="600" style={{ color: theme.background }}>
          Câu hỏi {exam.answered}/{total}
        </AppText>
      </Pressable>
      <NavigatorSheet open={navOpen} onClose={() => setNavOpen(false)}>
        <ExamNavigator paper={paper} answers={exam.answers} flags={exam.flags} onJump={jump} />
      </NavigatorSheet>

      <ExamDialog open={dialog !== null} onClose={closeDialog}>
        {dialog === 'submit' ? (
          <>
            <AppText weight="700" center style={styles.dialogTitle}>
              Nộp bài?
            </AppText>
            <AppText color="muted" center style={styles.dialogText}>
              {exam.answered < total
                ? `Bạn còn ${total - exam.answered} câu chưa làm — câu bỏ trống tính là sai.`
                : 'Bạn đã làm hết các câu.'}
            </AppText>
            {exam.submitError && (
              <AppText color="danger" center style={styles.dialogText}>
                Chưa nộp được — kiểm tra kết nối rồi thử lại. Bài làm vẫn được giữ trên máy.
              </AppText>
            )}
            <View style={styles.dialogActions}>
              <Button
                title={exam.busy ? 'Đang chấm điểm…' : 'Nộp bài và xem điểm'}
                disabled={exam.busy}
                onPress={async () => {
                  await exam.submit();
                  // Lỗi mạng thì hộp vẫn mở nhờ `submitError`.
                  setConfirm(null);
                }}
              />
              <Button title="Làm tiếp" variant="ghost" onPress={closeDialog} />
            </View>
          </>
        ) : (
          <>
            <AppText weight="700" center style={styles.dialogTitle}>
              Thoát bài thi?
            </AppText>
            <AppText color="muted" center style={styles.dialogText}>
              Bài làm được giữ tạm trên máy này — quay lại trong thời gian làm bài là làm tiếp được.
            </AppText>
            <View style={styles.dialogActions}>
              <Button title="Làm tiếp" onPress={closeDialog} />
              <Button
                title="Thoát"
                variant="ghost"
                onPress={() => {
                  stopListening();
                  setConfirm(null);
                  router.navigate('/thi-thu-hsk');
                }}
              />
            </View>
          </>
        )}
      </ExamDialog>
    </>,
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  exit: { height: 40, borderRadius: 12, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center' },
  headCopy: { flex: 1, minWidth: 0 },
  timer: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  timerText: { fontFamily: Fonts.mono, fontVariant: ['tabular-nums'] },
  submit: { minHeight: 40, paddingHorizontal: 16, paddingVertical: 6 },
  main: { paddingHorizontal: 16, paddingTop: 24, gap: 32 },
  end: { borderWidth: 1, borderRadius: 16, padding: 20, alignItems: 'center' },
  endButton: { marginTop: 12 },
  fab: {
    position: 'absolute',
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dialogTitle: { fontSize: 18, lineHeight: 28 },
  dialogText: { marginTop: 8 },
  dialogActions: { marginTop: 20, gap: 8 },
});
