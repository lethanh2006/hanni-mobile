import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View, type GestureResponderEvent } from 'react-native';
import Svg, { Line, Path } from 'react-native-svg';

import { AppText, Hanzi, Icon } from '@/components/ui';
import { alpha } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { WEB_ORIGIN } from '@/lib/api';
import { parseTemplates, recognize, type Stroke, type Template } from '@/lib/handwriting';

const SIZE = 256; // cạnh ô viết

let templatesPromise: Promise<Template[]> | null = null;
/** Tệp mẫu (~500 KB) chỉ tải khi mở ô viết tay lần đầu, dùng chung cho cả phiên. */
function loadTemplates(): Promise<Template[]> {
  templatesPromise ??= fetch(`${WEB_ORIGIN}/hanzi-strokes/recog.txt`)
    .then((r) => {
      if (!r.ok) throw new Error(String(r.status));
      return r.text();
    })
    .then(parseTemplates)
    .catch((err: unknown) => {
      templatesPromise = null;
      throw err;
    });
  return templatesPromise;
}

function pathOf(s: Stroke) {
  if (s.length === 1) return `M${s[0][0]},${s[0][1]}L${s[0][0] + 0.1},${s[0][1]}`;
  return s.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join('');
}

/** Nút viền nhỏ dưới ô viết ("Xoá nét cuối", "Viết lại"). */
function PadButton({ label, icon, disabled, onPress }: { label: string; icon: 'refresh' | 'close'; disabled: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.padButton,
        { borderColor: theme.border },
        pressed && { backgroundColor: theme.surface2 },
        disabled && styles.faded,
      ]}>
      <Icon name={icon} size={15} />
      <AppText weight="600">{label}</AppText>
    </Pressable>
  );
}

/**
 * Ô viết tay để tra chữ Hán (`HandwritingPad` của web) — như bút viết tay ở ô tra của Hanzii. Vẽ bằng ngón tay, sau
 * mỗi nét gợi ý 8 chữ giống nhất (`lib/handwriting.ts`, chạy ngay trên máy, không gửi nét đi đâu); bấm một chữ là thêm
 * vào ô tra và xoá ô viết để viết chữ tiếp theo.
 */
