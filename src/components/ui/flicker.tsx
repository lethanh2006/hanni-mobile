import type { ReactNode } from 'react';
import Reanimated, { useReducedMotion } from 'react-native-reanimated';

/** `.flame-live` của web: lửa chuỗi ngày bập bùng — chỉ bật khi ĐÃ học hôm nay (nhìn là biết chuỗi đang "cháy"). */
const FLICKER = {
  '0%': { transform: [{ scaleX: 1 }, { scaleY: 1 }, { rotate: '0deg' }] },
  '30%': { transform: [{ scaleX: 1.08 }, { scaleY: 1.14 }, { rotate: '-4deg' }] },
  '60%': { transform: [{ scaleX: 0.96 }, { scaleY: 1.04 }, { rotate: '3deg' }] },
  '100%': { transform: [{ scaleX: 1 }, { scaleY: 1 }, { rotate: '0deg' }] },
};

export function Flicker({ on, children }: { on: boolean; children: ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <Reanimated.View
      style={
        on && !reduce
          ? {
              animationName: FLICKER,
              animationDuration: '1.6s',
              animationIterationCount: 'infinite',
              animationTimingFunction: 'ease-in-out',
              transformOrigin: '50% 85%',
            }
          : undefined
      }>
      {children}
    </Reanimated.View>
  );
}
