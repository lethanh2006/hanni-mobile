import Storage from 'expo-sqlite/kv-store';
import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Line, Path } from 'react-native-svg';

import { AppText, Icon, Mascot } from '@/components/ui';
import { ToneColors, type ThemeColor } from '@/constants/theme';
import { stopListening } from '@/features/mock-exam/listening';
import { TONES } from '@/features/practice/pinyin-data';
import { useTheme } from '@/hooks/use-theme';
import { mediaUrl } from '@/lib/api';
import { playRecording, playWord } from '@/lib/audio';
import {
  guessTone,
  POINTS,
  resampleTo16k,
  scoreSyllables,
  surfaceTones,
  syllableContours,
  toneTemplate,
  type SyllableContour,
  type Tone,
} from '@/lib/pitch';

import { decodeAudioUrl } from './decode-audio';
import { RecorderError, useVoiceRecorder, type VoiceRecording } from './voice-recorder';

/** Khoá "đã thử chấm phát âm" cho thẻ "Bắt đầu với Hanni" — chấm chạy trên máy nên server không biết. */
export const TONE_TRIED_KEY = 'hanni:tone-tried';

export function markToneTried() {
  try {
    Storage.setItemSync(TONE_TRIED_KEY, '1');
  } catch {
    // bỏ qua
  }
}

/** Chấm được khi pinyin số tách được từng âm tiết (bỏ 有（一）点儿 "youyidianr"…), tối đa 4. */
export function canToneCheck(pinyinNumeric: string): boolean {
  const syl = pinyinNumeric.trim().split(/\s+/);
  return syl.length <= 4 && syl.every((s) => /^[a-zü:]+[1-5]$/i.test(s));
}

export interface ToneResult {
  user: SyllableContour[];
  ref: ((number | null)[] | null)[];
  hasNative: boolean;
  tones: Tone[];
  scores: (number | null)[];
  guesses: (Tone | null)[];
  overall: number | null;
}

const nativeCache = new Map<string, Promise<SyllableContour[] | null>>();
function nativeContours(url: string | null, n: number): Promise<SyllableContour[] | null> {
  if (!url) return Promise.resolve(null);
  const key = `${url}#${n}`;
  if (!nativeCache.has(key))
    nativeCache.set(
      key,
      decodeAudioUrl(url)
        .then(({ x, sr }) => {
          const a = resampleTo16k(x, sr);
          return syllableContours(a.x, a.sr, n);
        })
        .catch(() => {
          nativeCache.delete(key);
          return null;
        }),
    );
  return nativeCache.get(key)!;
}

/** Chấm 1 bản ghi (mẫu PCM) so với ghi âm chuẩn của từ — `analyze` của web. `null` = không nghe ra giọng. */
export async function analyzeVoice(
  voice: { x: Float32Array; sr: number },
  hanzi: string,
  pinyinNumeric: string,
  audioUrl: string | null,
): Promise<ToneResult | null> {
  const n = pinyinNumeric.trim().split(/\s+/).length;
  const native = await nativeContours(mediaUrl(audioUrl), n);
  // Cho giao diện kịp vẽ "Đang chấm…" trước khi dò cao độ (chạy đồng bộ ~vài trăm ms trên máy).
  await new Promise((r) => setTimeout(r, 16));
  const a = resampleTo16k(voice.x, voice.sr);
  const user = syllableContours(a.x, a.sr, n);
  if (!user || user.every((s) => !s.st)) return null;
  const tones = surfaceTones(hanzi, pinyinNumeric);
  const scores = scoreSyllables(user, native, tones);
  const known = scores.filter((s): s is number => s !== null);
  return {
    user,
    ref: native ? native.map((s) => s.st) : tones.map((t) => toneTemplate(t)),
    hasNative: !!native,
    tones,
    scores,
    guesses: user.map((s, i) => (s.st && tones[i] !== 5 ? guessTone(s.st) : null)),
    overall: known.length ? Math.round(known.reduce((x, y) => x + y, 0) / known.length) : null,
  };
}

