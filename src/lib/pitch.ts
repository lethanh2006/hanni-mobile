/**
 * Chấm thanh điệu — chép từ `lib/pitch.ts` của hanni-client (sửa thuật toán thì sửa cả 2 bên cho điểm giống nhau), chỉ
 * khác phần giải mã âm thanh: web giải mã bằng OfflineAudioContext, app lấy mẫu PCM thẳng từ micro
 * (`features/tone/voice-recorder`) và giải mã ghi âm chuẩn bằng `features/tone/decode-audio`.
 *
 * Dò cao độ (F0) giọng người học bằng thuật toán YIN (de Cheveigné & Kawahara 2002), chia âm tiết, rồi so đường cao độ
 * với ghi âm chuẩn của chính từ đó (~10,9 nghìn file ở `/media/audio`). Chạy hết trên máy — không gửi giọng đi đâu,
 * không tốn lượt AI.
 *
 * So theo NỬA CUNG (semitone) tính từ cao độ trung vị của từng người, nên giọng nam so với giọng nữ vẫn công bằng;
 * chênh lệch tổng thể (đọc cao/thấp hơn cả từ) cũng được bỏ qua — chỉ chấm HÌNH DẠNG đường lên xuống, đúng thứ làm nên
 * thanh điệu.
 */

/** Phân tích ở 16 kHz — đủ cho giọng nói, YIN nhanh gấp ~3 lần so với 48 kHz. */
export const SAMPLE_RATE = 16000;
const MIN_F0 = 70;
const MAX_F0 = 450;
const YIN_THRESHOLD = 0.2;
/** Khung "có giọng" chỉ khi năng lượng ≥ tỉ lệ này của khung mạnh nhất (đuôi thanh 4
 * nhỏ dần, ngưỡng 12% từng cắt mất nửa sau của 卖/骂); khung yếu phải tuần hoàn rõ hơn. */
const VOICED_RMS_RATIO = 0.04;
const STRONG_RMS_RATIO = 0.12;
const MIN_RUN_FRAMES = 5;
/** Số điểm mỗi âm tiết sau khi chuẩn hoá thời gian. */
export const POINTS = 24;

export type Tone = 1 | 2 | 3 | 4 | 5;

export interface PitchFrame {
  t: number;
  f0: number | null;
  rms: number;
  /** độ không tuần hoàn của YIN (thấp = giọng rõ); không tính cho khung quá yếu */
  ap?: number;
}

export interface SyllableContour {
  /** cao độ (nửa cung so với trung vị cả từ), POINTS điểm theo thời gian (null = khe không
   * dò được); cả mảng null nếu âm tiết gần như không có giọng */
  st: (number | null)[] | null;
}

/** Đưa mẫu về 16 kHz (web giải mã thẳng ra 16 kHz bằng OfflineAudioContext; micro của máy thường thu 44,1–48 kHz):
 * lọc trung bình trượt chống răng cưa rồi lấy mẫu lại tuyến tính — đủ cho cao độ giọng nói (≤ 450 Hz). */
export function resampleTo16k(x: Float32Array, sr: number): { x: Float32Array; sr: number } {
  if (sr <= SAMPLE_RATE) return { x, sr };
  const ratio = sr / SAMPLE_RATE;
  const win = Math.max(1, Math.round(ratio));
  const smooth = new Float32Array(x.length);
  let acc = 0;
  for (let i = 0; i < x.length; i++) {
    acc += x[i];
    if (i >= win) acc -= x[i - win];
    smooth[i] = acc / Math.min(i + 1, win);
  }
  const out = new Float32Array(Math.floor(x.length / ratio));
  for (let i = 0; i < out.length; i++) {
    const p = i * ratio;
    const k = Math.floor(p);
    const t = p - k;
    out[i] = smooth[k] * (1 - t) + (smooth[Math.min(k + 1, smooth.length - 1)] ?? 0) * t;
  }
  return { x: out, sr: SAMPLE_RATE };
}

