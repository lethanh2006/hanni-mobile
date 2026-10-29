import { useEffect, useState } from 'react';
import { useReducedMotion } from 'react-native-reanimated';

/** Số chạy từ 0 lên `target` trong ~0,9 giây (chậm dần ở cuối) — `useCountUp` của web, cho số liệu ở màn kết quả. */
export function useCountUp(target: number, duration = 900): number {
  const reduce = useReducedMotion();
  const [value, setValue] = useState(0);
  useEffect(() => {
    const ms = reduce ? 0 : duration;
    let frame = 0;
    const start = Date.now();
    const tick = () => {
      const p = ms ? Math.min(1, (Date.now() - start) / ms) : 1;
      setValue(Math.round(target * (1 - (1 - p) ** 3)));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration, reduce]);
  return value;
}
