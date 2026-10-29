import { useFocusEffect } from 'expo-router';
import { useCallback, useSyncExternalStore } from 'react';
import useSWR from 'swr';

import { api, API_BASE, refreshSession } from './api';
import type { AssistantAction, AssistantMessage, AssistantSession } from './types';

/** Trợ lý AI Hanni — chép các hook trợ lý ở `lib/hooks.ts` + `askAssistant` ở `assistant-widget.tsx` của web. */

export function useAssistantSessions(enabled: boolean) {
  return useSWR<AssistantSession[]>(enabled ? '/assistant/sessions' : null);
}

export function useAssistantMessages(sessionId: string | null) {
  return useSWR<AssistantMessage[]>(sessionId ? `/assistant/sessions/${sessionId}/messages` : null);
}

export function createAssistantSession() {
  return api.post<AssistantSession>('/assistant/sessions');
}

export function deleteAssistantSession(sessionId: string) {
  return api.del<{ ok: true }>(`/assistant/sessions/${sessionId}`);
}

/**
 * Trả lời hiện dần từng đoạn qua SSE (`GET /assistant/ask/stream`). React Native không có `EventSource` nên đọc luồng
 * bằng XHR (phần chữ nhận được dồn dần vào `responseText`). Gặp 401 (phiên hết hạn) thì làm mới phiên rồi hỏi lại 1 lần.
 * Trả về hàm đóng kết nối sớm.
 */
export function streamAssistant(
  message: string,
  sessionId: string | undefined,
  handlers: {
    onDelta: (delta: string) => void;
    onDone: (sessionId: string, action?: AssistantAction) => void;
    onError: () => void;
  },
): () => void {
  const params = new URLSearchParams({ message });
  if (sessionId) params.set('sessionId', sessionId);
  let xhr: XMLHttpRequest | null = null;
  let closed = false;

  function open(retried: boolean) {
    const req = new XMLHttpRequest();
    xhr = req;
    let read = 0;
    let finished = false;
    req.open('GET', `${API_BASE}/assistant/ask/stream?${params}`);
    req.withCredentials = true;
    req.setRequestHeader('Accept', 'text/event-stream');

    function consume() {
      const text = req.responseText ?? '';
      // Mỗi sự kiện kết thúc bằng 1 dòng trống; phần dở dang chờ lượt sau.
      let end = text.indexOf('\n\n', read);
      while (end !== -1) {
        const block = text.slice(read, end);
        read = end + 2;
        const data = block
          .split('\n')
          .filter((l) => l.startsWith('data:'))
          .map((l) => l.slice(5).trimStart())
          .join('\n');
        if (data) {
          let payload: { delta?: string; done?: boolean; sessionId?: string; action?: AssistantAction };
          try {
            payload = JSON.parse(data);
          } catch {
            payload = {};
          }
          if (payload.delta) handlers.onDelta(payload.delta);
          if (payload.done && !finished) {
            finished = true;
            handlers.onDone(payload.sessionId ?? sessionId ?? '', payload.action);
            req.abort();
            return;
          }
        }
        end = text.indexOf('\n\n', read);
      }
    }

    req.onprogress = () => {
      if (!closed && req.status === 200) consume();
    };
    req.onreadystatechange = () => {
      if (closed || req.readyState !== 4 || finished) return;
      if (req.status === 401 && !retried) {
        void refreshSession().then((ok) => {
          if (closed) return;
          if (ok) open(true);
          else handlers.onError();
        });
        return;
      }
      if (req.status === 200) consume();
      if (!finished) handlers.onError();
    };
    req.onerror = () => {
      if (!closed && !finished) handlers.onError();
    };
    req.send();
  }

  open(false);
  return () => {
    closed = true;
    xhr?.abort();
  };
}

/* ── Hỏi trợ lý từ chỗ khác trong app ("Hỏi trợ lý Hanni về câu này", bài đọc…) ── */

type AskListener = (text: string) => void;
const askListeners = new Set<AskListener>();

/** Mở trợ lý và hỏi ngay 1 câu soạn sẵn — luôn mở cuộc trò chuyện MỚI để không lẫn vào chủ đề cũ. */
export function askAssistant(text: string) {
  askListeners.forEach((l) => l(text));
}

export function onAskAssistant(listener: AskListener) {
  askListeners.add(listener);
  return () => {
    askListeners.delete(listener);
  };
}

/* ── Màn nằm ngoài khung app (phòng thi) bật nút trợ lý riêng — như web gắn `<AssistantWidget />` ở màn kết quả ── */

let forced = 0;
const forcedListeners = new Set<() => void>();

function subscribeForced(cb: () => void) {
  forcedListeners.add(cb);
  return () => {
    forcedListeners.delete(cb);
  };
}

export function useAssistantForced() {
  return useSyncExternalStore(subscribeForced, () => forced > 0, () => false);
}

/**
 * Gọi trong màn muốn hiện nút trợ lý dù màn đó bình thường không có (vd kết quả thi thử). Chỉ tính lúc màn đang
 * hiển thị: màn nằm dưới ngăn xếp vẫn còn gắn, tính theo mount thì nút trợ lý hiện cả ở màn khác — đè nút Gửi của
 * luyện nói AI.
 */
export function useShowAssistant(enabled: boolean) {
  useFocusEffect(
    useCallback(() => {
      if (!enabled) return;
      forced += 1;
      forcedListeners.forEach((l) => l());
      return () => {
        forced -= 1;
        forcedListeners.forEach((l) => l());
      };
    }, [enabled]),
  );
}
