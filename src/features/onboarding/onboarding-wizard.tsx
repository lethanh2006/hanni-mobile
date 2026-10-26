import { useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, ErrorNote } from '@/components/ui';
import { alpha, mix } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { savePendingOnboarding } from '@/lib/guest-progress';
import { previewOnboarding, submitOnboarding } from '@/lib/hooks';
import type { OnboardingGoal, OnboardingPlan, SubmitOnboardingInput } from '@/lib/types';

import { ChoiceCard, GoalCard, OptionGrid, QuestionHeading, SubQuestion } from './choice';
import { DAILY_MINUTES, EXAM_WINDOWS, GOALS, LEVELS } from './options';

/** Đủ để vẽ màn kết quả — cả hồ sơ đã lưu lẫn kết quả tính thử của khách. */
export interface ResultData {
  recommendedLevel: number;
  recommendationVi: string;
  goal: OnboardingGoal;
  plan?: OnboardingPlan;
}

type LevelChoice = 'new' | 'unsure' | 'studied';

/**
 * Khảo sát 3 câu. Mỗi câu có tác dụng thật và hiện thành 1 dòng ở màn kết quả:
 * trình độ → bài bắt đầu; mục tiêu → lộ trình thi hoặc cách luyện; thời gian → mục tiêu ngày.
 * Khách chỉ được TÍNH THỬ (không lưu); câu trả lời giữ lại để đăng ký xong tự nộp.
 */