export function HandwritingPad({
  onPick,
  onClose,
  title = 'Viết chữ Hán để tra',
  hint = 'Bấm chữ đúng để thêm vào ô tra, rồi bấm nút tra.',
}: {
  onPick: (char: string) => void;
  onClose: () => void;
  /** Mặc định là câu cho ô tra từ điển; phòng thi (HSK 4 đặt câu) truyền câu riêng. */
  title?: string;
  hint?: string;
}) {
  const theme = useTheme();
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [current, setCurrent] = useState<Stroke | null>(null);
  const currentRef = useRef<Stroke | null>(null);
  const [templates, setTemplates] = useState<Template[] | null>(null);
  const [failed, setFailed] = useState(false);
  // Viết xong nét đầu trước khi tệp mẫu tải xong thì nhận dạng ngay khi có mẫu.
  const candidates = templates && strokes.length ? recognize(templates, strokes) : [];

  useEffect(() => {
    loadTemplates().then(setTemplates, () => setFailed(true));
  }, []);

  function point(e: GestureResponderEvent): [number, number] {
    const { locationX, locationY } = e.nativeEvent;
    return [Math.max(0, Math.min(SIZE, locationX)), Math.max(0, Math.min(SIZE, locationY))];
  }

  function pick(char: string) {
    onPick(char);
    setStrokes([]);
  }

  const drawn = current ? [...strokes, current] : strokes;
  const half = SIZE / 2;

  return (
    <View style={[styles.box, { borderColor: theme.border, backgroundColor: theme.surface, boxShadow: `0 1px 2px ${alpha(theme.text, 0.05)}` }]}>
      <View style={styles.head}>
        <AppText weight="600">{title}</AppText>
        <Pressable
          onPress={onClose}
          accessibilityLabel="Đóng ô viết tay"
          style={({ pressed }) => [styles.close, pressed && { backgroundColor: theme.surface2 }]}>
          <Icon name="close" size={17} color="muted" />
        </Pressable>
      </View>
      <View style={styles.body}>
        {/* Nhận cả cử chỉ kéo: trả `true` ở onResponderGrant để khung cuộn bên ngoài không giành mất nét đang viết. */}
        <View
          accessibilityLabel="Ô viết: vẽ chữ Hán bằng ngón tay, từng nét một"
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderTerminationRequest={() => false}
          onResponderGrant={(e) => {
            currentRef.current = [point(e)];
            setCurrent(currentRef.current);
            return true;
          }}
          onResponderMove={(e) => {
            const s = currentRef.current;
            if (!s) return;
            const p = point(e);
            const last = s[s.length - 1];
            if (Math.hypot(p[0] - last[0], p[1] - last[1]) < 2) return;
            currentRef.current = [...s, p];
            setCurrent(currentRef.current);
          }}
          onResponderRelease={() => {
            const s = currentRef.current;
            currentRef.current = null;
            setCurrent(null);
            if (s) setStrokes((list) => [...list, s]);
          }}
          onResponderTerminate={() => {
            currentRef.current = null;
            setCurrent(null);
          }}
          style={[styles.canvas, { borderColor: theme.border, backgroundColor: alpha(theme.surface2, 0.4) }]}>
          {/* Ô chữ mễ (米字格) mờ để căn chữ như vở tập viết. */}
          <Svg width={SIZE} height={SIZE} pointerEvents="none">
            {[
              [half, 0, half, SIZE],
              [0, half, SIZE, half],
              [0, 0, SIZE, SIZE],
              [SIZE, 0, 0, SIZE],
            ].map(([x1, y1, x2, y2], i) => (
              <Line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={theme.border} strokeWidth={1} strokeDasharray="5 5" />
            ))}
            {drawn.map((s, i) => (
              <Path
                key={i}
                d={pathOf(s)}
                fill="none"
                stroke={theme.text}
                strokeWidth={6}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
          </Svg>
        </View>
        <View style={styles.side}>
          <View accessibilityLabel="Chữ gợi ý" style={styles.grid}>
            {Array.from({ length: 8 }, (_, i) => {
              const c = candidates[i];
              return c ? (
                <Pressable
                  key={c}
                  onPress={() => pick(c)}
                  style={({ pressed }) => [
                    styles.cell,
                    { borderColor: pressed ? alpha(theme.primary, 0.5) : theme.border, backgroundColor: pressed ? alpha(theme.primary, 0.05) : theme.surface },
                  ]}>
                  <Hanzi size={30}>{c}</Hanzi>
                </Pressable>
              ) : (
                <View key={i} style={[styles.cell, styles.empty, { borderColor: theme.border }]} />
              );
            })}
          </View>
          <AppText variant="caption" color="muted" style={styles.hint}>
            {failed
              ? 'Chưa tải được dữ liệu nhận dạng — kiểm tra mạng rồi mở lại.'
              : !templates && strokes.length
                ? 'Đang tải dữ liệu nhận dạng…'
                : `Viết từng nét theo thứ tự, mỗi lần một chữ. ${hint}`}
          </AppText>
          <View style={styles.actions}>
            <PadButton label="Xoá nét cuối" icon="refresh" disabled={!strokes.length} onPress={() => setStrokes((s) => s.slice(0, -1))} />
            <PadButton label="Viết lại" icon="close" disabled={!strokes.length} onPress={() => setStrokes([])} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { marginTop: 12, borderWidth: 1, borderRadius: 16, padding: 12 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  close: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  body: { marginTop: 8, alignItems: 'center', gap: 12 },
  canvas: { width: SIZE + 2, height: SIZE + 2, borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
  side: { alignSelf: 'stretch', gap: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cell: {
    width: '22.5%',
    flexGrow: 1,
    height: 56,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: { borderStyle: 'dashed' },
  hint: { lineHeight: 20 },
  actions: { flexDirection: 'row', gap: 8 },
  padButton: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  faded: { opacity: 0.5 },
});
