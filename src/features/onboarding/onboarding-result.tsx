import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Button, Icon, type IconName } from '@/components/ui';
import { alpha, mix } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
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
  const theme = useTheme();
  return (
    <View style={[styles.planRow, { borderColor: theme.border, backgroundColor: theme.surface }]}>
      <View style={[styles.planIcon, { backgroundColor: mix(theme.primary, theme.surface, 0.09) }]}>
        <Icon name={icon} size={18} color="primary" />
      </View>
      <View style={styles.flex}>
        <AppText weight="700">{title}</AppText>
        <AppText variant="caption" color="muted" style={styles.planDetail}>
          {detail}
        </AppText>
        {link && (
          <Pressable onPress={() => router.push(link.href)} style={styles.planLink} hitSlop={4}>
            <AppText variant="caption" weight="700" color="primary">
              {link.label}
            </AppText>
            <Icon name="arrow" size={13} color="primary" />
          </Pressable>
        )}
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
  const theme = useTheme();
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
    <View
      style={[
        styles.card,
        { borderColor: theme.border, backgroundColor: theme.surface, boxShadow: `0 24px 55px -42px ${alpha(theme.text, 0.34)}` },
      ]}>
      {plan && (
        <View
          style={[
            styles.resultIcon,
            {
              borderColor: mix(theme.good, theme.border, 0.22),
              backgroundColor: mix(theme.good, theme.surface, 0.1),
              boxShadow: `0 12px 24px -18px ${alpha(theme.good, 0.7)}`,
            },
          ]}>
          <Icon name={start ? 'check' : 'chart'} size={28} color="good" />
        </View>
      )}
      <AppText weight="800" center style={styles.title}>
        {!plan ? (
          <>
            Bắt đầu từ{' '}
            <AppText weight="800" color="primary" style={styles.title}>
              {hskLabel(data.recommendedLevel)}
            </AppText>
          </>
        ) : start ? (
          'Lộ trình của bạn đã sẵn sàng'
        ) : (
          'Còn 1 bước: kiểm tra trình độ'
        )}
      </AppText>
      {plan ? (
        <View style={styles.plan}>
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
              link={
                // Đề thi thử hiện có HSK 1–4 (khách làm được).
                plan.exam.level <= 4
                  ? { href: `/thi-thu-hsk/hsk${plan.exam.level}-de-1`, label: `Làm thử đề HSK ${plan.exam.level}` }
                  : undefined
              }
            />
          ) : (
            <PlanRow
              icon={goal.icon}
              title={`Mục tiêu: ${goal.label}`}
              detail={suggestion ? `Nên thử thêm: ${suggestion.label} — ${suggestion.detail}.` : goal.hint}
              link={suggestion && (!guest || suggestion.guest) ? { href: suggestion.href, label: suggestion.label } : undefined}
            />
          )}
          {plan.dailyMinutes && (
            <PlanRow
              icon="clock"
              title={`Mỗi ngày ${plan.dailyMinutes} phút`}
              detail={
                guest
                  ? 'Thành mục tiêu ngày khi bạn lưu tiến độ — tính cả học bài, ôn thẻ và làm đề.'
                  : 'Đã đặt làm mục tiêu ngày — tính cả học bài, ôn thẻ và làm đề. Đổi lại trong Cài đặt.'
              }
            />
          )}
        </View>
      ) : (
        // Server cũ (trước khi có `plan`) — vẫn hiện được đề xuất dạng chữ.
        <View
          style={[
            styles.recommendation,
            { borderColor: mix(theme.primary, theme.border, 0.15), backgroundColor: mix(theme.primary, theme.surface, 0.04) },
          ]}>
          <AppText style={styles.recommendationText}>{data.recommendationVi}</AppText>
        </View>
      )}
      <View style={styles.actions}>
        <Button
          title={start ? (guest ? 'Vào bài 1' : `Vào học ${hskLabel(start)}`) : 'Làm bài kiểm tra trình độ'}
          icon="arrow"
          loading={starting}
          onPress={begin}
        />
        <Button title="Làm lại khảo sát" variant="ghost" onPress={onRedo} />
      </View>
      <AppText variant="caption" color="muted" center style={styles.note}>
        {guest
          ? 'Chưa cần tài khoản — học xong bài 1, Hanni mới mời bạn lưu tiến độ.'
          : 'Đã lưu vào tài khoản của bạn.'}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 22, padding: 24 },
  resultIcon: {
    alignSelf: 'center',
    width: 58,
    height: 58,
    marginBottom: 20,
    borderWidth: 1,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 27, lineHeight: 34, letterSpacing: -1.5 },
  plan: { marginTop: 24, gap: 10 },
  planRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 13, borderWidth: 1, borderRadius: 16, paddingHorizontal: 15, paddingVertical: 14 },
  planIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1, minWidth: 0 },
  planDetail: { marginTop: 3, lineHeight: 19 },
  planLink: { marginTop: 7, flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' },
  recommendation: { marginTop: 25, borderWidth: 1, borderRadius: 16, paddingHorizontal: 18, paddingVertical: 17 },
  recommendationText: { fontSize: 13, lineHeight: 23 },
  actions: { marginTop: 25, gap: 10 },
  note: { marginTop: 14 },
});
