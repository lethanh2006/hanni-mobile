import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, Card, Icon, TextLink, type IconName } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { hskLabel } from '@/lib/hsk';

import type { ResultData } from './onboarding-wizard';
import { GOAL_SUGGESTION, GOALS } from './options';
import { startCourse } from './start-course';

function PlanRow({
  icon,
  title,
  detail,
  link,
}: {
  icon: IconName;
  title: string;
  detail: string;
  link?: { href: Href; label: string };
}) {
  return (
    <View style={styles.planRow}>
      <Icon name={icon} size={20} color="primary" />
      <View style={styles.flex}>
        <AppText bold>{title}</AppText>
        <AppText variant="small" color="muted">
          {detail}
        </AppText>
        {link && <TextLink title={`${link.label} →`} onPress={() => router.push(link.href)} />}
      </View>
    </View>
  );
}

function examDetail(plan: NonNullable<ResultData['plan']>) {
  const exam = plan.exam;
  if (!exam) return '';
  if (exam.lessons === null) return 'Làm bài kiểm tra xong, Hanni biết bạn còn bao nhiêu bài tới cấp thi.';
  if (exam.lessons === 0) return 'Bạn đã học tới cấp này — làm đề thi thử để quen dạng bài và thời gian.';
  const start = plan.startLevel ?? 1;
  const span =
    start === Math.min(exam.level, 7)
      ? `Cả ${hskLabel(exam.level)}`
      : `Từ ${hskLabel(start)} tới hết ${hskLabel(exam.level)}`;
  let text = `${span}: ${exam.lessons} bài (~${(exam.words ?? 0).toLocaleString('vi-VN')} từ)`;
  if (exam.weeksLeft) text += ` — khoảng ${Math.ceil(exam.lessons / exam.weeksLeft)} bài mỗi tuần`;
  return `${text}.`;
}

/** Màn kết quả khảo sát. `guest` = kết quả tính thử, chưa lưu (chưa có tài khoản). */
export function OnboardingResult({ data, guest, onRedo }: { data: ResultData; guest: boolean; onRedo: () => void }) {
  const [starting, setStarting] = useState(false);
  const plan = data.plan;
  const start = plan ? plan.startLevel : data.recommendedLevel;
  const goal = GOALS.find((g) => g.key === data.goal) ?? GOALS[GOALS.length - 1];
  const suggestion = data.goal !== 'EXAM' ? GOAL_SUGGESTION[data.goal] : null;

  function begin() {
    if (!start) {
      router.push('/kiem-tra-trinh-do');
      return;
    }
    setStarting(true);
    void startCourse(start, !guest);
  }

  return (
    <View style={styles.wrap}>
      <AppText variant="title">
        {start ? 'Lộ trình của bạn đã sẵn sàng' : 'Còn 1 bước: kiểm tra trình độ'}
      </AppText>
      <Card>
        {plan ? (
          <>
            {start ? (
              <PlanRow
                icon="target"
                title={`Bắt đầu từ ${hskLabel(start)}`}
                detail={
                  plan.firstLesson
                    ? `Bài đầu tiên: ${plan.firstLesson.title}. Không khoá bài nào — muốn học chủ đề khác cứ chọn.`
                    : 'Không khoá bài nào — muốn học chủ đề khác cứ chọn.'
                }
              />
            ) : (
              <PlanRow
                icon="target"
                title="Cấp bắt đầu: xếp sau bài kiểm tra"
                detail="Khoảng 3 phút, đúng thì lên cấp, sai thì dừng — bạn được xếp vào cấp thấp nhất chưa vững."
              />
            )}
            {plan.exam ? (
              <PlanRow
                icon="trophy"
                title={`Thi ${hskLabel(plan.exam.level)}${plan.exam.weeksLeft ? ` · còn ${plan.exam.weeksLeft} tuần` : ''}`}
                detail={examDetail(plan)}
                link={{ href: '/thi-thu-hsk', label: 'Làm thử đề thi' }}
              />
            ) : (
              <PlanRow
                icon={goal.icon}
                title={`Mục tiêu: ${goal.label}`}
                detail={suggestion ? `Nên thử thêm: ${suggestion.label} — ${suggestion.detail}.` : goal.hint}
                link={suggestion ? { href: suggestion.href, label: suggestion.label } : undefined}
              />
            )}
            {plan.dailyMinutes && (
              <PlanRow
                icon="clock"
                title={`Mỗi ngày ${plan.dailyMinutes} phút`}
                detail={
                  guest
                    ? 'Thành mục tiêu ngày khi bạn lưu tiến độ — tính cả học bài, ôn thẻ và làm đề.'
                    : 'Đã đặt làm mục tiêu ngày. Đổi lại trong Cài đặt.'
                }
              />
            )}
          </>
        ) : (
          // Server cũ (trước khi có `plan`) — vẫn hiện được đề xuất dạng chữ.
          <AppText>{data.recommendationVi}</AppText>
        )}
      </Card>
      <Button
        title={start ? (guest ? 'Vào bài 1' : `Vào học ${hskLabel(start)}`) : 'Làm bài kiểm tra trình độ'}
        icon="arrow"
        loading={starting}
        onPress={begin}
      />
      <Button title="Làm lại khảo sát" variant="ghost" onPress={onRedo} />
      <AppText variant="caption" color="muted" center>
        {guest
          ? 'Chưa cần tài khoản — học xong bài 1, Hanni mới mời bạn lưu tiến độ.'
          : 'Đã lưu vào tài khoản của bạn.'}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.lg },
  flex: { flex: 1, gap: 2 },
  planRow: { flexDirection: 'row', gap: Spacing.md, paddingVertical: Spacing.sm },
});
