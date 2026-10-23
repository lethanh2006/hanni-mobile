import { router } from 'expo-router';
import { useState } from 'react';
import { mutate } from 'swr';

import { Button, ChipRow, ErrorNote, Loading, Screen, SectionTitle, TextLink } from '@/components/ui';
import { DailyQuests } from '@/features/home/daily-quests';
import { GuestSaveCard, GuestTryCard } from '@/features/home/guest-cards';
import { HomeHeader } from '@/features/home/home-header';
import { NextLessonCard } from '@/features/home/next-lesson-card';
import { TodayCard } from '@/features/home/today-card';
import { TopicExplorer } from '@/features/home/topic-explorer';
import { WordOfTheDay } from '@/features/home/word-of-the-day';
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
 * Trang chủ — MỘT lộ trình, MỘT nút "Học tiếp"; chuỗi ngày + từ cần ôn; lộ trình theo chủ đề;
 * nhiệm vụ và từ vựng hôm nay. Khách xem và học được, chỉ lưu tiến độ mới cần tài khoản.
 */
export default function HomeTab() {
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
      <Screen safeTop>
        <Loading />
      </Screen>
    );
  }

  return (
    <Screen safeTop refreshing={refreshing} onRefresh={onRefresh}>
      <HomeHeader />

      {viewed.error ? (
        <>
          <ErrorNote>Chưa tải được lộ trình. Vui lòng thử lại.</ErrorNote>
          <Button title="Tải lại" variant="secondary" onPress={() => void viewed.mutate()} />
        </>
      ) : !path ? (
        <Loading label="Đang tải lộ trình…" />
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

      {path && (
        <>
          <SectionTitle title={`Lộ trình ${hskLabel(path.level)}`} />
          <ChipRow
            options={path.levels.map((l) => ({
              value: l,
              label: l === courseLevel ? `${hskLabel(l)} · đang học` : hskLabel(l),
            }))}
            value={path.level}
            onChange={(l) => setViewLevel(user && l === courseLevel ? undefined : l)}
          />
          <TopicExplorer key={path.level} lessons={path.lessons} currentLessonId={path.currentLessonId} />
          <TextLink
            title="Không chắc nên học cấp nào? Kiểm tra trình độ →"
            onPress={() => router.push('/kiem-tra-trinh-do')}
          />
          {user ? <DailyQuests lessonHref={current ? `/bai-hoc/${current.id}` : '/'} /> : <GuestTryCard />}
          <WordOfTheDay level={user ? courseLevel : path.level} />
        </>
      )}
    </Screen>
  );
}