function verdict(score: number | null): { label: string; color: ThemeColor } {
  if (score === null) return { label: 'Chưa chấm được', color: 'muted' };
  if (score >= 85) return { label: 'Chuẩn rồi!', color: 'good' };
  if (score >= 65) return { label: 'Khá ổn', color: 'accent' };
  return { label: 'Cần luyện thêm', color: 'danger' };
}

function syllableNote(tone: Tone, written: Tone, score: number | null, guess: Tone | null): string {
  if (tone === 5) return 'Thanh nhẹ — đọc ngắn và nhẹ.';
  // 你好: viết nǐ (thanh 3) nhưng đọc thanh 2 — nói rõ, kẻo người học tưởng chấm nhầm.
  const sandhi = written !== tone ? `Biến điệu: viết thanh ${written}, đọc thành thanh ${tone}. ` : '';
  if (score === null) return `${sandhi}Chưa nghe rõ âm tiết này.`;
  const t = TONES[tone - 1];
  if (score >= 75) return `${sandhi}Đúng thanh ${tone}.`;
  if (guess && guess !== tone) return `${sandhi}Nghe giống thanh ${guess}. ${t.name}: ${t.desc} ${t.vi}`;
  return `${sandhi}Gần đúng — ${t.desc.charAt(0).toLowerCase()}${t.desc.slice(1)}`;
}

/** Biểu đồ đường cao độ: giọng chuẩn (nét đứt, xám) và giọng bạn (đỏ), mỗi âm tiết 1 ô. */
function ToneChart({ result, labels }: { result: ToneResult; labels: string[] }) {
  const theme = useTheme();
  const n = result.user.length;
  const W = 300 * n;
  const H = 150;
  const PAD = 14;
  const values = [...result.user.flatMap((s) => s.st ?? []), ...result.ref.flatMap((r) => r ?? [])].filter((v): v is number => v !== null);
  let lo = Math.min(...values, -4);
  let hi = Math.max(...values, 4);
  const mid = (lo + hi) / 2;
  if (hi - lo < 10) [lo, hi] = [mid - 5, mid + 5];
  const y = (v: number) => PAD + ((hi - v) / (hi - lo)) * (H - 2 * PAD);
  const slot = W / n;
  const path = (pts: (number | null)[] | null, i: number) => {
    if (!pts) return '';
    let d = '';
    let pen = false;
    pts.forEach((v, k) => {
      if (v === null) {
        pen = false;
        return;
      }
      const x = i * slot + 18 + (k / (POINTS - 1)) * (slot - 36);
      d += `${pen ? 'L' : 'M'}${x.toFixed(1)},${y(v).toFixed(1)}`;
      pen = true;
    });
    return d;
  };
  return (
    <View style={styles.chart}>
      <Svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ aspectRatio: W / H }} accessibilityLabel="Đường cao độ giọng chuẩn và giọng bạn theo từng âm tiết">
        {Array.from({ length: n - 1 }, (_, i) => (
          <Line key={i} x1={(i + 1) * slot} x2={(i + 1) * slot} y1={6} y2={H - 6} stroke={theme.border} strokeDasharray="3 4" />
        ))}
        <Line x1={0} x2={W} y1={y(0)} y2={y(0)} stroke={theme.border} />
        {result.ref.map((r, i) => (
          <Path
            key={`r${i}`}
            d={path(r, i)}
            fill="none"
            stroke={theme.muted}
            strokeWidth={2.5}
            strokeDasharray="6 5"
            strokeLinecap="round"
            opacity={0.75}
          />
        ))}
        {result.user.map((u, i) => (
          <Path key={`u${i}`} d={path(u.st, i)} fill="none" stroke={theme.primary} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        ))}
      </Svg>
      <View style={styles.labels}>
        {labels.map((l, i) => (
          <AppText key={i} weight="600" center style={[styles.flex, { color: ToneColors[String(result.tones[i])] ?? theme.muted }]}>
            {l}
          </AppText>
        ))}
      </View>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <Svg width={22} height={6}>
            <Line x1={1} x2={21} y1={3} y2={3} stroke={theme.muted} strokeWidth={2.5} strokeDasharray="6 5" />
          </Svg>
          <AppText variant="caption" color="muted">
            {result.hasNative ? 'Giọng chuẩn' : 'Hình mẫu của thanh'}
          </AppText>
        </View>
        <View style={styles.legendItem}>
          <Svg width={22} height={6}>
            <Line x1={1} x2={21} y1={3} y2={3} stroke={theme.primary} strokeWidth={3} />
          </Svg>
          <AppText variant="caption" color="muted">
            Giọng bạn
          </AppText>
        </View>
        <AppText variant="caption" color="muted">
          · càng cao trên hình là giọng càng cao
        </AppText>
      </View>
    </View>
  );
}