/** YIN cho 1 khung: trả chu kỳ (mẫu, có nội suy) và độ "không tuần hoàn" (thấp = rõ giọng). */
function yinFrame(
  x: Float32Array,
  start: number,
  w: number,
  minLag: number,
  maxLag: number,
  d: Float32Array,
): { tau: number; ap: number } {
  for (let tau = 1; tau <= maxLag; tau++) {
    let sum = 0;
    for (let j = 0; j < w; j++) {
      const diff = x[start + j] - x[start + j + tau];
      sum += diff * diff;
    }
    d[tau] = sum;
  }
  let running = 0;
  d[0] = 1;
  for (let tau = 1; tau <= maxLag; tau++) {
    running += d[tau];
    d[tau] = running > 0 ? (d[tau] * tau) / running : 1;
  }
  let tau = -1;
  for (let t = minLag; t <= maxLag; t++) {
    if (d[t] < YIN_THRESHOLD) {
      while (t + 1 <= maxLag && d[t + 1] < d[t]) t++;
      tau = t;
      break;
    }
  }
  if (tau === -1) {
    tau = minLag;
    for (let t = minLag + 1; t <= maxLag; t++) if (d[t] < d[tau]) tau = t;
  }
  // Lỗi hạ quãng tám kinh điển của YIN: chu kỳ gấp đôi cũng "tuần hoàn". Có đáy gần
  // như tốt ở tau/2 (hoặc tau/3) thì lấy đáy đó.
  for (const k of [3, 2]) {
    const c = Math.round(tau / k);
    if (c < minLag) continue;
    let best = c;
    for (let t = Math.max(minLag, c - 2); t <= Math.min(maxLag, c + 2); t++) if (d[t] < d[best]) best = t;
    if (d[best] < d[tau] + 0.08 && d[best] < 0.35) {
      tau = best;
      break;
    }
  }
  const ap = d[tau];
  if (tau > 1 && tau < maxLag) {
    const s0 = d[tau - 1];
    const s1 = d[tau];
    const s2 = d[tau + 1];
    const denom = s0 + s2 - 2 * s1;
    if (denom !== 0) return { tau: tau + (s0 - s2) / (2 * denom), ap };
  }
  return { tau, ap };
}

/** Tìm đáy YIN quanh cao độ khung kề bên (`near` Hz, ±1,5 nửa cung — giọng thật trong 10 ms
 * hiếm khi đổi hơn; nới tới 28% thì đuôi rè của 骂 bị kéo tuột xuống 80 Hz) — dùng
 * cho giọng rè (creaky voice) ở cuối thanh 4 và đáy thanh 3: tuần hoàn kém nên ngưỡng cố
 * định bỏ trắng, mất đúng phần đặc trưng nhất của thanh. Gọi SAU `yinFrame` (dùng lại `d`). */
function guidedTau(d: Float32Array, sr: number, near: number, minLag: number, maxLag: number, limit: number): number | null {
  const lo = Math.max(minLag, Math.floor(sr / (near * 1.09)));
  const hi = Math.min(maxLag - 1, Math.ceil(sr / (near * 0.917)));
  let best = -1;
  for (let t = Math.max(lo, 2); t <= hi; t++) {
    if (d[t] < d[t - 1] && d[t] <= d[t + 1] && (best === -1 || d[t] < d[best])) best = t;
  }
  return best !== -1 && d[best] < limit ? best : null;
}

