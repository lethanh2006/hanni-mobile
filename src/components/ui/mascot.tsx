import { Image } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import { AppState, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Reanimated, { useReducedMotion } from 'react-native-reanimated';

/**
 * Cáo Hanni (`Mascot` của web) — 12 biểu cảm, mỗi cái 6 hình vẽ riêng (repo hanni-mascot, bản v11; ảnh ở `assets/mascot/`).
 * Mỗi biểu cảm gắn với 1 tình huống, không dùng làm hình trang trí: cáo phản ứng theo việc người học đang làm.
 * WebP động tự lặp (expo-image phát được trên Android, iOS, web); máy bật giảm chuyển động thì hiện ảnh tĩnh.
 */
export type MascotEmote =
  | 'e00-nghi' // trợ lý đang mở, chờ câu hỏi
  | 'e01-chao' // lần đầu mở trợ lý
  | 'e02-suy-nghi' // vừa gửi câu hỏi, AI chưa trả lời
  | 'e04-vui-mung' // trả lời đúng, xong bài, thi đạt
  | 'e05-co-len' // trả lời sai, thi chưa đạt
  | 'e09-lang-nghe' // đang bật micro
  | 'e10-doc-mau' // AI đang trả lời
  | 'e11-a-ha' // mẹo Hán Việt
  | 'e16-doc-sach' // bài đọc
  | 'e19-tim-kiem' // đang tìm / không tìm thấy
  | 'e39-ghi-chu' // AI đang viết
  | 'e42-cham-chu'; // đang gõ câu hỏi

const ANIMATED: Record<MascotEmote, number> = {
  'e00-nghi': require('@/assets/mascot/e00-nghi.webp'),
  'e01-chao': require('@/assets/mascot/e01-chao.webp'),
  'e02-suy-nghi': require('@/assets/mascot/e02-suy-nghi.webp'),
  'e04-vui-mung': require('@/assets/mascot/e04-vui-mung.webp'),
  'e05-co-len': require('@/assets/mascot/e05-co-len.webp'),
  'e09-lang-nghe': require('@/assets/mascot/e09-lang-nghe.webp'),
  'e10-doc-mau': require('@/assets/mascot/e10-doc-mau.webp'),
  'e11-a-ha': require('@/assets/mascot/e11-a-ha.webp'),
  'e16-doc-sach': require('@/assets/mascot/e16-doc-sach.webp'),
  'e19-tim-kiem': require('@/assets/mascot/e19-tim-kiem.webp'),
  'e39-ghi-chu': require('@/assets/mascot/e39-ghi-chu.webp'),
  'e42-cham-chu': require('@/assets/mascot/e42-cham-chu.webp'),
};
const STILL: Record<MascotEmote, number> = {
  'e00-nghi': require('@/assets/mascot/e00-nghi.still.webp'),
  'e01-chao': require('@/assets/mascot/e01-chao.still.webp'),
  'e02-suy-nghi': require('@/assets/mascot/e02-suy-nghi.still.webp'),
  'e04-vui-mung': require('@/assets/mascot/e04-vui-mung.still.webp'),
  'e05-co-len': require('@/assets/mascot/e05-co-len.still.webp'),
  'e09-lang-nghe': require('@/assets/mascot/e09-lang-nghe.still.webp'),
  'e10-doc-mau': require('@/assets/mascot/e10-doc-mau.still.webp'),
  'e11-a-ha': require('@/assets/mascot/e11-a-ha.still.webp'),
  'e16-doc-sach': require('@/assets/mascot/e16-doc-sach.still.webp'),
  'e19-tim-kiem': require('@/assets/mascot/e19-tim-kiem.still.webp'),
  'e39-ghi-chu': require('@/assets/mascot/e39-ghi-chu.still.webp'),
  'e42-cham-chu': require('@/assets/mascot/e42-cham-chu.still.webp'),
};
/** Bản 512px cho chỗ hiện to (màn xong bài, kết quả thi). */
const LARGE: Partial<Record<MascotEmote, number>> = {
  'e01-chao': require('@/assets/mascot/e01-chao@512.webp'),
  'e04-vui-mung': require('@/assets/mascot/e04-vui-mung@512.webp'),
  'e05-co-len': require('@/assets/mascot/e05-co-len@512.webp'),
};

/** `.mascot-pop` của web: bật ra từ 60% rồi nảy nhẹ. */
const POP = {
  '0%': { opacity: 0, transform: [{ scale: 0.6 }] },
  '60%': { opacity: 1, transform: [{ scale: 1.08 }] },
  '100%': { opacity: 1, transform: [{ scale: 1 }] },
};

export function Mascot({
  emote,
  size = 96,
  pop = false,
  style,
}: {
  emote: MascotEmote;
  size?: number;
  /** Bật ra khi hiện — đổi `key` ở chỗ gọi để bật lại mỗi lần đổi biểu cảm. */
  pop?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const reduce = useReducedMotion();
  const source = reduce ? STILL[emote] : (size > 128 && LARGE[emote]) || ANIMATED[emote];
  return (
    <Reanimated.View
      style={[
        { width: size, height: size },
        pop && !reduce && { animationName: POP, animationDuration: '420ms', animationTimingFunction: 'ease-out' },
        style,
      ]}>
      <Image source={source} style={styles.fill} contentFit="contain" accessible={false} />
    </Reanimated.View>
  );
}

/** Nhịp từng hình của 3 cử động nút trợ lý (assets/assistant-button/manifest-v10.json ở repo hanni-mascot). */
const CLIPS = {
  blink: { src: require('@/assets/mascot/launcher-blink.webp'), ms: [180, 70, 90, 70, 160, 200] },
  wave: { src: require('@/assets/mascot/launcher-wave.webp'), ms: [160, 120, 160, 160, 120, 180] },
  peek: { src: require('@/assets/mascot/launcher-peek.webp'), ms: [160, 140, 180, 140, 140, 200] },
} as const;
type Clip = keyof typeof CLIPS;
const ORDER: Clip[] = ['blink', 'wave', 'peek', 'blink'];

/**
 * Nút trợ lý = cáo trong bát đỏ (`LauncherFox` của web): đứng yên, 5 giây đầu nháy mắt rồi cứ 12–20 giây làm 1 cử
 * động (nháy mắt → vẫy tay → ló lên), mỗi cử động phát 6 hình 1 lần rồi giữ hình cuối. App ở nền hoặc máy bật giảm
 * chuyển động thì đứng yên. `size` = đường kính nút; ảnh to hơn nút 37% để bát đỏ trùng hình tròn.
 */
export function LauncherFox({ size, onPress, label }: { size: number; onPress: () => void; label: string }) {
  const reduce = useReducedMotion();
  const [clip, setClip] = useState<Clip>('blink');
  const [frame, setFrame] = useState(0);
  const timers = useRef({ next: 0 as unknown as ReturnType<typeof setTimeout>, step: 0 as unknown as ReturnType<typeof setTimeout> });

  useEffect(() => {
    if (reduce) return;
    const t = timers.current;
    let seq = 0;
    let busy = false;
    let active = AppState.currentState === 'active';
    function play(id: Clip) {
      if (busy || !active) return;
      busy = true;
      setClip(id);
      setFrame(0);
      let i = 0;
      const tick = () => {
        i += 1;
        if (i >= 6) {
          busy = false;
          schedule();
          return;
        }
        setFrame(i);
        t.step = setTimeout(tick, CLIPS[id].ms[i]);
      };
      t.step = setTimeout(tick, CLIPS[id].ms[0]);
    }
    function schedule(delay = 12000 + Math.random() * 8000) {
      clearTimeout(t.next);
      if (!active) return;
      t.next = setTimeout(() => play(ORDER[seq++ % ORDER.length]), delay);
    }
    const sub = AppState.addEventListener('change', (state) => {
      active = state === 'active';
      clearTimeout(t.next);
      if (active && !busy) schedule(4500);
    });
    schedule(5000);
    return () => {
      sub.remove();
      clearTimeout(t.next);
      clearTimeout(t.step);
    };
  }, [reduce]);

  const box = Math.round(size / 0.73);
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={{ width: size, height: size }} hitSlop={4}>
      <View
        pointerEvents="none"
        style={[
          styles.launcher,
          { width: box, height: box, left: (size - box) / 2, top: (size - box) / 2 - Math.round(box * 0.085) },
        ]}>
        <Image
          source={CLIPS[clip].src}
          style={{ width: box * 6, height: box, transform: [{ translateX: -frame * box }] }}
          contentFit="fill"
          accessible={false}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: { width: '100%', height: '100%' },
  launcher: { position: 'absolute', overflow: 'hidden' },
});
