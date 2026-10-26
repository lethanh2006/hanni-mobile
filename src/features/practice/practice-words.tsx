import { useState } from 'react';

import { useCurrentLesson, useLesson, useWords } from '@/lib/hooks';
import type { Word } from '@/lib/types';

export interface WordScope {
  /** Tên bài đang học khi đang luyện theo bài; `null` = luyện tự do theo cấp. */
  lessonTitle: string | null;
  /** Cấp HSK của bài đang luyện (theo bài), để hiện nhãn "HSK N". */
  lessonLevel: number | null;
  /** Số từ cả thư viện của cấp đang chọn (luyện tự do). */
  total: number;
  canUseLesson: boolean;
  level: number;
  page: number;
  totalPages: number;
  backToLesson: () => void;
  chooseLevel: (level: number) => void;
  choosePage: (page: number) => void;
}

/**
 * Bộ từ để luyện: mặc định ĐÚNG BÀI ĐANG HỌC DỞ (khách không có thì theo cấp); người học
 * chủ động chọn cấp thì luyện tự do theo cấp + nhóm 24 từ (như `PracticeLibrary` của web).
 */
export function usePracticeWords(lessonId?: string): {
  words: Word[];
  loading: boolean;
  error: boolean;
  retry: () => void;
  scope: WordScope;
} {
  const current = useCurrentLesson();
  // `?lesson=` (nút "Luyện nghe" ở trang bài học) thắng bài đang học dở.
  const chosen = useLesson(lessonId ?? null);
  const [freeMode, setFreeMode] = useState(false);
  const [level, setLevel] = useState(1);
  const [page, setPage] = useState(1);
  const lesson = freeMode
    ? null
    : lessonId
      ? { id: lessonId, title: chosen.data?.lesson.title ?? '' }
      : current.data;
  const words = useWords(lesson ? { lessonId: lesson.id } : { level, page });

  return {
    words: words.data?.items ?? [],
    loading: !words.data && !words.error,
    error: Boolean(words.error),
    retry: () => void words.mutate(),
    scope: {
      lessonTitle: lesson?.title ?? null,
      lessonLevel: lesson ? ((lessonId ? chosen.data?.lesson.hskLevel : current.data?.hskLevel) ?? null) : null,
      total: words.data?.total ?? 0,
      canUseLesson: Boolean(lessonId || current.data),
      level,
      page,
      totalPages: words.data?.totalPages ?? 1,
      backToLesson: () => setFreeMode(false),
      chooseLevel: (l) => {
        setFreeMode(true);
        setLevel(l);
        setPage(1);
      },
      choosePage: setPage,
    },
  };
}

/** Nghĩa ngắn để làm gợi ý / đáp án. */
export const firstMeaning = (w: Pick<Word, 'meaningVi' | 'meaningEn'>) => (w.meaningVi ?? w.meaningEn ?? '').split(';')[0];
