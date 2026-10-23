import { useEffect, useRef, useState } from 'react';
import { mutate } from 'swr';

import { api } from '@/lib/api';
import { suspendWord } from '@/lib/hooks';
import type { LeechWord, LessonDetail, Rating, StudyQueue, Word } from '@/lib/types';

export interface ReviewItem {
  word: Word;
  isNew: boolean;
}

export type ReviewPhase = 'loading' | 'intro' | 'review' | 'done';

/** Nguồn thẻ của buổi ôn: từ đến hạn, cả 1 bài, hoặc riêng từ hay quên. */
export type ReviewSource = { kind: 'due' } | { kind: 'lesson'; lessonId: string } | { kind: 'leeches' };

async function loadItems(source: ReviewSource): Promise<ReviewItem[]> {
  if (source.kind === 'leeches') {
    const leeches = await api.get<LeechWord[]>('/study/leeches');
    return leeches.map((l) => ({ word: l.word, isNew: false }));
  }
  const lessonId = source.kind === 'lesson' ? source.lessonId : null;
  const queue = await api.get<StudyQueue>(`/study/queue?limit=40${lessonId ? `&lessonId=${lessonId}` : ''}`);
  const list = [
    ...queue.due.map((d) => ({ word: d.word, isNew: false })),
    ...queue.newCards.map((n) => ({ word: n.word, isNew: true })),
  ];
  // Flashcard THEO BÀI = lật toàn bộ thẻ của bài, không chỉ thẻ đến hạn: bài vừa học xong
  // thì mai mới có thẻ đến hạn, bấm "Ôn bằng flashcard" mà ra "không có từ" là cụt đường.
  if (lessonId) {
    const detail = await api.get<LessonDetail>(`/learn/lessons/${lessonId}`);
    const seen = new Set(list.map((i) => i.word.id));
    for (const w of detail.words) {
      if (!seen.has(w.id)) list.push({ word: w, isNew: !w.progressState || w.progressState === 'NEW' });
    }
  }
  return list;
}

/** Làm mới số liệu sau buổi ôn: số từ đến hạn, chuỗi ngày, nhiệm vụ, tiến độ. */
function refreshAfterReview() {
  void mutate(
    (key) => typeof key === 'string' && ['/study', '/streak', '/quests', '/progress', '/learn'].some((p) => key.startsWith(p)),
  );
}

/** Logic 1 buổi ôn flashcard: tải thẻ, ghi đánh giá từng thẻ, ẩn từ đã biết, kết thúc phiên. */
export function useReviewSession(source: ReviewSource) {
  const [phase, setPhase] = useState<ReviewPhase>('loading');
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [pos, setPos] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionId = useRef<string | null>(null);
  const reviewedIds = useRef(new Set<string>());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const session = await api
        .post<{ id: string }>('/study/session', { source: source.kind === 'lesson' ? 'LEARN' : 'REVIEW' })
        .catch(() => null);
      sessionId.current = session?.id ?? null;
      const list = await loadItems(source);
      if (cancelled) return;
      setItems(list);
      setPhase(list.length ? 'intro' : 'done');
    })().catch(() => setError('Chưa tải được buổi ôn. Vui lòng thử lại.'));
    return () => {
      cancelled = true;
    };
    // Nguồn thẻ cố định suốt buổi ôn (màn hình đặt `key` theo nguồn).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function finish() {
    if (sessionId.current) await api.post(`/study/session/${sessionId.current}/end`).catch(() => undefined);
    refreshAfterReview();
    setPhase('done');
  }

  async function rate(rating: Rating, durationMs: number) {
    const item = items[pos];
    if (!item || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await api.post<{ isCorrect: boolean }>('/study/review', {
        wordId: item.word.id,
        rating,
        durationMs,
        studySessionId: sessionId.current ?? undefined,
      });
      reviewedIds.current.add(item.word.id);
      if (res.isCorrect) setCorrect((c) => c + 1);
      if (pos + 1 < items.length) setPos(pos + 1);
      else await finish();
    } catch {
      setError('Chưa lưu được kết quả. Hãy thử đánh giá lại thẻ này.');
    } finally {
      setBusy(false);
    }
  }

  /** Ẩn từ khỏi hàng đợi và BỎ thẻ khỏi buổi ôn (không nhảy qua) để thống kê cuối buổi đúng mẫu số. */
  async function markKnown() {
    const item = items[pos];
    if (!item || busy) return;
    setBusy(true);
    setError(null);
    try {
      await suspendWord(item.word.id, true);
      const rest = items.filter((_, i) => i !== pos);
      setItems(rest);
      if (pos >= rest.length) await finish();
    } catch {
      setError('Chưa ẩn được từ này. Thử lại nhé.');
    } finally {
      setBusy(false);
    }
  }

  return {
    phase,
    items,
    pos,
    correct,
    busy,
    error,
    reviewedIds: () => [...reviewedIds.current],
    start: () => setPhase('review'),
    rate,
    markKnown,
  };
}