function SmallButton({ icon, label, onPress }: { icon: 'sound' | 'play'; label: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable onPress={onPress} style={[styles.small, { backgroundColor: theme.surface2 }]}>
      {({ pressed }) => (
        <>
          <Icon name={icon} size={14} color={pressed ? 'primary' : 'text'} />
          <AppText variant="caption" weight="600" color={pressed ? 'primary' : 'text'}>
            {label}
          </AppText>
        </>
      )}
    </Pressable>
  );
}

/** Kết quả chấm 1 bản ghi (dùng chung cho nút "Đọc thử" và màn luyện phát âm) — `ToneResultView` của web. */
export function ToneResultView({
  result,
  pinyin,
  pinyinNumeric,
  audioUrl,
  recordingUri,
}: {
  result: ToneResult;
  pinyin: string;
  pinyinNumeric: string;
  audioUrl: string | null;
  recordingUri: string | null;
}) {
  const theme = useTheme();
  const [playError, setPlayError] = useState('');
  const parts = pinyin.trim().split(/\s+/);
  const numeric = pinyinNumeric.trim().split(/\s+/);
  const labels = parts.length === result.user.length ? parts : numeric;
  const written = numeric.map((s) => Number(/[1-5]$/.exec(s)?.[0] ?? 5) as Tone);
  const v = verdict(result.overall);
  return (
    <View style={[styles.result, { borderColor: theme.border, backgroundColor: theme.surface }]}>
      <View style={styles.resultHead}>
        <AppText weight="600">Chấm thanh điệu</AppText>
        <View style={styles.score}>
          {result.overall !== null && <AppText style={styles.overall}>{result.overall}</AppText>}
          <AppText weight="600" color={v.color}>
            {v.label}
          </AppText>
        </View>
      </View>
      <ToneChart result={result} labels={labels} />
      <View style={styles.notes}>
        {result.tones.map((t, i) => (
          <View key={i} style={styles.note}>
            <AppText weight="600" style={[styles.noteLabel, { color: ToneColors[String(t)] ?? theme.muted }]}>
              {labels[i]}
            </AppText>
            <AppText color="muted" style={styles.noteText}>
              {syllableNote(t, written[i] ?? t, result.scores[i], result.guesses[i])}
            </AppText>
            {result.scores[i] !== null && <AppText weight="600">{result.scores[i]}</AppText>}
          </View>
        ))}
      </View>
      {playError ? <AppText color="danger" variant="caption">{playError}</AppText> : null}
      <View style={styles.actions}>
        {audioUrl && <SmallButton icon="sound" label="Nghe mẫu" onPress={() => { setPlayError(''); playWord(audioUrl, () => setPlayError('Không phát được âm mẫu. Hãy kiểm tra kết nối và âm lượng.')); }} />}
        {recordingUri && <SmallButton icon="play" label="Nghe lại giọng bạn" onPress={() => { setPlayError(''); playRecording(recordingUri, () => setPlayError('Không phát được bản ghi. Hãy kiểm tra âm lượng rồi thử ghi lại.')); }} />}
      </View>
    </View>
  );
}

