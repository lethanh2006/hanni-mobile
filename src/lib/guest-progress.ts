/**
 * Việc KHÁCH làm trước khi có tài khoản: khảo sát, bài đã học, cấp từ bài kiểm tra
 * trình độ, từ bấm "Lưu để ôn tập", đề thi thử. Đăng ký/đăng nhập xong thì
 * `saveGuestProgress()` nạp tất cả lên server.
 *
 * Web giữ ở sessionStorage; app giữ trong bộ nhớ — cùng ý nghĩa "chỉ trong lần mở app này".
 */
import { api } from './api';
import { addWordToSrs, submitOnboarding } from './hooks';
import type { MockAnswer, SubmitOnboardingInput } from './types';

export interface PendingLesson {
  lessonId: string;
  hskLevel: number;
  results: { wordId: string; mistakes: number }[];
  durationMs: number;
}

export interface PendingExam {
  slug: string;
  answers: (MockAnswer | null)[];
  durationSec: number;
}

const pending = {
  onboarding: null as SubmitOnboardingInput | null,
  lessons: [] as PendingLesson[],
  wordIds: [] as string[],
  courseLevel: 0,
  exam: null as PendingExam | null,
};

export function savePendingOnboarding(input: SubmitOnboardingInput) {
  pending.onboarding = input;
}

export function savePendingLesson(lesson: PendingLesson) {
  pending.lessons = [...pending.lessons.filter((l) => l.lessonId !== lesson.lessonId), lesson];
}

/** Bài khách đã học xong — trang chủ đánh dấu xong và "Học tiếp" đúng bài kế. */
export function pendingLessonIds(): string[] {
  return pending.lessons.map((l) => l.lessonId);
}

/** Tổng số từ khách đã học mà chưa lưu — màn đăng ký nói rõ sẽ lưu gì. */
export function pendingWordCount(): number {
  return pending.lessons.reduce((n, l) => n + l.results.length, 0) + pending.wordIds.length;
}

export function addPendingWord(wordId: string) {
  if (!pending.wordIds.includes(wordId)) pending.wordIds = [...pending.wordIds, wordId];
}

/** Cấp mà bài kiểm tra trình độ đề xuất cho khách. */
export function savePendingCourseLevel(level: number) {
  pending.courseLevel = level;
}

export function savePendingExam(exam: PendingExam) {
  pending.exam = exam;
}

async function submitPendingOnboarding(): Promise<boolean> {
  const input = pending.onboarding;
  pending.onboarding = null;
  if (!input) return false;
  return submitOnboarding(input).then(
    () => true,
    () => false,
  );
}

async function saveLessons(): Promise<boolean> {
  const lessons = pending.lessons;
  pending.lessons = [];
  let saved = 0;
  for (const l of lessons) {
    try {
      await api.post(`/learn/lessons/${l.lessonId}/complete`, {
        results: l.results,
        durationMs: l.durationMs,
      });
      saved += 1;
    } catch {
      // 1 bài lỗi không được chặn các bài còn lại.
    }
  }
  // Cấp của bài đầu tiên thành cấp lộ trình.
  if (saved > 0) {
    await api.patch('/users/me/settings', { courseLevel: lessons[0].hskLevel }).catch(() => undefined);
  }
  return saved > 0;
}

async function saveWords(): Promise<boolean> {
  const ids = pending.wordIds;
  pending.wordIds = [];
  if (ids.length === 0) return false;
  await Promise.allSettled(ids.map((id) => addWordToSrs(id)));
  return true;
}

async function saveExam(): Promise<boolean> {
  const exam = pending.exam;
  pending.exam = null;
  if (!exam) return false;
  return api
    .post(`/mock-exams/${encodeURIComponent(exam.slug)}/submit`, {
      answers: exam.answers,
      durationSec: exam.durationSec,
    })
    .then(
      () => true,
      () => false,
    );
}

async function saveCourseLevel(): Promise<boolean> {
  const level = pending.courseLevel;
  pending.courseLevel = 0;
  if (!level) return false;
  return api.patch('/users/me/settings', { courseLevel: level }).then(
    () => true,
    () => false,
  );
}

/**
 * Nạp mọi thứ khách đã làm. Khảo sát nộp TRƯỚC (cấp tự khai), bài đã học đặt lại
 * theo cấp của bài, kết quả kiểm tra trình độ (đo thật) đặt SAU CÙNG.
 * `hasProgress` = đã có gì để học tiếp, không cần bắt làm khảo sát nữa.
 */
export async function saveGuestProgress(): Promise<{ hasProgress: boolean }> {
  const onboarded = await submitPendingOnboarding();
  const [lessons, words, exam] = await Promise.all([saveLessons(), saveWords(), saveExam()]);
  const placed = await saveCourseLevel();
  return { hasProgress: onboarded || lessons || words || exam || placed };
}
