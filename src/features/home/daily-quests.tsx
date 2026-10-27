import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Card, Icon, ProgressBar, Skeleton } from '@/components/ui';
import { alpha } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTodayQuests } from '@/lib/hooks';
import type { TodayQuests } from '@/lib/types';

/** Bấm nhiệm vụ là tới đúng chỗ làm; nhiệm vụ không có ở đây ("Học 5 từ mới") mở bài đang học. */
const QUEST_HREF: Record<string, Href> = {
  review_words: '/study',
  complete_quiz: '/study',
  listening_practice: '/listening',
  pronunciation_practice: '/pronunciation',
};

/** Thẻ "Nhiệm vụ hôm nay" (`DailyQuestCard` của web): 3 nhiệm vụ mỗi ngày, xong cả 3 thì server tự cấp 1 lá chắn. */
export function DailyQuests({ lessonHref }: { lessonHref: Href }) {
  const theme = useTheme();
  const { data } = useTodayQuests();
  const doneCount = data?.quests.filter((q) => q.done).length ?? 0;

  return (
    <Card style={styles.card}>
      <View style={styles.head}>
        <View style={styles.title}>
          <Icon name="target" size={18} color="primary" />
          <AppText weight="600">Nhiệm vụ hôm nay</AppText>
        </View>
        {data && (
          <AppText variant="caption" color="muted">
            {doneCount}/{data.quests.length} xong
          </AppText>
        )}
      </View>

      {!data ? (
        <View style={styles.loading}>
          <Skeleton width="75%" height={16} radius={6} />
          <Skeleton height={8} radius={999} />
        </View>
      ) : (
        <View style={styles.list}>
          {data.quests.map((quest) => (
            <Pressable
              key={quest.key}
              onPress={() => router.navigate(QUEST_HREF[quest.key] ?? lessonHref)}
              style={({ pressed }) => [
                styles.quest,
                pressed
                  ? { borderColor: alpha(theme.primary, 0.3), backgroundColor: alpha(theme.primary, 0.05) }
                  : { borderColor: theme.border },
              ]}>
              <View
                style={[
                  styles.check,
                  quest.done
                    ? { backgroundColor: alpha(theme.good, 0.15) }
                    : { borderWidth: 2, borderColor: theme.border },
                ]}>
                {quest.done && <Icon name="check" size={14} color="good" />}
              </View>
              <View style={styles.questBody}>
                <AppText
                  weight="500"
                  color={quest.done ? 'muted' : 'text'}
                  style={quest.done && { textDecorationLine: 'line-through' }}>
                  {quest.title}
                </AppText>
                <ProgressBar value={(quest.progress / quest.target) * 100} color={quest.done ? 'good' : 'primary'} />
              </View>
              <AppText variant="caption" weight="600" color="muted" style={styles.tabular}>
                {quest.progress}/{quest.target}
              </AppText>
            </Pressable>
          ))}
        </View>
      )}

      {data && <QuestReward data={data} />}
    </Card>
  );
}

function QuestReward({ data }: { data: TodayQuests }) {
  const theme = useTheme();
  const full = data.freezeCount >= data.maxFreeze;
  const text = !data.allDone
    ? full
      ? 'Bạn đang có đủ lá chắn — dùng bớt rồi nhận thêm.'
      : 'Xong cả 3 → +1 lá chắn giữ chuỗi khi lỡ nghỉ 1 ngày.'
    : data.justEarnedFreeze
      ? 'Xong cả 3 — bạn vừa nhận 1 lá chắn giữ chuỗi!'
      : 'Xong cả 3 nhiệm vụ hôm nay — giỏi lắm!';
  const color = data.allDone ? 'good' : 'muted';
  return (
    <View style={[styles.reward, { backgroundColor: data.allDone ? alpha(theme.good, 0.1) : theme.surface2 }]}>
      <Icon name="shield" size={15} color={color} />
      <AppText variant="caption" weight="500" color={color} style={styles.rewardText}>
        {text}
      </AppText>
      <AppText variant="caption" weight="600" color={color}>
        {data.freezeCount}/{data.maxFreeze}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: 16 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  title: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  loading: { gap: 12, paddingVertical: 8 },
  list: { gap: 8 },
  quest: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  check: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  questBody: { flex: 1, minWidth: 0, gap: 6 },
  tabular: { fontVariant: ['tabular-nums'] },
  reward: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  rewardText: { flex: 1 },
});