export function OnboardingWizard({
  loggedIn,
  onResult,
}: {
  loggedIn: boolean;
  onResult: (data: ResultData) => void;
}) {
  const theme = useTheme();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [levelChoice, setLevelChoice] = useState<LevelChoice | null>(null);
  const [selfLevel, setSelfLevel] = useState<number | null>(null);
  const [goal, setGoal] = useState<OnboardingGoal | null>(null);
  const [targetLevel, setTargetLevel] = useState<number | null>(null);
  const [examWindow, setExamWindow] = useState<number | null>(null);
  const [dailyMinutes, setDailyMinutes] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const step1Ready = levelChoice === 'new' || levelChoice === 'unsure' || (levelChoice === 'studied' && !!selfLevel);
  const step2Ready = goal !== null && (goal !== 'EXAM' || targetLevel !== null);

  async function submit() {
    if (!levelChoice || !goal || dailyMinutes === null) return;
    const plansToTakeExam = goal === 'EXAM';
    let targetDate: string | undefined;
    if (plansToTakeExam && examWindow) {
      const d = new Date();
      d.setMonth(d.getMonth() + examWindow);
      targetDate = d.toISOString().slice(0, 10);
    }
    const input: SubmitOnboardingInput = {
      hasStudiedBefore: levelChoice !== 'new',
      selfAssessedLevel: levelChoice === 'studied' ? (selfLevel ?? undefined) : undefined,
      goal,
      plansToTakeExam,
      targetLevel: plansToTakeExam ? (targetLevel ?? undefined) : undefined,
      targetDate,
      dailyMinutes,
    };
    setBusy(true);
    setError(null);
    try {
      if (loggedIn) {
        onResult(await submitOnboarding(input));
      } else {
        const preview = await previewOnboarding(input);
        savePendingOnboarding(input);
        onResult({ ...preview, goal });
      }
    } catch {
      setError('Chưa tính được lộ trình. Bạn thử lại nhé.');
      setBusy(false);
    }
  }

  return (
    <View style={[styles.card, { borderColor: theme.border, backgroundColor: theme.surface, boxShadow: `0 24px 55px -42px ${alpha(theme.text, 0.34)}` }]}>
      <AppText variant="caption" color="muted" style={styles.purpose}>
        3 câu hỏi để Hanni chọn bài bắt đầu, lộ trình thi và mục tiêu mỗi ngày{loggedIn ? '.' : ' — chưa cần tài khoản.'}
      </AppText>
      <View style={styles.progress}>
        <View style={styles.progressMeta}>
          <AppText weight="700" color="primary" style={styles.progressLabel}>
            CÂU {step} / 3
          </AppText>
          <AppText variant="caption" color="muted">
            {step === 3 ? 'Câu cuối' : `Còn ${3 - step} câu`}
          </AppText>
        </View>
        <View style={[styles.track, { backgroundColor: theme.surface2 }]}>
          <View
            style={[
              styles.fill,
              {
                width: `${Math.round((step / 3) * 100)}%`,
                backgroundImage: `linear-gradient(90deg, ${theme.primary}, ${mix(theme.primary, theme.accent, 0.65)})`,
              },
            ]}
          />
        </View>
      </View>
      {error && (
        <View style={styles.error}>
          <ErrorNote>{error}</ErrorNote>
        </View>
      )}

      {step === 1 && (
        <>
          <QuestionHeading
            icon="book"
            eyebrow="Để chọn bài bắt đầu"
            title="Bạn biết tiếng Trung tới đâu?"
            description="Không lặp lại thứ bạn đã biết, cũng không nhảy quá xa."
          />
          <View style={styles.list}>
            <ChoiceCard
              icon="spark"
              title="Chưa biết gì"
              description="Bắt đầu từ bài 1 HSK 1 — không cần biết trước chữ Hán"
              active={levelChoice === 'new'}
              onPress={() => {
                setLevelChoice('new');
                setSelfLevel(null);
              }}
            />
            <ChoiceCard
              icon="chart"
              title="Biết một chút, chưa chắc cấp nào"
              description="Cuối khảo sát làm bài kiểm tra khoảng 3 phút để xếp đúng cấp"
              active={levelChoice === 'unsure'}
              onPress={() => {
                setLevelChoice('unsure');
                setSelfLevel(null);
              }}
            />
            <ChoiceCard
              icon="book"
              title="Đang học một cấp HSK"
              description="Chọn cấp bạn đang học, học dở cũng được"
              active={levelChoice === 'studied'}
              onPress={() => setLevelChoice('studied')}
            />
          </View>
          {levelChoice === 'studied' && (
            <>
              <SubQuestion>Bạn đang học cấp nào?</SubQuestion>
              <OptionGrid options={LEVELS} value={selfLevel} onChange={setSelfLevel} />
            </>
          )}
          <Footer>
            <NextButton title="Tiếp tục" disabled={!step1Ready} onPress={() => setStep(2)} />
          </Footer>
        </>
      )}

      {step === 2 && (
        <>
          <QuestionHeading
            icon="target"
            eyebrow="Để gợi ý cách luyện hợp với bạn"
            title="Bạn học tiếng Trung để làm gì?"
            description="Nếu định thi HSK, Hanni tính số bài còn lại tới cấp thi và chia theo ngày thi."
          />
          <View style={styles.list}>
            {GOALS.map((g) => (
              <GoalCard
                key={g.key}
                icon={g.icon}
                label={g.label}
                hint={g.hint}
                active={goal === g.key}
                onPress={() => {
                  setGoal(g.key);
                  if (g.key !== 'EXAM') {
                    setTargetLevel(null);
                    setExamWindow(null);
                  }
                }}
              />
            ))}
          </View>
          {goal === 'EXAM' && (
            <>
              <SubQuestion>Bạn định thi cấp nào?</SubQuestion>
              <OptionGrid options={LEVELS} value={targetLevel} onChange={setTargetLevel} />
              <SubQuestion>Bao lâu nữa thì thi? (không bắt buộc)</SubQuestion>
              <OptionGrid options={EXAM_WINDOWS} value={examWindow} onChange={setExamWindow} />
            </>
          )}
          <Footer>
            <Button title="Quay lại" leftIcon="back" variant="secondary" onPress={() => setStep(1)} />
            <NextButton title="Tiếp tục" disabled={!step2Ready} onPress={() => setStep(3)} />
          </Footer>
        </>
      )}

      {step === 3 && (
        <>
          <QuestionHeading
            icon="clock"
            eyebrow="Để đặt mục tiêu mỗi ngày"
            title="Mỗi ngày bạn học được bao lâu?"
            description="Hanni tính cả học bài mới, ôn thẻ và làm đề, rồi nhắc bạn giữ chuỗi ngày học. Đổi lại được trong Cài đặt."
          />
          <OptionGrid options={DAILY_MINUTES} value={dailyMinutes} onChange={setDailyMinutes} />
          <Footer>
            <Button title="Quay lại" leftIcon="back" variant="secondary" onPress={() => setStep(2)} />
            <NextButton
              title={busy ? 'Đang tính…' : 'Xem lộ trình'}
              disabled={dailyMinutes === null || busy}
              onPress={() => void submit()}
            />
          </Footer>
        </>
      )}
    </View>
  );
}

/** Chân câu hỏi: vạch ngăn trên, các nút xếp dọc full bề ngang (điện thoại). */
function Footer({ children }: { children: ReactNode }) {
  const theme = useTheme();
  return <View style={[styles.footer, { borderColor: theme.border }]}>{children}</View>;
}

function NextButton({ title, disabled, onPress }: { title: string; disabled: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Button
      title={title}
      icon="arrow"
      disabled={disabled}
      onPress={onPress}
      style={[styles.next, { boxShadow: `0 10px 20px -14px ${alpha(theme.primary, 0.75)}` }]}
    />
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 22, padding: 20 },
  purpose: { marginBottom: 16, lineHeight: 19 },
  progress: { marginBottom: 30 },
  progressMeta: { marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  progressLabel: { fontSize: 12, lineHeight: 16, letterSpacing: 1 },
  track: { height: 6, borderRadius: 999, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 999 },
  error: { marginBottom: 18 },
  list: { gap: 10 },
  footer: { marginTop: 30, paddingTop: 20, borderTopWidth: 1, gap: 12 },
  next: { borderRadius: 13 },
});
