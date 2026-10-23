import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, ErrorNote, ProgressBar } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { savePendingOnboarding } from '@/lib/guest-progress';
import { previewOnboarding, submitOnboarding } from '@/lib/hooks';
import type { OnboardingGoal, OnboardingPlan, SubmitOnboardingInput } from '@/lib/types';

import { ChoiceCard, OptionGrid, QuestionHeading } from './choice';
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
    <View style={styles.wizard}>
      <View style={styles.progress}>
        <AppText variant="small" bold>
          Câu {step} / 3 · {step === 3 ? 'Câu cuối' : `Còn ${3 - step} câu`}
        </AppText>
        <ProgressBar value={(step / 3) * 100} />
      </View>
      {error && <ErrorNote>{error}</ErrorNote>}

      {step === 1 && (
        <>
          <QuestionHeading
            eyebrow="Để chọn bài bắt đầu"
            title="Bạn biết tiếng Trung tới đâu?"
            description="Không lặp lại thứ bạn đã biết, cũng không nhảy quá xa."
          />
          <ChoiceCard
            icon="spark"
            title="Chưa biết gì"
            description="Bắt đầu từ bài 1 HSK 1 — không cần biết trước chữ Hán"
            active={levelChoice === 'new'}
            onPress={() => setLevelChoice('new')}
          />
          <ChoiceCard
            icon="chart"
            title="Biết một chút, chưa chắc cấp nào"
            description="Cuối khảo sát làm bài kiểm tra khoảng 3 phút để xếp đúng cấp"
            active={levelChoice === 'unsure'}
            onPress={() => setLevelChoice('unsure')}
          />
          <ChoiceCard
            icon="book"
            title="Đang học một cấp HSK"
            description="Chọn cấp bạn đang học, học dở cũng được"
            active={levelChoice === 'studied'}
            onPress={() => setLevelChoice('studied')}
          />
          {levelChoice === 'studied' && (
            <>
              <AppText bold>Bạn đang học cấp nào?</AppText>
              <OptionGrid options={LEVELS} value={selfLevel} onChange={setSelfLevel} />
            </>
          )}
          <Button title="Tiếp tục" icon="arrow" disabled={!step1Ready} onPress={() => setStep(2)} />
        </>
      )}

      {step === 2 && (
        <>
          <QuestionHeading
            eyebrow="Để gợi ý cách luyện hợp với bạn"
            title="Bạn học tiếng Trung để làm gì?"
            description="Nếu định thi HSK, Hanni tính số bài còn lại tới cấp thi và chia theo ngày thi."
          />
          {GOALS.map((g) => (
            <ChoiceCard
              key={g.key}
              icon={g.icon}
              title={g.label}
              description={g.hint}
              active={goal === g.key}
              onPress={() => setGoal(g.key)}
            />
          ))}
          {goal === 'EXAM' && (
            <>
              <AppText bold>Bạn định thi cấp nào?</AppText>
              <OptionGrid options={LEVELS} value={targetLevel} onChange={setTargetLevel} />
              <AppText bold>Bao lâu nữa thì thi? (không bắt buộc)</AppText>
              <OptionGrid options={EXAM_WINDOWS} value={examWindow} onChange={setExamWindow} />
            </>
          )}
          <View style={styles.row}>
            <Button title="Quay lại" variant="secondary" onPress={() => setStep(1)} style={styles.flex} />
            <Button title="Tiếp tục" disabled={!step2Ready} onPress={() => setStep(3)} style={styles.flex} />
          </View>
        </>
      )}

      {step === 3 && (
        <>
          <QuestionHeading
            eyebrow="Để đặt mục tiêu mỗi ngày"
            title="Mỗi ngày bạn học được bao lâu?"
            description="Hanni tính cả học bài mới, ôn thẻ và làm đề. Đổi lại được trong Cài đặt."
          />
          <OptionGrid options={DAILY_MINUTES} value={dailyMinutes} onChange={setDailyMinutes} />
          <View style={styles.row}>
            <Button title="Quay lại" variant="secondary" onPress={() => setStep(2)} style={styles.flex} />
            <Button
              title={busy ? 'Đang tính…' : 'Xem lộ trình'}
              loading={busy}
              disabled={dailyMinutes === null}
              onPress={submit}
              style={styles.flex}
            />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wizard: { gap: Spacing.lg },
  progress: { gap: Spacing.sm },
  row: { flexDirection: 'row', gap: Spacing.md },
  flex: { flex: 1 },
});
