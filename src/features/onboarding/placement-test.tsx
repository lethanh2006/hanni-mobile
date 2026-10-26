import { Image } from 'expo-image';
import { router, Stack } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Brand } from '@/components/app-shell/top-bar';
import { AppText, Button, Chip, Icon, IconTile, Screen, ShareButton } from '@/components/ui';
import { alpha } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api, WEB_ORIGIN } from '@/lib/api';
import { playWord } from '@/lib/audio';
import { useAuth } from '@/lib/auth';
import { savePendingCourseLevel } from '@/lib/guest-progress';
import { hskLabel } from '@/lib/hsk';
import type { PlacementTest as Test } from '@/lib/types';

import { AnswerFooter } from '../lesson/answer-footer';
import { SessionHeader } from '../lesson/session-header';
import { ChoiceStep } from '../lesson/steps';
import { startCourse } from './start-course';

interface LevelScore {
  level: number;
  correct: number;
  asked: number;
  passed: boolean;
}

/** "Tôi chưa biết từ này" — tính là sai nhưng không tô đỏ ô nào, chỉ hiện đáp án. */
const SKIPPED = -1;
const START_LEVELS = [1, 2, 3, 4, 5, 6];

/** Cấp nên học = cấp THẤP NHẤT chưa vững; vững hết thì cấp cao nhất đã hỏi. */
function recommendedLevel(scores: LevelScore[]) {
  const failed = scores.filter((s) => !s.passed).map((s) => s.level);
  if (failed.length) return Math.min(...failed);
  return Math.max(1, ...scores.map((s) => s.level));
}

/**
 * Kiểm tra trình độ đầu vào. Mỗi cấp tối đa 4 câu, đúng 3 là qua (đủ 3 thì bỏ câu cuối),
 * sai 2 là trượt. Bắt đầu từ cấp người học chọn: qua thì lên cấp, trượt ngay cấp
 * xuất phát thì xuống dần tới khi gặp cấp vững.
 */
