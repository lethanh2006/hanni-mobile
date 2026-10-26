import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { mutate } from 'swr';

import { AppText, Chip, Icon, Loading, Screen, Skeleton } from '@/components/ui';
import { alpha } from '@/constants/theme';
import { ClassAssignmentsCard } from '@/features/home/class-assignments-card';
import { DailyQuests } from '@/features/home/daily-quests';
import { GettingStarted } from '@/features/home/getting-started';
import { GuestSaveCard, GuestTryCard } from '@/features/home/guest-cards';
import { NextLessonCard, NextLessonError, NextLessonSkeleton } from '@/features/home/next-lesson-card';
import { TodayCard } from '@/features/home/today-card';
import { TopicExplorer } from '@/features/home/topic-explorer';
import { WordOfTheDay } from '@/features/home/word-of-the-day';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { pendingLessonIds } from '@/lib/guest-progress';
import { useLearnPath } from '@/lib/hooks';
import { hskLabel } from '@/lib/hsk';
import type { LearnPath } from '@/lib/types';

const refreshLearn = () => mutate((key) => typeof key === 'string' && key.startsWith('/learn'));

/** Khách: bài đã học trong lần mở app này (chưa lưu) tính là xong, để "Học tiếp" đúng bài kế. */
function withGuestProgress(path: LearnPath, done: Set<string>): LearnPath {
  if (done.size === 0) return path;
  const lessons = path.lessons.map((l) => (done.has(l.id) ? { ...l, status: 'COMPLETED' as const } : l));
  return {
    ...path,
    lessons,
    completedLessons: lessons.filter((l) => l.status === 'COMPLETED').length,
    currentLessonId: lessons.find((l) => l.status !== 'COMPLETED')?.id ?? null,
  };
}

/**
 * Trang chủ — bố cục `/learn` của web ở khổ điện thoại: thẻ Học tiếp · thẻ chuỗi ngày (khách: thẻ mời lưu) ·
 * "Bắt đầu với Hanni" · bài tập lớp · lộ trình theo chủ đề (tab cấp HSK) · nhiệm vụ + từ vựng hôm nay.
 * Khách xem và học được, chỉ lưu tiến độ mới cần tài khoản.
 */
export default function HomeTab() {
  const theme = useTheme();
  const { user, loading } = useAuth();
  const [viewLevel, setViewLevel] = useState<number | undefined>();
  const [switching, setSwitching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const viewed = useLearnPath(viewLevel);
  const course = useLearnPath();
  const guestDone = new Set(user ? [] : pendingLessonIds());
  const path = viewed.data && !user ? withGuestProgress(viewed.data, guestDone) : viewed.data;

  // Khách không có "cấp đang học" — xem cấp nào là cấp đó.
  const courseLevel = user ? course.data?.level : undefined;
  const current = path?.lessons.find((l) => l.id === path.currentLessonId);
  const lessonHref = current ? (`/bai-hoc/${current.id}` as const) : ('/' as const);

  async function chooseLevel(level: number) {
    if (!user) {
      setViewLevel(level);
      return;
    }
    setSwitching(true);
    try {
      await api.patch('/users/me/settings', { courseLevel: level });
      setViewLevel(undefined);
      await refreshLearn();
    } finally {
      setSwitching(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await mutate(() => true);
    setRefreshing(false);
  }

  if (loading) {
    return (
      <Screen>
        <Loading />
      </Screen>
    );
  }

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh} contentStyle={styles.page}>
      <View style={styles.top}>
        {viewed.error ? (
          <NextLessonError onRetry={() => void viewed.mutate()} />
        ) : !path ? (
          <NextLessonSkeleton guest={!user} />
        ) : (
          <NextLessonCard
            path={path}
            isCourse={path.level === courseLevel}
            loggedIn={Boolean(user)}
            switching={switching}
            onChooseLevel={chooseLevel}
          />
        )}
        {user ? <TodayCard /> : <GuestSaveCard learned={guestDone.size} />}
      </View>

      {user && <GettingStarted lessonHref={lessonHref} />}
      {user && <ClassAssignmentsCard />}

      {/* Giữ chỗ cho lộ trình lúc đang tải — tải xong các thẻ dưới không bị đẩy xuống. */}
      {!path && !viewed.error && <Skeleton height={512} radius={16} />}

      {path && (
        <View style={styles.path}>
          <View>
            <AppText weight="800" style={styles.pathTitle}>
              Lộ trình bài học {hskLabel(path.level)}
            </AppText>
            <AppText color="muted">Học theo chủ đề — bài nào cũng mở, Hanni đánh dấu sẵn bài nên học tiếp.</AppText>
            <Pressable onPress={() => router.push('/kiem-tra-trinh-do')} style={styles.placement} hitSlop={6}>
              <AppText weight="600" color="primary" style={styles.flex}>
                Không chắc nên học cấp nào? Kiểm tra trình độ
              </AppText>
              <Icon name="arrow" size={14} color="primary" />
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.levels}>
            {path.levels.map((l) => {
              const selected = l === path.level;
              return (
                <Chip
                  key={l}
                  strong
                  label={hskLabel(l)}
                  active={selected}
                  onPress={() => setViewLevel(user && l === courseLevel ? undefined : l)}
                  trailing={
                    l === courseLevel && (
                      <View
                        style={[
                          styles.studying,
                          { backgroundColor: selected ? theme.primary : alpha(theme.primary, 0.1) },
                        ]}>
                        <AppText variant="caption" weight="700" color={selected ? 'primaryText' : 'primary'}>
                          ĐANG HỌC
                        </AppText>
                      </View>
                    )
                  }
                />
              );
            })}
          </ScrollView>
          <TopicExplorer key={path.level} lessons={path.lessons} currentLessonId={path.currentLessonId} />
        </View>
      )}

      {path && (
        <View style={styles.bottom}>
          {user ? <DailyQuests lessonHref={lessonHref} /> : <GuestTryCard />}
          <WordOfTheDay level={user ? courseLevel : path.level} />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { gap: 20 },
  top: { gap: 16 },
  flex: { flexShrink: 1 },
  path: { gap: 12 },
  pathTitle: { fontSize: 18, lineHeight: 28, letterSpacing: -0.45 },
  placement: { marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 4 },
  levels: { gap: 8, paddingBottom: 4 },
  studying: { borderRadius: 999, paddingHorizontal: 6, paddingVertical: 2 },
  bottom: { gap: 16 },
});
