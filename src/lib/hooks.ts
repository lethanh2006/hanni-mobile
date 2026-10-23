/**
 * Hook SWR dùng chung, chép từ `lib/hooks.ts` của hanni-client.
 * Hook riêng của một tính năng thì để trong `src/features/<tính năng>/`, không dồn vào đây.
 */
import { useEffect } from 'react';
import useSWR, { mutate } from 'swr';

import { api } from './api';
import { useAuth } from './auth';
import type {
  Achievement,
  CurrentLesson,
  DayActivity,
  HskLevel,
  Leaderboard,
  LeaderboardMetric,
  LeaderboardMetricKey,
  LearnPath,
  LeechWord,
  LessonDetail,
  OnboardingPlan,
  OnboardingProfile,
  Paginated,
  PracticeSkill,
  PracticeStats,
  ProgressOverview,
  PublicProfile,
  QuizAttemptSummary,
  ReferralStats,
  StreakInfo,
  StudyStats,
  SubmitOnboardingInput,
  SuspendedWord,
  TodayQuests,
  VideoCard,
  VideoDetail,
  WeeklyLeague,
  Word,
} from './types';

export function useLevels() {
  return useSWR<HskLevel[]>('/levels');
}

export function useProgress() {
  return useSWR<ProgressOverview>('/progress/overview');
}

/** Các hook có `user ? … : null` dùng được ở màn khách xem: khách thì không gọi API cần đăng nhập. */
export function useStreak() {
  const { user } = useAuth();
  return useSWR<StreakInfo>(user ? '/streak' : null);
}

/** "Từ khó nhớ" — từ đã sai đủ nhiều lần trong SRS. */
export function useLeeches() {
  return useSWR<LeechWord[]>('/study/leeches');
}

/** Từ đang ẩn khỏi hàng đợi ôn. */
export function useSuspendedWords() {
  return useSWR<SuspendedWord[]>('/study/suspended');
}

/** "Tôi biết từ này rồi" / bỏ ẩn. */
export function suspendWord(wordId: string, suspended: boolean) {
  return api.post<{ wordId: string; suspended: boolean }>(`/study/words/${wordId}/suspend`, {
    suspended,
  });
}

export function useStreakHistory(days = 30) {
  const { user } = useAuth();
  return useSWR<DayActivity[]>(user ? `/streak/history?days=${days}` : null);
}

export function useStudyStats() {
  const { user } = useAuth();
  return useSWR<StudyStats>(user ? '/study/stats' : null, { refreshInterval: 60_000 });
}

export function useAchievements() {
  return useSWR<Achievement[]>('/achievements');
}

export function useRecentQuizzes() {
  return useSWR<QuizAttemptSummary[]>('/quiz/recent');
}

export function useLearnPath(level?: number) {
  return useSWR<LearnPath>(level ? `/learn/path?level=${level}` : '/learn/path', {
    keepPreviousData: true,
  });
}

/** Bài đang học dở — khách không có. */
export function useCurrentLesson(enabled = true) {
  const { user } = useAuth();
  return useSWR<CurrentLesson | null>(enabled && user ? '/learn/current' : null);
}

export function useLesson(id: string | null) {
  return useSWR<LessonDetail>(id ? `/learn/lessons/${id}` : null);
}

export function useWords(params: { level?: number; lessonId?: string; q?: string; page?: number }) {
  const qs = new URLSearchParams();
  if (params.level) qs.set('level', String(params.level));
  if (params.lessonId) qs.set('lessonId', params.lessonId);
  if (params.q) qs.set('q', params.q);
  qs.set('page', String(params.page ?? 1));
  qs.set('pageSize', '24');
  return useSWR<Paginated<Word>>(`/words?${qs.toString()}`);
}

export function useVideos(params: { level?: number; kind?: string } = {}) {
  const qs = new URLSearchParams();
  if (params.level) qs.set('level', String(params.level));
  if (params.kind) qs.set('kind', params.kind);
  const q = qs.toString();
  return useSWR<VideoCard[]>(`/videos${q ? `?${q}` : ''}`, { keepPreviousData: true });
}

export function useVideo(id: string | null) {
  return useSWR<VideoDetail>(id ? `/videos/${id}` : null);
}

export function usePublicProfile(userId: string | null) {
  return useSWR<PublicProfile>(userId ? `/users/${userId}/profile` : null);
}

export function useReferralStats() {
  return useSWR<ReferralStats>('/referrals/me');
}

export function useLeaderboardMetrics() {
  return useSWR<LeaderboardMetric[]>('/leaderboard/metrics');
}

export function useLeaderboard(metric: LeaderboardMetricKey, scope: 'global' | 'friends' = 'global') {
  return useSWR<Leaderboard>(`/leaderboard?metric=${metric}&scope=${scope}`);
}

/** Giải đấu học tập theo tuần. */
export function useWeeklyLeague() {
  const { user } = useAuth();
  return useSWR<WeeklyLeague>(user ? '/leaderboard/league' : null);
}

/** Nhiệm vụ hàng ngày — xong cả 3 thì server cấp 1 lá chắn, làm mới `/streak` để số lá chắn theo kịp. */
export function useTodayQuests() {
  const { user } = useAuth();
  const result = useSWR<TodayQuests>(user ? '/quests/today' : null);
  const justEarnedFreeze = result.data?.justEarnedFreeze ?? false;
  useEffect(() => {
    if (justEarnedFreeze) void mutate('/streak');
  }, [justEarnedFreeze]);
  return result;
}

export function usePracticeStats(skill: PracticeSkill) {
  const { user } = useAuth();
  return useSWR<PracticeStats>(user ? `/practice/stats?skill=${skill}` : null);
}

/** Ghi 1 lượt luyện nghe/phát âm lên server — không chặn giao diện nếu lỗi mạng. */
export function recordPracticeAttempt(wordId: string, skill: PracticeSkill, isCorrect?: boolean) {
  return api.post('/practice/attempts', { wordId, skill, isCorrect }).catch(() => undefined);
}

/** Lưu 1 từ vào hàng đợi ôn. `added: false` nghĩa là từ đã có sẵn trong tiến độ học. */
export function addWordToSrs(wordId: string) {
  return api.post<{ added: boolean }>('/study/add-word', { wordId });
}

/** null = chưa làm khảo sát bao giờ. */
export function useOnboarding(enabled = true) {
  return useSWR<OnboardingProfile | null>(enabled ? '/onboarding' : null);
}

export function submitOnboarding(input: SubmitOnboardingInput) {
  return api.post<OnboardingProfile>('/onboarding', input);
}

/** Tính lộ trình đề xuất mà KHÔNG lưu, không cần tài khoản. */
export function previewOnboarding(input: SubmitOnboardingInput) {
  return api.post<{ recommendedLevel: number; recommendationVi: string; plan?: OnboardingPlan }>(
    '/onboarding/preview',
    input,
  );
}
