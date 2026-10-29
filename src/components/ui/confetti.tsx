import { useEffect, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Reanimated, { useReducedMotion } from 'react-native-reanimated';

const COLORS = ['#dc3526', '#f0b429', '#e3b25c', '#2f8f5b', '#ffffff', '#f27a6b'];
const STEPS = 10;

/** Tính trước đường bay (cùng vật lý `confetti()` của web) rồi giao cho CSS animation của Reanimated chạy ở luồng UI. */
function build(w: number, h: number, count: number) {
  return Array.from({ length: count }, (_, i) => {
    const left = i % 2 === 0;
    const angle = (((left ? -60 : -120) + (Math.random() - 0.5) * 40) * Math.PI) / 180;
    const speed = (0.7 + Math.random() * 0.5) * Math.sqrt(h) * 0.85;
    let x = left ? w * 0.08 : w * 0.92;
    let y = h + 10;
    let vx = Math.cos(angle) * speed;
    let vy = Math.sin(angle) * speed;
    let spin = Math.random() * 180;
    const vspin = (Math.random() - 0.5) * 17;
    const frames: Record<string, { opacity: number; transform: object[] }> = {};
    for (let f = 0; f <= 120; f++) {
      if (f % (120 / STEPS) === 0) {
        const pct = f / 120;
        frames[`${Math.round(pct * 100)}%`] = {
          opacity: pct < 0.7 ? 1 : 1 - (pct - 0.7) / 0.3,
          transform: [{ translateX: x }, { translateY: y }, { rotate: `${spin}deg` }],
        };
      }
      vy += 0.32;
      vx *= 0.985;
      vy *= 0.985;
      x += vx;
      y += vy;
      spin += vspin;
    }
    const size = 6 + Math.random() * 6;
    const round = Math.random() < 0.3;
    return {
      id: i,
      frames,
      color: COLORS[i % COLORS.length],
      width: round ? size * 0.8 : size,
      height: round ? size * 0.8 : size / 2,
      radius: round ? size : 1,
    };
  });
}

/**
 * Pháo giấy màu Hanni bắn từ 2 góc dưới lên ~2 giây rồi tự gỡ. Chỉ cho khoảnh khắc hiếm (xong bài, thi đạt) — bắn ở
 * mọi chỗ thì thành hình nền. Đặt làm con cuối của màn hình (phủ kín cha). Máy bật giảm chuyển động thì bỏ qua.
 */
export function Confetti({ count = 80 }: { count?: number }) {
  const reduce = useReducedMotion();
  const { width, height } = useWindowDimensions();
  const [pieces] = useState(() => build(width, height, count));
  const [done, setDone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setDone(true), 2200);
    return () => clearTimeout(t);
  }, []);
  if (reduce || done) return null;
  return (
    <View pointerEvents="none" style={styles.layer}>
      {pieces.map((p) => (
        <Reanimated.View
          key={p.id}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: p.width,
            height: p.height,
            borderRadius: p.radius,
            backgroundColor: p.color,
            animationName: p.frames,
            animationDuration: '2000ms',
            animationTimingFunction: 'linear',
            animationFillMode: 'forwards',
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  layer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 70, overflow: 'hidden' },
});
