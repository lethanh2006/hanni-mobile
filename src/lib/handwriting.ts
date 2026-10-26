/**
 * Nhận dạng chữ Hán viết tay — chép nguyên `lib/handwriting.ts` của hanni-client (mã của Hanni, không dùng HanziLookup
 * vì giấy phép GPL). Sửa thuật toán thì sửa cả 2 bên cho kết quả giống nhau.
 * Mẫu: đường giữa từng nét của 3.088 chữ HSK (Make Me a Hanzi, giấy phép Arphic), lấy mẫu lại và nén sẵn ở
 * `${WEB_ORIGIN}/hanzi-strokes/recog.txt` (dựng bằng `scripts/build-handwriting-data.mjs` của web).
 * Cách so: chuẩn hoá cả chữ theo khung bao (giữ tỉ lệ) → khoảng cách từng cặp nét (cho phép viết ngược chiều nét)
 * → ghép cặp nét tối ưu bằng thuật toán Hungary (người mới hay viết sai thứ tự nét), nét thừa/thiếu bị phạt; viết
 * đúng thứ tự được xếp trên một chút.
 */

export type Point = [number, number];
export type Stroke = Point[];
export type Template = { char: string; strokes: Float32Array[] };

/** Số điểm lấy mẫu mỗi nét (mỗi điểm 2 toạ độ, mỗi toạ độ 64 mức → 1 ký tự trong tệp mẫu). */
export const POINTS_PER_STROKE = 8;
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
const LEVELS = ALPHABET.length - 1;

/** Ngưỡng chấm — chỉnh bằng bài đo độ chính xác ở tests/handwriting.test.ts. */
const MAX_STROKE_DIFF = 2; // viết thừa/thiếu tối đa 2 nét vẫn xét
const MISS_COST = 0.45; // nét không có cặp ≈ một nét khớp rất tệ
const REVERSE_PENALTY = 0.06; // viết ngược chiều nét
const ORDER_PENALTY = 0.05; // tỉ lệ nét sai thứ tự

function resample(points: Point[], k: number): Point[] {
  if (points.length === 1) return Array.from({ length: k }, () => points[0]);
  const lengths = [0];
  for (let i = 1; i < points.length; i++) {
    const [x0, y0] = points[i - 1];
    const [x1, y1] = points[i];
    lengths.push(lengths[i - 1] + Math.hypot(x1 - x0, y1 - y0));
  }
  const total = lengths[lengths.length - 1];
  if (total === 0) return Array.from({ length: k }, () => points[0]);
  const out: Point[] = [];
  let seg = 1;
  for (let s = 0; s < k; s++) {
    const target = (total * s) / (k - 1);
    while (seg < points.length - 1 && lengths[seg] < target) seg++;
    const span = lengths[seg] - lengths[seg - 1] || 1;
    const t = Math.min(1, Math.max(0, (target - lengths[seg - 1]) / span));
    const [x0, y0] = points[seg - 1];
    const [x1, y1] = points[seg];
    out.push([x0 + (x1 - x0) * t, y0 + (y1 - y0) * t]);
  }
  return out;
}

/** Khung bao cả chữ → [0,1] (giữ tỉ lệ, căn giữa trục ngắn), mỗi nét lấy mẫu lại `k` điểm cách đều theo chiều dài. */
export function normalizeStrokes(strokes: Stroke[], k = POINTS_PER_STROKE): Float32Array[] {
  const all = strokes.flat();
  if (!all.length) return [];
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [x, y] of all) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  const size = Math.max(maxX - minX, maxY - minY) || 1;
  const offX = (size - (maxX - minX)) / 2;
  const offY = (size - (maxY - minY)) / 2;
  return strokes
    .filter((s) => s.length > 0)
    .map((s) => {
      const pts = resample(s, k);
      const arr = new Float32Array(k * 2);
      pts.forEach(([x, y], i) => {
        arr[i * 2] = (x - minX + offX) / size;
        arr[i * 2 + 1] = (y - minY + offY) / size;
      });
      return arr;
    });
}

