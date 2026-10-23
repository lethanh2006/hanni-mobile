import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Card, Icon, ProgressBar, SectionTitle } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTodayQuests } from '@/lib/hooks';
import type { TodayQuests } from '@/lib/types';

/** Bấm nhiệm vụ là tới đúng chỗ làm; nhiệm vụ không có ở đây ("Học 5 từ mới") mở bài đang học. */
const QUEST_HREF: Record<string, Href> = {
  review_words: '/study',
  complete_quiz: '/study',
  listening_practice: '/luyen-tap',
  pronunciation_practice: '/luyen-tap',
};

function rewardText(data: TodayQuests) {
  if (!data.allDone) {
    return data.freezeCount >= data.maxFreeze
      ? 'Bạn đang có đủ lá chắn — dùng bớt rồi nhận thêm.'
      : 'Xong cả 3 → +1 lá chắn giữ chuỗi khi lỡ nghỉ 1 ngày.';
  }
  return data.justEarnedFreeze ? 'Xong cả 3 — bạn vừa nhận 1 lá chắn giữ chuỗi!' : 'Xong cả 3 nhiệm vụ hôm nay — giỏi lắm!';
}

/** 3 nhiệm vụ mỗi ngày; xong cả 3 thì server tự cấp 1 lá chắn giữ chuỗi. */
export function DailyQuests({ lessonHref }: { lessonHref: Href }) {
  const theme = useTheme();
  const { data } = useTodayQuests();
  if (!data) return null;
  const doneCount = data.quests.filter((q) => q.done).length;

  return (
    <Card>
      <SectionTitle
        title="Nhiệm vụ hôm nay"
        right={
          <AppText variant="caption" color="muted">
            {doneCount}/{data.quests.length} xong
          </AppText>
        }
      />
      {data.quests.map((quest) => (
        <Pressable
          key={quest.key}
          onPress={() => router.navigate(QUEST_HREF[quest.key] ?? lessonHref)}
          style={[styles.quest, { borderColor: theme.border }]}>
          <View
            style={[
              styles.check,
              quest.done ? { backgroundColor: theme.goodSoft } : { borderWidth: 2, borderColor: theme.border },
            ]}>
            {quest.done && <Icon name="check" size={14} color="good" />}
          </View>
          <View style={styles.flex}>
            <AppText variant="small" bold color={quest.done ? 'muted' : 'text'}>
              {quest.title}
            </AppText>
            <ProgressBar value={(quest.progress / quest.target) * 100} color={quest.done ? 'good' : 'primary'} />
          </View>
          <AppText variant="caption" color="muted">
            {quest.progress}/{quest.target}
          </AppText>
        </Pressable>
      ))}
      <View style={[styles.reward, { backgroundColor: data.allDone ? theme.goodSoft : theme.surface2 }]}>
        <Icon name="shield" size={15} color={data.allDone ? 'good' : 'muted'} />
        <AppText variant="caption" color={data.allDone ? 'good' : 'muted'} style={styles.flex}>
          {rewardText(data)}
        </AppText>
        <AppText variant="caption" bold color="muted">
          {data.freezeCount}/{data.maxFreeze}
        </AppText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, gap: 6 },
  quest: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  check: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  reward: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderRadius: Radius.md, padding: Spacing.md },
});