/** Chấm bản ghi có sẵn (màn luyện phát âm tự ghi âm, ở đây chỉ phân tích) — `ToneAnalysis` của web. */
export function ToneAnalysis({
  voice,
  hanzi,
  pinyin,
  pinyinNumeric,
  audioUrl,
}: {
  voice: VoiceRecording;
  hanzi: string;
  pinyin: string;
  pinyinNumeric: string;
  audioUrl: string | null;
}) {
  const [state, setState] = useState<{ voice: VoiceRecording; result: ToneResult | null } | null>(null);
  useEffect(() => {
    if (!canToneCheck(pinyinNumeric)) return;
    let alive = true;
    analyzeVoice(voice, hanzi, pinyinNumeric, audioUrl)
      .then((result) => alive && setState({ voice, result }))
      .catch(() => alive && setState({ voice, result: null }));
    return () => {
      alive = false;
    };
  }, [voice, hanzi, pinyinNumeric, audioUrl]);
  if (!canToneCheck(pinyinNumeric)) return null;
  if (!state || state.voice !== voice)
    return (
      <AppText variant="caption" color="muted">
        Đang chấm thanh điệu…
      </AppText>
    );
  if (!state.result)
    return (
      <AppText variant="caption" color="muted">
        Chưa nghe rõ giọng để chấm thanh điệu — nói to, gần micro hơn nhé.
      </AppText>
    );
  return <ToneResultView result={state.result} pinyin={pinyin} pinyinNumeric={pinyinNumeric} audioUrl={audioUrl} recordingUri={voice.uri} />;
}

type Phase = 'idle' | 'recording' | 'analyzing' | 'done' | 'error';

/**
 * "Đọc thử" (`ToneCheck` của web) — ghi âm 1 từ, tự dừng khi nói xong, vẽ đường cao độ giọng bạn chồng lên giọng chuẩn
 * và chấm từng âm tiết (`lib/pitch.ts`). Phân tích ngay trên máy: giọng không gửi đi đâu, không cần tài khoản, không
 * tốn lượt AI.
 */
