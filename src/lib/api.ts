/**
 * Lớp gọi API tập trung, chép từ `lib/api.ts` của hanni-client.
 * Phiên đăng nhập vẫn là cookie như web: fetch của React Native tự lưu cookie
 * mà server gửi về và gửi kèm ở các request sau (`credentials: 'include'`).
 */
import { Platform } from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://hanni-api.dangpham.id.vn/api';

/** Web khi dev (localhost) bị server chặn CORS nên gọi qua proxy `/api` của Metro (metro.config.js). */
export const API_BASE = Platform.OS === 'web' && __DEV__ ? '/api' : API_URL;

/** Trang web Hanni — dùng cho link chia sẻ (người nhận chưa cài app vẫn mở được). */
export const WEB_ORIGIN = 'https://hanni.dangpham.id.vn';

/** Gốc của server (bỏ "/api") — dùng cho file tĩnh như audio phát âm. */
export const SERVER_ORIGIN = API_URL.replace(/\/api\/?$/, '');

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

function raw(path: string, method: string, body?: unknown): Promise<Response> {
  return fetch(`${API_BASE}${path}`, {
    method,
    credentials: 'include',
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

/**
 * Gọi `/auth/refresh` DÙNG CHUNG cho mọi request đang chờ. Nhiều request cùng
 * 401 mà mỗi cái tự refresh thì server coi các lượt sau là token bị đánh cắp
 * và huỷ cả phiên (xem ghi chú ở `lib/api.ts` của web).
 */
let refreshInFlight: Promise<boolean> | null = null;

export function refreshSession(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = raw('/auth/refresh', 'POST')
      .then((r) => r.ok)
      .catch(() => false)
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function request<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  let res = await raw(path, method, body);

  // Các route /auth/* tự lo 401 của mình (sai mật khẩu…), trừ /auth/session.
  const canRefresh = !path.startsWith('/auth/') || path === '/auth/session';
  if (res.status === 401 && canRefresh && (await refreshSession())) {
    res = await raw(path, method, body);
  }

  const text = await res.text();
  const data = text ? safeJson(text) : null;
  if (!res.ok) {
    const message =
      data && typeof data === 'object' && 'message' in data
        ? String((data as { message: unknown }).message)
        : 'Có lỗi xảy ra, bạn thử lại nhé.';
    throw new ApiError(res.status, message, data);
  }
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, 'POST', body),
  patch: <T>(path: string, body?: unknown) => request<T>(path, 'PATCH', body),
  del: <T>(path: string, body?: unknown) => request<T>(path, 'DELETE', body),
};

/** Fetcher mặc định cho SWR: khoá chính là đường dẫn API. */
export const fetcher = <T>(path: string) => request<T>(path);

/** Lời báo lỗi đọc được cho người dùng. */
export function errorMessage(err: unknown, fallback = 'Có lỗi xảy ra, bạn thử lại nhé.') {
  return err instanceof ApiError ? err.message : fallback;
}

/** Tuyệt đối hoá đường dẫn tĩnh, vd "/media/audio/cmn-你好.mp3" hoặc URL ngoài. */
export function mediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^(https?:|data:)/.test(path)) return path;
  return `${SERVER_ORIGIN}${path.startsWith('/') ? '' : '/'}${path}`;
}
