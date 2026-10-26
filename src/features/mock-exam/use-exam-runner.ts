import { useEffect, useRef, useState } from 'react';
import { mutate } from 'swr';

import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { savePendingExam } from '@/lib/guest-progress';
import type { MockAnswer, MockExamResult, MockPaper } from '@/lib/types';

import { stopListening } from './listening';
import { clearSaved, readSaved, writeSaved, type SavedExam } from './saved-exam';

export type ExamPhase = 'intro' | 'test' | 'result';

/**
 * Logic 1 lượt làm đề: bắt đầu/làm tiếp, đồng hồ đếm ngược (hết giờ tự nộp ĐÚNG 1 lần),
 * lưu bài làm dở trên máy, nộp bài. Khách nộp vẫn được chấm; điểm lưu khi tạo tài khoản.
 */
export function useExamRunner(slug: string, paper: MockPaper | undefined) {
  const { user } = useAuth();
  const [phase, setPhase] = useState<ExamPhase>('intro');
  const [answers, setAnswers] = useState<(MockAnswer | null)[]>([]);
  const [flags, setFlags] = useState<number[]>([]);
  const [startedAt, setStartedAt] = useState(0);
  const [now, setNow] = useState(0);
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  const [result, setResult] = useState<MockExamResult | null>(null);
  const [usedSec, setUsedSec] = useState(0);
  const autoSubmitted = useRef(false);

  const saved: SavedExam | null = paper && phase === 'intro' ? readSaved(slug, paper.durationMin) : null;
  const durationSec = (paper?.durationMin ?? 0) * 60;
  const remaining = Math.max(0, durationSec - Math.floor((now - startedAt) / 1000));
  const answered = answers.filter((a) => a !== null && a !== undefined).length;

  function start(resume: SavedExam | null) {
    if (!paper) return;
    const t = Date.now();
    setAnswers(resume?.answers ?? new Array<MockAnswer | null>(paper.questionCount).fill(null));
    setFlags(resume?.flags ?? []);
    setStartedAt(resume?.startedAt ?? t);
    setNow(t);
    setResult(null);
    autoSubmitted.current = false;
    setPhase('test');
  }

  function setAnswer(no: number, v: MockAnswer | null) {
    setAnswers((list) => list.map((x, i) => (i === no - 1 ? v : x)));
  }

  /** Đánh dấu / bỏ đánh dấu câu cần xem lại. */
  function toggleFlag(no: number) {
    setFlags((f) => (f.includes(no) ? f.filter((n) => n !== no) : [...f, no]));
  }

  // Mỗi lần trả lời/đánh dấu là lưu bài làm dở trên máy.
  useEffect(() => {
    if (phase === 'test') writeSaved(slug, { answers, flags, startedAt });
  }, [phase, answers, flags, startedAt, slug]);

  async function submit() {
    if (!paper || busy) return;
    setBusy(true);
    setSubmitError(false);
    stopListening();
    const used = Math.min(durationSec, Math.round((Date.now() - startedAt) / 1000));
    try {
      const r = await api.post<MockExamResult>(`/mock-exams/${slug}/submit`, { answers, durationSec: used });
      if (!user) savePendingExam({ slug, answers, durationSec: used });
      clearSaved(slug);
      setUsedSec(used);
      setResult(r);
      setPhase('result');
      // Danh sách đề (điểm cao nhất), lịch sử làm bài.
      void mutate((key) => typeof key === 'string' && key.startsWith('/mock-exams'));
    } catch {
      setSubmitError(true);
    } finally {
      setBusy(false);
    }
  }

  // Đồng hồ: hết giờ thì tự nộp 1 lần (lỗi mạng thì để người làm bấm nộp lại).
  const submitRef = useRef(submit);
  useEffect(() => {
    submitRef.current = submit;
  });
  useEffect(() => {
    if (phase !== 'test' || !paper) return;
    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (!autoSubmitted.current && t - startedAt >= durationSec * 1000) {
        autoSubmitted.current = true;
        void submitRef.current();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [phase, paper, startedAt, durationSec]);

  return {
    phase,
    answers,
    flags,
    answered,
    remaining,
    saved,
    busy,
    submitError,
    clearSubmitError: () => setSubmitError(false),
    result,
    usedSec,
    start,
    setAnswer,
    toggleFlag,
    submit,
  };
}