/** Cao độ từng khung 10 ms (khung 25 ms). Khung yếu (lặng/ồn nền) bỏ qua, khỏi tính YIN. */
export function trackPitch(x: Float32Array, sr: number): PitchFrame[] {
  const w = Math.round(0.025 * sr);
  const hop = Math.round(0.01 * sr);
  const minLag = Math.floor(sr / MAX_F0);
  const maxLag = Math.ceil(sr / MIN_F0);
  const frames: PitchFrame[] = [];
  for (let start = 0; start + w + maxLag + 1 < x.length; start += hop) {
    let e = 0;
    for (let j = 0; j < w; j++) e += x[start + j] * x[start + j];
    frames.push({ t: (start + w / 2) / sr, f0: null, rms: Math.sqrt(e / w) });
  }
  let maxRms = 0;
  for (const f of frames) if (f.rms > maxRms) maxRms = f.rms;
  const floor = Math.max(0.003, maxRms * VOICED_RMS_RATIO);
  const strong = maxRms * STRONG_RMS_RATIO;
  const d = new Float32Array(maxLag + 2);
  frames.forEach((f, i) => {
    if (f.rms < floor) return;
    const r = yinFrame(x, i * hop, w, minLag, maxLag, d);
    f.ap = r.ap;
    if (r.ap < (f.rms >= strong ? 0.3 : 0.18)) f.f0 = sr / r.tau;
  });
  // Đi tiếp vào đoạn rè: sau khung đã có cao độ (về sau tới 0,8; về trước chặt hơn 0,5 vì
  // trước nguyên âm thường là phụ âm xát s/x/sh — ồn chứ không phải giọng).
  const extend = (i: number, from: number, limit: number) => {
    const f = frames[i];
    const near = frames[from].f0;
    if (f.f0 !== null || near === null || f.rms < strong * 0.5 || f.ap === undefined) return;
    yinFrame(x, i * hop, w, minLag, maxLag, d);
    const tau = guidedTau(d, sr, near, minLag, maxLag, limit);
    if (tau !== null) f.f0 = sr / tau;
  };
  for (let i = 1; i < frames.length; i++) extend(i, i - 1, 0.75);
  for (let i = frames.length - 2; i >= 0; i--) extend(i, i + 1, 0.5);
  return frames;
}