/** Một chữ thành chuỗi: các nét cách nhau bởi ",", mỗi toạ độ 1 ký tự (64 mức). */
export function encodeStrokes(strokes: Float32Array[]): string {
  return strokes
    .map((s) => Array.from(s, (v) => ALPHABET[Math.round(Math.min(1, Math.max(0, v)) * LEVELS)]).join(""))
    .join(",");
}

/** Đọc tệp mẫu: mỗi dòng "<chữ> <nét>,<nét>,…". */
export function parseTemplates(text: string): Template[] {
  const out: Template[] = [];
  for (const line of text.split("\n")) {
    const space = line.indexOf(" ");
    if (space < 1) continue;
    const strokes = line
      .slice(space + 1)
      .split(",")
      .map((code) => Float32Array.from(code, (ch) => ALPHABET.indexOf(ch) / LEVELS));
    out.push({ char: line.slice(0, space), strokes });
  }
  return out;
}

function strokeCost(a: Float32Array, b: Float32Array): number {
  const k = a.length / 2;
  let forward = 0;
  let backward = 0;
  for (let i = 0; i < k; i++) {
    const j = k - 1 - i;
    const fx = a[i * 2] - b[i * 2];
    const fy = a[i * 2 + 1] - b[i * 2 + 1];
    const bx = a[i * 2] - b[j * 2];
    const by = a[i * 2 + 1] - b[j * 2 + 1];
    forward += Math.sqrt(fx * fx + fy * fy);
    backward += Math.sqrt(bx * bx + by * by);
  }
  return Math.min(forward / k, backward / k + REVERSE_PENALTY);
}

/** Như `strokeCost` nhưng chỉ so điểm đầu, giữa, cuối — dùng cho vòng lọc thô trên mọi chữ mẫu. */
function coarseCost(a: Float32Array, b: Float32Array): number {
  const k = a.length / 2;
  const idx = [0, Math.round((k - 1) / 2), k - 1];
  let forward = 0;
  let backward = 0;
  for (let n = 0; n < 3; n++) {
    const i = idx[n];
    const j = idx[2 - n];
    const fx = a[i * 2] - b[i * 2];
    const fy = a[i * 2 + 1] - b[i * 2 + 1];
    const bx = a[i * 2] - b[j * 2];
    const by = a[i * 2 + 1] - b[j * 2 + 1];
    forward += Math.sqrt(fx * fx + fy * fy);
    backward += Math.sqrt(bx * bx + by * by);
  }
  return Math.min(forward / 3, backward / 3 + REVERSE_PENALTY);
}

/** Vòng lọc thô: mỗi nét người viết (theo thứ tự viết) lấy nét mẫu giống nhất còn trống — nhanh, đủ để xếp sơ bộ. */
function coarseScore(user: Float32Array[], template: Float32Array[]): number {
  const n = user.length;
  const m = template.length;
  const taken = new Uint8Array(m);
  let total = 0;
  for (let i = 0; i < n; i++) {
    let best = MISS_COST;
    let bestJ = -1;
    for (let j = 0; j < m; j++) {
      if (taken[j]) continue;
      const c = coarseCost(user[i], template[j]);
      if (c < best) {
        best = c;
        bestJ = j;
      }
    }
    if (bestJ >= 0) taken[bestJ] = 1;
    total += best;
  }
  total += Math.max(0, m - n) * MISS_COST;
  return total / Math.max(n, m);
}

// Bộ đệm cho thuật toán Hungary — cấp 1 lần, dùng lại cho mọi chữ mẫu (chữ HSK nhiều nhất ~30 nét + 2 nét thừa).
const MAX_SIZE = 40;
const H_COST = new Float64Array(MAX_SIZE * MAX_SIZE);
const H_U = new Float64Array(MAX_SIZE + 1);
const H_V = new Float64Array(MAX_SIZE + 1);
const H_MINV = new Float64Array(MAX_SIZE + 1);
const H_P = new Int32Array(MAX_SIZE + 1);
const H_WAY = new Int32Array(MAX_SIZE + 1);
const H_USED = new Uint8Array(MAX_SIZE + 1);