export function PlacementTest() {
  const { user } = useAuth();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [phase, setPhase] = useState<'intro' | 'loading' | 'error' | 'test' | 'result'>('intro');
  const [test, setTest] = useState<Test | null>(null);
  const [levelIdx, setLevelIdx] = useState(0);
  const [qIdx, setQIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [tally, setTally] = useState({ correct: 0, wrong: 0 });
  const [scores, setScores] = useState<LevelScore[]>([]);
  const [startLevel, setStartLevel] = useState(1);
  const [goingDown, setGoingDown] = useState(false);

  const words = useMemo(() => new Map((test?.words ?? []).map((w) => [w.id, w])), [test]);
  const level = test?.levels[levelIdx];
  const step = level?.steps[qIdx];
  const word = step ? words.get(step.wordId) : undefined;

  async function start() {
    setPhase('loading');
    try {
      const t = await api.get<Test>('/learn/placement');
      const levels = t.levels.filter((l) => l.steps.length > 0);
      if (levels.length === 0) throw new Error('Đề trống');
      setTest({ ...t, levels });
      const from = levels.findIndex((l) => l.level >= startLevel);
      setLevelIdx(from === -1 ? levels.length - 1 : from);
      setGoingDown(false);
      setQIdx(0);
      setPicked(null);
      setTally({ correct: 0, wrong: 0 });
      setScores([]);
      setPhase('test');
    } catch {
      setPhase('error');
    }
  }

  function answer(i: number) {
    if (!step || picked !== null) return;
    setPicked(i);
    const ok = i === step.answer;
    if (ok && step.prompt !== 'audio') playWord(word?.audioUrl);
    setTally((t) => (ok ? { ...t, correct: t.correct + 1 } : { ...t, wrong: t.wrong + 1 }));
  }

  function next() {
    if (!test || !level) return;
    setPicked(null);
    const total = level.steps.length;
    const need = Math.min(test.passPerLevel, total);
    const asked = tally.correct + tally.wrong;
    const failed = tally.wrong > total - need;
    if (!failed && tally.correct < need && asked < total) {
      setQIdx(qIdx + 1);
      return;
    }
    const done = [...scores, { level: level.level, correct: tally.correct, asked, passed: !failed }];
    setScores(done);
    const goTo = (idx: number) => {
      setLevelIdx(idx);
      setQIdx(0);
      setTally({ correct: 0, wrong: 0 });
    };
    // Đi lên khi còn qua cấp; trượt ngay cấp xuất phát thì quay xuống.
    if (!goingDown && !failed && levelIdx + 1 < test.levels.length) return goTo(levelIdx + 1);
    if (failed && levelIdx > 0 && (goingDown || done.length === 1)) {
      setGoingDown(true);
      return goTo(levelIdx - 1);
    }
    if (!user) savePendingCourseLevel(recommendedLevel(done));
    setPhase('result');
  }

  // Như web: màn này không dùng thanh tiêu đề chung — giới thiệu có logo Hanni, làm bài có nút thoát + tiến độ.
  const header = <Stack.Screen options={{ title: 'Kiểm tra trình độ', headerShown: false }} />;

  if (phase === 'result') {
    return (
      <>
        {header}
        <Result scores={scores} isGuest={!user} onRetry={start} />
      </>
    );
  }

  if (phase === 'test' && test && level && step && word) {
    const correct = picked === null || picked === SKIPPED ? null : picked === step.answer;
    // Số cấp còn phải hỏi phụ thuộc câu trả lời — ước theo hướng đang đi, chặn 95%.
    const span = goingDown ? scores.length + levelIdx + 1 : scores.length + test.levels.length - levelIdx;
    const progress = Math.min(95, ((scores.length + qIdx / level.steps.length) / Math.max(1, span)) * 100);
    return (
      <View style={[styles.fill, { backgroundColor: theme.background, paddingTop: insets.top }]}>
        {header}
        <SessionHeader
          progress={progress}
          caption={`Kiểm tra trình độ · ${hskLabel(level.level)} · câu ${qIdx + 1}`}
          onClose={() => setPhase('intro')}
        />
        <ScrollView key={`${levelIdx}-${qIdx}`} contentContainerStyle={styles.body}>
          <ChoiceStep step={step} word={word} picked={picked} onPick={answer} />
          {picked === null && (
            <View style={styles.skip}>
              <AppText weight="600" color="muted" onPress={() => answer(SKIPPED)}>
                Tôi chưa biết từ này
              </AppText>
            </View>
          )}
        </ScrollView>
        {picked !== null && (
          <AnswerFooter correct={correct} word={word} skipped={picked === SKIPPED} onNext={next} />
        )}
      </View>
    );
  }

  return (
    <View style={[styles.fill, { backgroundColor: theme.background }]}>
      {header}
      <View style={[styles.brandBar, { paddingTop: insets.top + 12, borderColor: theme.border, backgroundColor: alpha(theme.surface, 0.95) }]}>
        <Pressable onPress={() => router.dismissTo('/')} accessibilityLabel="Về trang chủ Hanni" style={styles.self}>
          <Brand />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={[styles.intro, { paddingBottom: insets.bottom + 24 }]}>
        <IconTile icon="chart" style={styles.center} />
        <AppText variant="caption" weight="700" color="primary" center style={styles.eyebrow}>
          MIỄN PHÍ · KHÔNG CẦN ĐĂNG KÝ
        </AppText>
        <AppText weight="800" center style={styles.title}>
          Kiểm tra trình độ tiếng Trung
        </AppText>
        <AppText color="muted" center style={styles.lead}>
          Trả lời vài câu nghe – đọc bằng từ vựng HSK 3.0 thật. Đúng thì lên cấp, sai thì xuống cấp, đủ chắc là dừng và đề
          xuất cấp nên bắt đầu học — khoảng 2–5 phút.
        </AppText>
        <View style={[styles.startBox, { borderColor: theme.border, backgroundColor: theme.surface }]}>
          <AppText weight="600">Bắt đầu từ cấp</AppText>
          <AppText variant="caption" color="muted">
            Chỉ là điểm xuất phát — bài sẽ tự lên/xuống theo câu trả lời.
          </AppText>
          <View style={styles.levels} accessibilityRole="radiogroup" accessibilityLabel="Cấp bắt đầu">
            {START_LEVELS.map((l) => (
              <Chip
                key={l}
                label={`HSK ${l}`}
                active={startLevel === l}
                onPress={() => setStartLevel(l)}
                size="md"
                trailing={
                  l === 1 ? (
                    <AppText color={startLevel === l ? 'primary' : 'text'} style={styles.newbie}>
                      · mới học
                    </AppText>
                  ) : undefined
                }
              />
            ))}
          </View>
        </View>
        {phase === 'error' && (
          <AppText color="danger" center style={styles.error}>
            Chưa tải được đề kiểm tra. Bạn kiểm tra kết nối mạng rồi thử lại nhé.
          </AppText>
        )}
        <Button
          title={phase === 'loading' ? 'Đang chuẩn bị đề…' : 'Bắt đầu kiểm tra'}
          icon="arrow"
          disabled={phase === 'loading'}
          onPress={() => void start()}
          style={styles.startButton}
        />
        <View style={styles.rules}>
          {[
            { icon: 'target' as const, text: 'Mỗi cấp tối đa 4 câu — đúng 3 câu là qua cấp.' },
            { icon: 'sound' as const, text: 'Có câu nghe — nhớ bật âm thanh.' },
            { icon: 'spark' as const, text: 'Không biết thì bấm “Tôi chưa biết” — đoán bừa làm kết quả kém chính xác.' },
          ].map((r) => (
            <View key={r.text} style={[styles.rule, { backgroundColor: theme.surface2 }]}>
              <Icon name={r.icon} size={18} color="primary" />
              <AppText style={styles.fill}>{r.text}</AppText>
            </View>
          ))}
        </View>
        <AppText variant="caption" color="muted" center style={styles.newStart}>
          Chưa học tiếng Trung bao giờ?{' '}
          <AppText variant="caption" weight="600" color="primary" onPress={() => void startCourse(1, Boolean(user))}>
            Học bài 1 HSK1 luôn
          </AppText>
        </AppText>
      </ScrollView>
    </View>
  );
}

function Result({ scores, isGuest, onRetry }: { scores: LevelScore[]; isGuest: boolean; onRetry: () => void }) {
  const theme = useTheme();
  const [starting, setStarting] = useState(false);
  const failed = scores.find((s) => !s.passed);
  const level = recommendedLevel(scores);
  const passed = scores.filter((s) => s.passed);
  const byLevel = [...scores].sort((a, b) => a.level - b.level);

  const summary =
    passed.length === 0
      ? 'Học từ những từ cơ bản nhất là vừa sức nhất — mỗi bài 5–10 phút, nhiều từ đọc gần giống tiếng Việt nhờ âm Hán Việt.'
      : !failed
        ? 'Bạn nắm chắc từ vựng cả 6 cấp đầu — HSK 7–9 là chặng tiếp theo.'
        : `Bạn đã vững từ vựng tới ${hskLabel(level - 1)}. Học tiếp từ ${hskLabel(level)} để không phải học lại thứ đã biết.`;

  return (
    <Screen safeTop contentStyle={styles.result}>
      <Image source={require('@/assets/images/mascot.png')} style={styles.mascot} contentFit="contain" />
      <AppText variant="caption" weight="700" color="primary" center style={styles.resultEyebrow}>
        KẾT QUẢ KIỂM TRA TRÌNH ĐỘ
      </AppText>
      <AppText weight="800" center style={styles.title}>
        Bạn nên bắt đầu từ {hskLabel(level)}
      </AppText>
      <AppText color="muted" center style={styles.summary}>
        {summary}
      </AppText>

      <View style={styles.scores}>
        {byLevel.map((s) => (
          <View
            key={s.level}
            style={[
              styles.score,
              s.passed
                ? { borderColor: alpha(theme.good, 0.3), backgroundColor: alpha(theme.good, 0.05) }
                : { borderColor: alpha(theme.danger, 0.3), backgroundColor: alpha(theme.danger, 0.05) },
            ]}>
            <Icon name={s.passed ? 'check' : 'close'} size={18} color={s.passed ? 'good' : 'danger'} />
            <AppText weight="600" style={styles.scoreLevel}>
              {hskLabel(s.level)}
            </AppText>
            <AppText color="muted">
              đúng {s.correct}/{s.asked}
              {s.passed ? '' : ' — chưa vững'}
            </AppText>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <Button
          title={isGuest ? `Học bài 1 ${hskLabel(level)} ngay` : `Học ${hskLabel(level)}`}
          icon="arrow"
          loading={starting}
          onPress={() => {
            setStarting(true);
            void startCourse(level, !isGuest);
          }}
        />
        {isGuest && (
          <Button title="Tạo tài khoản để lưu lộ trình" variant="secondary" onPress={() => router.replace('/register')} />
        )}
        <AppText variant="caption" color="muted" center>
          Kết quả ước lượng từ {scores.reduce((n, s) => n + s.asked, 0)} câu — bạn đổi cấp được bất cứ lúc nào ở Trang
          chủ.{' '}
          <AppText variant="caption" weight="600" color="primary" onPress={onRetry}>
            Làm lại
          </AppText>
        </AppText>
      </View>
      <ShareButton
        message={`Mình vừa kiểm tra trình độ tiếng Trung trên Hanni: nên học ${hskLabel(level)}. Bạn ở cấp nào? Làm thử 3 phút, miễn phí: ${WEB_ORIGIN}/kiem-tra-trinh-do`}
        style={styles.share}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  self: { alignSelf: 'flex-start' },
  center: { alignSelf: 'center' },
  body: { paddingHorizontal: 16, paddingTop: 32, paddingBottom: 160 },
  skip: { alignItems: 'center', marginTop: 24 },
  brandBar: { borderBottomWidth: 1, paddingHorizontal: 16, paddingBottom: 12 },
  intro: { paddingHorizontal: 16, paddingTop: 24 },
  eyebrow: { marginTop: 16, letterSpacing: 0.6 },
  title: { marginTop: 6, fontSize: 24, lineHeight: 32, letterSpacing: -0.6 },
  lead: { marginTop: 12, lineHeight: 24 },
  startBox: { marginTop: 24, borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12 },
  levels: { marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  newbie: { fontWeight: '400', opacity: 0.8 },
  error: { marginTop: 20 },
  startButton: { marginTop: 20 },
  rules: { marginTop: 24, gap: 8 },
  rule: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12 },
  newStart: { marginTop: 20 },
  result: { alignItems: 'center', gap: 0, paddingTop: 40 },
  mascot: { width: 152, height: 128 },
  resultEyebrow: { marginTop: 20, letterSpacing: 0.6 },
  summary: { marginTop: 8 },
  scores: { marginTop: 24, alignSelf: 'stretch', gap: 8 },
  score: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  scoreLevel: { flex: 1 },
  actions: { marginTop: 32, alignSelf: 'stretch', gap: 12 },
  share: { marginTop: 24, alignSelf: 'center' },
});
