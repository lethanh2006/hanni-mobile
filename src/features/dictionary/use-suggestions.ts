import { useEffect, useState } from 'react';
import useSWR from 'swr';

import type { Paginated, Word } from '@/lib/types';

/** Giá trị chỉ đổi khi người dùng ngừng gõ `delay` ms — đỡ gọi API mỗi phím. */
function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

/**
 * Gợi ý khi gõ: server tự xếp hạng theo chữ Hán, pinyin (không dấu, viết liền),
 * nghĩa tiếng Việt và âm Hán Việt (vd gõ "học hiệu" ra 学校).
 */
export function useSuggestions(query: string) {
  const term = useDebounced(query.trim(), 200);
  const { data, isLoading } = useSWR<Paginated<Word>>(
    term ? `/words?q=${encodeURIComponent(term)}&pageSize=8` : null,
    { keepPreviousData: true },
  );
  return { items: term ? (data?.items ?? []) : [], loading: isLoading };
}