/** Ghép cặp chi phí nhỏ nhất trên ma trận vuông `size`×`size` ở `H_COST` (thuật toán Hungary, O(n³)).
 * Trả tổng chi phí; `H_P[cột + 1] - 1` là hàng được ghép với cột đó. */
function hungarian(size: number): number {
  H_U.fill(0, 0, size + 1);
  H_V.fill(0, 0, size + 1);
  H_P.fill(0, 0, size + 1);
  H_WAY.fill(0, 0, size + 1);
  for (let i = 1; i <= size; i++) {
    H_P[0] = i;
    let j0 = 0;
    H_MINV.fill(Infinity, 0, size + 1);
    H_USED.fill(0, 0, size + 1);
    do {
      H_USED[j0] = 1;
      const i0 = H_P[j0];
      let delta = Infinity;
      let j1 = 0;
      for (let j = 1; j <= size; j++) {
        if (H_USED[j]) continue;
        const cur = H_COST[(i0 - 1) * size + (j - 1)] - H_U[i0] - H_V[j];
        if (cur < H_MINV[j]) {
          H_MINV[j] = cur;
          H_WAY[j] = j0;
        }
        if (H_MINV[j] < delta) {
          delta = H_MINV[j];
          j1 = j;
        }
      }
      for (let j = 0; j <= size; j++) {
        if (H_USED[j]) {
          H_U[H_P[j]] += delta;
          H_V[j] -= delta;
        } else {
          H_MINV[j] -= delta;
        }
      }
      j0 = j1;
    } while (H_P[j0] !== 0);
    do {
      const j1 = H_WAY[j0];
      H_P[j0] = H_P[j1];
      j0 = j1;
    } while (j0);
  }
  let total = 0;
  for (let j = 1; j <= size; j++) total += H_COST[(H_P[j] - 1) * size + (j - 1)];
  return total;
}

/** Điểm khớp (càng nhỏ càng giống) giữa nét người viết (đã chuẩn hoá) và một chữ mẫu. */
function matchScore(user: Float32Array[], template: Float32Array[]): number {
  const n = user.length;
  const m = template.length;
  const size = Math.max(n, m);
  for (let i = 0; i < size; i++)
    for (let j = 0; j < size; j++)
      H_COST[i * size + j] = i < n && j < m ? strokeCost(user[i], template[j]) : MISS_COST;
  const total = hungarian(size);
  let misordered = 0;
  for (let j = 1; j <= size; j++) {
    const row = H_P[j] - 1;
    if (row < n && j - 1 < m && row !== j - 1) misordered++;
  }
  return total / size + (ORDER_PENALTY * misordered) / size;
}

/** Số chữ mẫu giữ lại sau vòng lọc thô để chấm kỹ. */
const SHORTLIST = 60;

/** `limit` chữ giống nhất với các nét vừa viết (toạ độ màn hình, gốc trên-trái), tốt nhất trước. */
export function recognize(templates: Template[], strokes: Stroke[], limit = 8): string[] {
  const user = normalizeStrokes(strokes);
  if (!user.length || user.length > MAX_SIZE - MAX_STROKE_DIFF) return [];
  const rough: { t: Template; score: number }[] = [];
  for (const t of templates) {
    if (Math.abs(t.strokes.length - user.length) > MAX_STROKE_DIFF) continue;
    rough.push({ t, score: coarseScore(user, t.strokes) });
  }
  rough.sort((a, b) => a.score - b.score);
  return rough
    .slice(0, SHORTLIST)
    .map(({ t }) => ({ char: t.char, score: matchScore(user, t.strokes) }))
    .sort((a, b) => a.score - b.score)
    .slice(0, limit)
    .map((s) => s.char);
}
