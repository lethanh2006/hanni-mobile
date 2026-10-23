import { router, usePathname } from 'expo-router';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useSWRConfig } from 'swr';

import { api, ApiError } from './api';
import type { Me } from './types';

interface AuthState {
  user: Me | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

/** Người đang đăng nhập (khách nhận `null`). `undefined` = lỗi mạng, chưa biết. */
async function fetchSession(): Promise<Me | null | undefined> {
  try {
    const { user } = await api.get<{ user: Me | null }>('/auth/session');
    return user;
  } catch (err) {
    return err instanceof ApiError && err.status === 401 ? null : undefined;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { mutate } = useSWRConfig();
  const [user, setUser] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const me = await fetchSession();
    if (me !== undefined) setUser(me);
  }, []);

  const logout = useCallback(async () => {
    await api.post('/auth/logout').catch(() => undefined);
    setUser(null);
    // Xoá dữ liệu của tài khoản cũ khỏi bộ nhớ đệm SWR.
    await mutate(() => true, undefined, { revalidate: false });
  }, [mutate]);

  useEffect(() => {
    void fetchSession()
      .then((me) => setUser(me ?? null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth phải nằm trong <AuthProvider>');
  return ctx;
}

/** Dùng ở đầu màn cần đăng nhập: chưa đăng nhập thì chuyển sang màn đăng nhập rồi quay lại đúng màn này. */
export function useRequireAuth(): AuthState {
  const auth = useAuth();
  const pathname = usePathname();
  useEffect(() => {
    if (!auth.loading && !auth.user) {
      router.replace({ pathname: '/login', params: { next: pathname } });
    }
  }, [auth.loading, auth.user, pathname]);
  return auth;
}