function median(values: number[]): number {
  const s = [...values].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/** Các đoạn liền có giọng [from, to) — lấp khe ≤ 3 khung, bỏ đoạn < 50 ms. */
function voicedRuns(f0: (number | null)[]): [number, number][] {
  const runs: [number, number][] = [];
  let i = 0;
  while (i < f0.length) {
    if (f0[i] === null) {
      i++;
      continue;
    }
    let j = i;
    let gap = 0;
    let end = i;
    while (j < f0.length && gap <= 3) {
      if (f0[j] === null) gap++;
      else {
        gap = 0;
        end = j + 1;
      }
      j++;
    }
    if (end - i >= MIN_RUN_FRAMES) runs.push([i, end]);
    i = end + 1;
  }
  return runs;
}

/** Sửa lỗi nhảy quãng tám THEO KHUNG LIỀN TRƯỚC (không theo trung vị cả từ: thanh 4
 * thật có thể rơi trọn 1 quãng tám, 汉 từ 385 xuống 197 Hz), lọc trung vị 5 khung, đổi
 * sang nửa cung quanh trung vị. */
function cleanSemitones(frames: PitchFrame[]): { st: (number | null)[]; rms: number[] } {
  const raw = frames.map((f) => f.f0);
  if (!raw.some((v) => v !== null)) return { st: raw.map(() => null), rms: frames.map((f) => f.rms) };
  const fixed = [...raw];
  // Mốc chung: trung vị các khung CHẮC (to, tuần hoàn rõ). Đoạn nào lệch mốc quá 0,75 quãng
  // tám thì cả đoạn là lỗi quãng tám (đáy rè của 马 dò thành 89 Hz thay vì ~178 Hz).
  let maxRms = 0;
  for (const f of frames) if (f.rms > maxRms) maxRms = f.rms;
  const sure = frames.filter((f) => f.f0 !== null && (f.ap ?? 1) < 0.15 && f.rms >= maxRms * STRONG_RMS_RATIO);
  const globalRef = median((sure.length ? sure : frames).map((f) => f.f0).filter((v): v is number => v !== null));
  for (const [a, b] of voicedRuns(raw)) {
    // Mốc đoạn: trung vị vài khung giữa đoạn — ổn định hơn khung đầu (lúc vào giọng).
    const mid = raw.slice(a + Math.floor((b - a) * 0.3), a + Math.ceil((b - a) * 0.7)).filter((v): v is number => v !== null);
    let prev = mid.length ? median(mid) : null;
    if (prev !== null) {
      const oct = Math.log2(prev / globalRef);
      if (oct < -0.75) prev *= 2;
      else if (oct > 0.75) prev /= 2;
    }
    const pass = (i: number) => {
      const v = raw[i];
      if (v === null || prev === null) return;
      const best = [v, v / 2, v * 2].reduce((x, y) => (Math.abs(Math.log2(y / prev!)) < Math.abs(Math.log2(x / prev!)) ? y : x));
      fixed[i] = Math.abs(Math.log2(best / prev)) < 0.5 ? best : v;
      prev = fixed[i];
    };
    const center = a + Math.floor((b - a) / 2);
    for (let i = center; i < b; i++) pass(i);
    prev = fixed[center] ?? prev;
    for (let i = center - 1; i >= a; i--) pass(i);
  }
  const smooth = fixed.map((v, i) => {
    if (v === null) return null;
    const win: number[] = [];
    for (let k = i - 2; k <= i + 2; k++) {
      const u = fixed[k];
      if (u !== null && u !== undefined) win.push(u);
    }
    return median(win);
  });
  const ref = median(smooth.filter((v): v is number => v !== null));
  return {
    st: smooth.map((v) => (v === null ? null : 12 * Math.log2(v / ref))),
    rms: frames.map((f) => f.rms),
  };
}

/** Chia phần có giọng thành `n` âm tiết: theo khe lặng (phụ âm vô thanh như h, sh, j,
 * x…), thiếu thì cắt ở chỗ năng lượng trũng nhất, không có thì chia đều. */
function splitSyllables(st: (number | null)[], rms: number[], n: number): [number, number][] {
  let runs = voicedRuns(st);
  if (runs.length === 0) return [];
  // Bỏ mẩu rất ngắn (tiếng động) khi còn dư đoạn.
  const total = runs.reduce((s, [a, b]) => s + b - a, 0);
  while (runs.length > n) {
    const tiny = runs.findIndex(([a, b]) => b - a < total * 0.12);
    if (tiny === -1) break;
    runs.splice(tiny, 1);
  }
  // Còn dư: gộp 2 đoạn có khe nhỏ nhất.
  while (runs.length > n) {
    let best = 0;
    for (let k = 1; k < runs.length - 1; k++)
      if (runs[k + 1][0] - runs[k][1] < runs[best + 1][0] - runs[best][1]) best = k;
    runs = [...runs.slice(0, best), [runs[best][0], runs[best + 1][1]], ...runs.slice(best + 2)];
  }
  // Thiếu: cắt đoạn dài nhất ở chỗ năng lượng trũng nhất (tránh 20% hai đầu).
  while (runs.length < n) {
    let longest = 0;
    for (let k = 1; k < runs.length; k++)
      if (runs[k][1] - runs[k][0] > runs[longest][1] - runs[longest][0]) longest = k;
    const [a, b] = runs[longest];
    const len = b - a;
    if (len < MIN_RUN_FRAMES * 2) break;
    let cut = a + Math.round(len / 2);
    let low = Infinity;
    for (let i = a + Math.round(len * 0.2); i < b - Math.round(len * 0.2); i++) {
      const e = (rms[i - 1] + rms[i] + rms[i + 1]) / 3;
      if (e < low) {
        low = e;
        cut = i;
      }
    }
    runs = [...runs.slice(0, longest), [a, cut], [cut, b], ...runs.slice(longest + 1)];
  }
  return runs;
}

/** Lấy mẫu lại 1 âm tiết về POINTS điểm THEO THỜI GIAN (bỏ 10% hai đầu — lúc vào/ra giọng
 * hay lệch). Khe ngắn (≤ 4 khung) nội suy; khe dài để `null` — dồn các điểm có giọng lại sát
 * nhau thì đáy rè của thanh 3 biến mất, đường võng thành đường thẳng. */
function resample(st: (number | null)[], a: number, b: number): (number | null)[] {
  const trim = Math.floor((b - a) * 0.1);
  const from = a + trim;
  const to = b - 1 - trim;
  return Array.from({ length: POINTS }, (_, i) => {
    const pos = from + (i / (POINTS - 1)) * (to - from);
    let lo = Math.floor(pos);
    let hi = Math.ceil(pos);
    while (lo >= from && st[lo] === null && pos - lo <= 4) lo--;
    while (hi <= to && st[hi] === null && hi - pos <= 4) hi++;
    const l = st[lo];
    const h = st[hi];
    if (lo < from || hi > to || l === null || h === null || l === undefined || h === undefined) return null;
    return hi === lo ? l : l + ((h - l) * (pos - lo)) / (hi - lo);
  });
}

/** Đường cao độ theo từng âm tiết. Trả `null` nếu không nghe ra giọng. */
export function syllableContours(x: Float32Array, sr: number, n: number): SyllableContour[] | null {
  const { st, rms } = cleanSemitones(trackPitch(x, sr));
  const parts = splitSyllables(st, rms, n);
  if (parts.length === 0) return null;
  const out: SyllableContour[] = parts.map(([a, b]) => {
    const c = resample(st, a, b);
    return { st: c.filter((v) => v !== null).length >= POINTS / 2 ? c : null };
  });
  while (out.length < n) out.push({ st: null });
  return out;
}

/** Thanh mặt chữ sau biến điệu: 3-3 → 2-3, 不 trước thanh 4 → 2, 一 trước 4 → 2, trước 1/2/3 → 4. */
export function surfaceTones(hanzi: string, pinyinNumeric: string): Tone[] {
  const syl = pinyinNumeric.toLowerCase().split(/\s+/).filter(Boolean);
  const tones = syl.map((s) => Number(/[1-5]$/.exec(s)?.[0] ?? 5) as Tone);
  const chars = Array.from(hanzi).filter((c) => /\p{Script=Han}/u.test(c));
  for (let i = tones.length - 2; i >= 0; i--) {
    if (tones[i] === 3 && tones[i + 1] === 3) tones[i] = 2;
  }
  if (chars.length === tones.length) {
    for (let i = 0; i < tones.length - 1; i++) {
      const next = tones[i + 1];
      if (chars[i] === "不" && next === 4) tones[i] = 2;
      if (chars[i] === "一" && next !== 5) tones[i] = next === 4 ? 2 : 4;
    }
  }
  return tones;
}

/** Hình mẫu mỗi thanh (thang Chao 1–5 → nửa cung quanh giữa giọng) — dùng khi thiếu ghi âm chuẩn. */
const TEMPLATE: Record<1 | 2 | 3 | 4, number[]> = {
  1: [5, 5],
  2: [3, 5],
  3: [2, 1, 4],
  4: [5, 1],
};
export function toneTemplate(tone: Tone): number[] | null {
  if (tone === 5) return null;
  const pts = TEMPLATE[tone];
  return Array.from({ length: POINTS }, (_, i) => {
    const pos = (i / (POINTS - 1)) * (pts.length - 1);
    const lo = Math.floor(pos);
    const hi = Math.min(pts.length - 1, lo + 1);
    const chao = pts[lo] + (pts[hi] - pts[lo]) * (pos - lo);
    return (chao - 3) * 2.2; // 1 bậc Chao ≈ 2,2 nửa cung
  });
}

/** Thông số chấm — chỉnh bằng ma trận ghi âm thật (xem ghi chú cuối file). */
export const SCORE = { valueW: 1, slopeW: 1, free: 0.6, span: 3 };

/** Độ khớp 0–100 của từng âm tiết so với mẫu: lệch ĐỘ CAO (sau khi bỏ chênh lệch chung của
 * cả từ) cộng lệch ĐỘ DỐC — chỉ so độ cao thì thanh 2 và thanh 3 (cùng kết thúc đi lên)
 * vẫn được 97 điểm. */
export function compareContours(user: SyllableContour[], ref: ((number | null)[] | null)[]): (number | null)[] {
  const both = (u: (number | null)[], r: (number | null)[], k: number) => u[k] !== null && r[k] !== null;
  const pairs = user.map((u, i) => (u.st && ref[i] ? ([u.st, ref[i]!] as const) : null));
  const diffs = pairs.flatMap((p) => (p ? p[0].flatMap((v, k) => (both(p[0], p[1], k) ? [v! - p[1][k]!] : [])) : []));
  if (diffs.length === 0) return user.map(() => null);
  const offset = diffs.reduce((s, v) => s + v, 0) / diffs.length;
  const STEP = 4;
  return pairs.map((p) => {
    if (!p) return null;
    const [u, r] = p;
    let value = 0;
    let nv = 0;
    let slope = 0;
    let ns = 0;
    for (let k = 0; k < POINTS; k++) {
      if (!both(u, r, k)) continue;
      value += Math.abs(u[k]! - r[k]! - offset);
      nv++;
      if (k + STEP < POINTS && both(u, r, k + STEP)) {
        slope += Math.abs(u[k + STEP]! - u[k]! - (r[k + STEP]! - r[k]!));
        ns++;
      }
    }
    // Phần cả hai cùng dò được quá ít thì không dám chấm.
    if (nv < POINTS / 3) return null;
    const dist = SCORE.valueW * (value / nv) + SCORE.slopeW * (ns ? slope / ns : 0);
    return Math.round(Math.max(0, Math.min(1, 1 - (dist - SCORE.free) / SCORE.span)) * 100);
  });
}

/** Đặc trưng hình dạng 1 âm tiết (nửa cung): độ rơi tới đáy, độ lên sau đáy, vị trí đáy… */
export interface Shape {
  start: number;
  end: number;
  min: number;
  max: number;
  /** vị trí đáy / đỉnh trong âm tiết, 0–1 */
  minAt: number;
  maxAt: number;
  /** từ đầu xuống đáy, từ đáy lên cuối, từ đỉnh (nửa đầu) xuống cuối */
  dip: number;
  rise: number;
  fall: number;
  range: number;
}

export function shapeOf(contour: (number | null)[]): Shape | null {
  const pts = contour.map((v, i) => [i / (contour.length - 1), v] as const).filter((p): p is readonly [number, number] => p[1] !== null);
  if (pts.length < 4) return null;
  const avg = (a: (readonly [number, number])[]) => a.reduce((s, p) => s + p[1], 0) / a.length;
  const start = avg(pts.slice(0, 3));
  const end = avg(pts.slice(-3));
  let lo = pts[0];
  let hi = pts[0];
  for (const p of pts) {
    if (p[1] < lo[1]) lo = p;
    if (p[1] > hi[1]) hi = p;
  }
  const firstHalfMax = Math.max(...pts.filter((p) => p[0] <= 0.5).map((p) => p[1]));
  return {
    start,
    end,
    min: lo[1],
    max: hi[1],
    minAt: lo[0],
    maxAt: hi[0],
    dip: start - lo[1],
    rise: end - lo[1],
    fall: firstHalfMax - end,
    range: hi[1] - lo[1],
  };
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/** Điểm 0–100: âm tiết `user` có ĐÚNG đặc trưng của thanh `tone` không. Biên độ cần đạt
 * lấy theo giọng chuẩn (`ref`) nếu có — người học chỉ cần làm được ~60% biên độ đó. */
export function toneScore(user: (number | null)[], tone: Tone, ref?: (number | null)[] | null): number | null {
  const u = shapeOf(user);
  if (!u || tone === 5) return null;
  const r = ref ? shapeOf(ref) : null;
  const need = (native: number | undefined, floor: number) => Math.max(floor, (native ?? 0) * 0.6);
  let s: number;
  switch (tone) {
    case 1:
      // Ngang: càng ít dao động càng tốt (lệch 1,5 nửa cung vẫn tính là phẳng).
      s = 1 - clamp01((u.range - 1.8) / 4);
      break;
    case 2:
      // Lên: đáy sớm, từ đáy lên cuối đủ cao. Thanh 2 chuẩn chỉ võng ≤ 1,6 nửa cung (thanh 3
      // võng 2–5) — võng sâu trước khi lên là đọc thành thanh 3.
      s = clamp01(u.rise / need(r?.rise, 2.5)) * (u.minAt <= 0.5 ? 1 : 0.5) * (1 - clamp01((u.dip - 1.6) / 2.5));
      break;
    case 3: {
      // Võng/thấp: xuống tới đáy ở giữa hoặc cuối. Giọng chuẩn có vòng lên (214, đứng cuối)
      // thì người học cũng phải vòng lên; rơi sâu gấp đôi giọng chuẩn là đọc thành thanh 4.
      const deep = Math.max(6, (r?.dip ?? 3) * 1.8);
      s = clamp01(u.dip / need(r?.dip, 2)) * (u.minAt >= 0.3 ? 1 : 0.3) * (1 - clamp01((u.dip - deep) / 3));
      if (r && r.rise >= 2) s *= clamp01(u.rise / (r.rise * 0.5));
      break;
    }
    case 4:
      // Rơi: đỉnh ở nửa đầu, rơi mạnh tới cuối; cuối lại vòng lên thì giống thanh 3.
      s = clamp01(u.fall / need(r?.fall, 3.5)) * (u.maxAt <= 0.5 ? 1 : 0.5) * (1 - clamp01((u.rise - 2) / 4));
      break;
  }
  return Math.round(s * 100);
}

/** Đoán thanh theo HÌNH DẠNG (không cần giọng chuẩn): thanh có điểm đặc trưng cao nhất.
 * Rơi vừa phải (< 6 nửa cung) với đáy ở giữa là thanh 3 nửa (21), không phải thanh 4. */
export function guessTone(contour: (number | null)[]): 1 | 2 | 3 | 4 {
  const sh = shapeOf(contour);
  if (!sh) return 1;
  const scores = ([1, 2, 3, 4] as const).map((t) => toneScore(contour, t) ?? 0);
  if (sh.dip >= 2 && sh.dip < 6 && sh.minAt >= 0.3 && sh.minAt <= 0.85) scores[2] += 15;
  let best = 0;
  for (let i = 1; i < 4; i++) if (scores[i] > scores[best]) best = i;
  return (best + 1) as 1 | 2 | 3 | 4;
}

/** Điểm từng âm tiết so với giọng chuẩn: theo đặc trưng thanh (ref làm thước biên độ); âm
 * tiết mà chính giọng chuẩn cũng không mang đặc trưng điển hình (biến điệu, nối âm, thanh
 * nhẹ) thì so thẳng đường cao độ với giọng chuẩn. */
export function scoreSyllables(user: SyllableContour[], ref: SyllableContour[] | null, tones: Tone[]): (number | null)[] {
  const refSt = ref ? ref.map((r) => r.st) : tones.map((t) => toneTemplate(t));
  const similar = compareContours(user, refSt);
  return user.map((u, i) => {
    if (!u.st) return null;
    const tone = tones[i] ?? 5;
    const r = refSt[i] ?? null;
    const typical = tone !== 5 && r ? (toneScore(r, tone, r) ?? 0) >= 70 : tone !== 5;
    if (!typical) return similar[i];
    const feature = toneScore(u.st, tone, r);
    if (feature === null) return similar[i];
    return similar[i] === null ? feature : Math.round(feature * 0.75 + similar[i]! * 0.25);
  });
}