export function ToneCheck({
  hanzi,
  pinyin,
  pinyinNumeric,
  audioUrl,
  align = 'center',
}: {
  hanzi: string;
  pinyin: string;
  pinyinNumeric: string;
  audioUrl: string | null;
  align?: 'center' | 'start';
}) {
  const theme = useTheme();
  const recorder = useVoiceRecorder();
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState('');
  const [result, setResult] = useState<ToneResult | null>(null);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [meter] = useState(() => new Animated.Value(0));
  const stopping = useRef(false);
  const recorderRef = useRef(recorder);
  useEffect(() => {
    recorderRef.current = recorder;
  });
  useEffect(() => () => recorderRef.current.cancel(), []);

  if (!canToneCheck(pinyinNumeric)) return null;
  const n = pinyinNumeric.trim().split(/\s+/).length;
  const center = align === 'center';

  async function finish() {
    if (stopping.current) return;
    stopping.current = true;
    const voice = await recorder.stop();
    if (!voice) {
      setPhase('error');
      setError('Chưa thu được âm thanh. Kiểm tra micro rồi thử lại.');
      return;
    }
    setRecordingUri(voice.uri);
    setPhase('analyzing');
    try {
      const r = await analyzeVoice(voice, hanzi, pinyinNumeric, audioUrl);
      if (!r) {
        setPhase('error');
        setError('Chưa nghe rõ giọng — nói to, rõ và gần micro hơn nhé.');
        return;
      }
      setResult(r);
      setPhase('done');
      markToneTried();
    } catch {
      setPhase('error');
      setError('Chưa chấm được bản ghi này, thử đọc lại nhé.');
    }
  }

  async function start() {
    if (phase === 'recording') {
      void finish();
      return;
    }
    setError('');
    stopListening();
    // Tự dừng: đo ồn nền 150 ms đầu, nói to hơn hẳn mức đó là "đang nói", lặng 0,7 giây sau khi đã nói là xong.
    const maxMs = Math.min(6000, 1600 + 700 * n);
    let noise = 0;
    let spoke = false;
    let quietSince = 0;
    stopping.current = false;
    try {
      await recorder.start((rms, now) => {
        if (stopping.current) return;
        if (now < 150) noise = Math.max(noise, rms);
        const speech = Math.max(0.015, noise * 3);
        meter.setValue(Math.min(1, rms / (speech * 3)));
        if (rms > speech) {
          spoke = true;
          quietSince = 0;
        } else if (spoke && !quietSince) quietSince = now;
        if ((spoke && quietSince && now - quietSince > 700) || now > maxMs) void finish();
      });
    } catch (err) {
      setPhase('error');
      setError(err instanceof RecorderError ? err.message : 'Không mở được micro. Kiểm tra thiết bị rồi thử lại.');
      return;
    }
    setResult(null);
    meter.setValue(0);
    setPhase('recording');
  }

  const recording = phase === 'recording';
  return (
    <View style={styles.wrap}>
      <View style={[styles.row, center && styles.center]}>
        {/* Đang thu âm: cáo khum tay sau tai (E09) — margin âm để không đẩy nội dung bên dưới. */}
        {recording && <Mascot emote="e09-lang-nghe" size={52} pop style={styles.fox} />}
        <Pressable
          onPress={() => void start()}
          disabled={phase === 'analyzing'}
          accessibilityState={{ selected: recording }}
          style={({ pressed }) => [
            styles.button,
            center && styles.center,
            recording
              ? { backgroundColor: theme.primary, borderColor: theme.primary }
              : { backgroundColor: theme.surface, borderColor: pressed ? theme.primary : theme.border },
            phase === 'analyzing' && styles.faded,
            pressed && { transform: [{ translateY: 1 }] },
          ]}>
          <Icon name="mic" size={17} color={recording ? 'primaryText' : 'text'} />
          <AppText weight="600" color={recording ? 'primaryText' : 'text'}>
            {recording ? 'Đang nghe… (bấm để dừng)' : phase === 'analyzing' ? 'Đang chấm…' : result ? 'Đọc lại' : 'Đọc thử — chấm thanh điệu'}
          </AppText>
        </Pressable>
      </View>
      {recording && (
        <View style={[styles.meter, center && styles.center, { backgroundColor: theme.surface2 }]}>
          <Animated.View
            style={[
              styles.meterFill,
              {
                backgroundColor: theme.primary,
                width: meter.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
              },
            ]}
          />
        </View>
      )}
      {phase === 'error' && (
        <AppText variant="caption" color="danger" center={center} style={styles.hint}>
          {error}
        </AppText>
      )}
      {result && !recording && (
        <View style={styles.resultWrap}>
          <ToneResultView result={result} pinyin={pinyin} pinyinNumeric={pinyinNumeric} audioUrl={audioUrl} recordingUri={recordingUri} />
        </View>
      )}
      {phase === 'idle' && !result && (
        <AppText variant="caption" color="muted" center={center} style={styles.idle}>
          Giọng bạn được phân tích ngay trên máy, không gửi đi đâu.
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  wrap: { width: '100%' },
  center: { alignSelf: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 4 },
  fox: { marginVertical: -6 },
  faded: { opacity: 0.6 },
  button: {
    alignSelf: 'flex-start',
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  meter: { marginTop: 8, height: 6, width: 160, borderRadius: 999, overflow: 'hidden' },
  meterFill: { height: '100%', borderRadius: 999 },
  hint: { marginTop: 8 },
  idle: { marginTop: 6 },
  resultWrap: { marginTop: 12 },
  result: { borderWidth: 1, borderRadius: 16, padding: 16 },
  resultHead: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', columnGap: 12, rowGap: 4 },
  score: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  overall: { fontSize: 24, lineHeight: 32, fontWeight: '700' },
  chart: { marginTop: 12 },
  labels: { flexDirection: 'row' },
  legend: { marginTop: 8, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', columnGap: 16, rowGap: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  notes: { marginTop: 12, gap: 6 },
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  noteLabel: { width: 56, lineHeight: 24 },
  noteText: { flex: 1, minWidth: 0, lineHeight: 24 },
  actions: { marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  small: { minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 12, paddingHorizontal: 12 },
});
