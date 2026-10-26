import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Line, Path } from 'react-native-svg';

import { AppText, Button, Card, Hanzi, Icon } from '@/components/ui';
import { alpha, ToneColors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { playWord } from '@/lib/audio';
import { TONE_RULE_TEXT } from '@/lib/tone-rules';
import type { PinyinOverview, SyllableSound } from '@/lib/types';

import { CHART_TABS, FINAL_GROUPS, firstSound, INITIAL_GROUPS, initialOf, TONES, type PinyinItem } from './pinyin-data';

type Tone = '1' | '2' | '3' | '4';
const TONE_KEYS: Tone[] = ['1', '2', '3', '4'];

/** Nút nghe nhỏ "bā 八 🔊" (`SoundChip` của web). Không có ghi âm thì chỉ hiện chữ. */
export function SoundChip({ mark, char, url }: { mark: string; char?: string; url?: string | null }) {
  const theme = useTheme();
  const body = (
    <>
      <AppText weight="600">{mark}</AppText>
      {char && (
        <Hanzi size={14} color="muted">
          {char}
        </Hanzi>
      )}
    </>
  );
  if (!url) return <View style={styles.chipBare}>{body}</View>;
  return (
    <Pressable
      onPress={() => playWord(url)}
      accessibilityLabel={`Nghe ${mark}`}
      style={({ pressed }) => [styles.chip, { backgroundColor: alpha(theme.primary, pressed ? 0.15 : 0.1) }]}>
      <Icon name="sound" size={14} color="primary" />
      {body}
    </Pressable>
  );
}

/** Đường cao độ thanh điệu trên thang 5 bậc (1 thấp — 5 cao). */
function ToneContour({ pitch, color }: { pitch: number[]; color: string }) {
  const W = 120;
  const H = 64;
  const pad = 8;
  const y = (lvl: number) => pad + ((5 - lvl) / 4) * (H - 2 * pad);
  const x = (i: number) => pad + (i / (pitch.length - 1)) * (W - 2 * pad);
  const d = pitch.map((p, i) => `${i ? 'L' : 'M'}${x(i)} ${y(p)}`).join(' ');
  return (
    <Svg viewBox={`0 0 ${W} ${H}`} width="100%" height={56}>
      {[1, 2, 3, 4, 5].map((l) => (
        <Line key={l} x1={pad} x2={W - pad} y1={y(l)} y2={y(l)} stroke={color} strokeOpacity={0.12} />
      ))}
      <Path d={d} fill="none" stroke={color} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Đầu mỗi mục: chữ 20px đậm + đoạn giải thích. */
export function SectionIntro({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <View style={styles.intro}>
      <AppText weight="800" style={styles.h2}>
        {title}
      </AppText>
      {children && (
        <AppText color="muted" style={styles.lead}>
          {children}
        </AppText>
      )}
    </View>
  );
}

const SANDHI = [
  {
    rule: 'Hai thanh 3 đi liền nhau: thanh 3 đầu đọc thành thanh 2.',
    ex: { mark: 'nǐ hǎo → ní hǎo', char: '你好', url: '/media/audio/cmn-你好.mp3' },
  },
  {
    rule: '不 (bù) đứng trước thanh 4 đọc thành bú.',
    ex: { mark: 'bù yào → bú yào', char: '不要', url: '/media/audio/cmn-不要.mp3' },
  },
  {
    rule: '一 (yī) trước thanh 4 đọc yí, trước thanh 1/2/3 đọc yì; đếm số hay đứng cuối giữ yī.',
    ex: { mark: 'yī xià → yí xià', char: '一下', url: '/media/audio/cmn-一下.mp3' },
  },
];

/** "4 thanh điệu và thanh nhẹ": thẻ từng thanh có đồ thị cao độ + nghe "ba", rồi khối thanh nhẹ và biến điệu. */
export function ToneSection({ data }: { data: PinyinOverview | null }) {
  const theme = useTheme();
  const ba = data?.syllables.find((s) => s.base === 'ba');
  return (
    <View style={styles.section}>
      <SectionIntro title="4 thanh điệu và thanh nhẹ">
        Cùng một âm <AppText weight="700">ba</AppText>, đổi thanh là đổi nghĩa: 八 (tám) · 拔 (nhổ) · 把 (cầm) · 坝
        (đập nước). Tiếng Việt có 6 thanh nên người Việt bắt thanh tiếng Trung nhanh hơn hẳn người phương Tây — chỉ cần
        nhớ thanh nào ứng với dấu nào.
      </SectionIntro>
      <View style={styles.list12}>
        {TONES.map((tone) => {
          const sound = ba?.tones[tone.t];
          const color = ToneColors[tone.t];
          return (
            <Card key={tone.t} style={styles.toneCard}>
              <View style={styles.rowBetween}>
                <AppText weight="700">{tone.name}</AppText>
                <AppText weight="800" style={[styles.toneMark, { color }]}>
                  {sound?.mark ?? ''}
                </AppText>
              </View>
              <View style={styles.contour}>
                <ToneContour pitch={tone.pitch} color={color} />
              </View>
              <AppText style={styles.line24}>{tone.desc}</AppText>
              <AppText variant="caption" color="muted" style={styles.toneVi}>
                {tone.vi}
              </AppText>
              {sound && (
                <View style={styles.toneSound}>
                  <SoundChip mark={sound.mark} char={sound.char} url={sound.url} />
                </View>
              )}
            </Card>
          );
        })}
      </View>
      <Card style={styles.sandhi}>
        <AppText weight="700">Thanh nhẹ và biến điệu</AppText>
        <AppText color="muted" style={styles.line24}>
          <AppText weight="700">Thanh nhẹ</AppText> không có dấu, đọc nhẹ và ngắn: 妈妈 māma, 你们 nǐmen, 吗 ma. Khi nói, vài
          chữ <AppText weight="700">đổi thanh</AppText> theo chữ đứng sau — pinyin trong từ điển vẫn ghi thanh gốc:
        </AppText>
        <View style={styles.list8}>
          {SANDHI.map((s) => (
            <View key={s.rule} style={[styles.sandhiRow, { backgroundColor: theme.surface2 }]}>
              <AppText>{s.rule}</AppText>
              <SoundChip mark={s.ex.mark} char={s.ex.char} url={s.ex.url} />
            </View>
          ))}
        </View>
      </Card>
    </View>
  );
}

/** Mẹo riêng cho người Việt: đoán thanh từ dấu của âm Hán Việt, kèm tỉ lệ đúng đo thật. */
export function ToneRuleSection({ data }: { data: PinyinOverview | null }) {
  const theme = useTheme();
  const rules = data?.toneRules ?? [];
  const predictable = rules.filter((r) => r.predicted !== null);
  const total = predictable.reduce((n, r) => n + r.total, 0);
  const follows = predictable.reduce((n, r) => n + r.follows, 0);
  return (
    <View style={styles.section}>
      <SectionIntro title="Mẹo riêng cho người Việt: đoán thanh từ âm Hán Việt">
        Âm Hán Việt và thanh tiếng Trung cùng gốc từ tiếng Hán cổ, nên dấu của âm Hán Việt báo trước khá đúng thanh tiếng
        Trung.
        {total > 0 && (
          <>
            {' '}
            Hanni đo trên toàn bộ từ vựng HSK 1–4: quy luật dưới đây{' '}
            <AppText weight="700">đúng {Math.round((follows / total) * 100)}%</AppText> (
            {follows.toLocaleString('vi-VN')}/{total.toLocaleString('vi-VN')} chữ có quy luật).
          </>
        )}{' '}
        Mẹo này hiện ngay trong thẻ từ mới của mỗi bài học.
      </SectionIntro>
      <View style={styles.list8}>
        {rules.map((r) => {
          const pct = r.total ? Math.round((r.follows / r.total) * 100) : 0;
          return (
            <Card key={r.key} style={styles.ruleCard}>
              <View>
                <AppText weight="600">{TONE_RULE_TEXT[r.key] ?? r.key}</AppText>
                {r.predicted !== null ? (
                  <View style={styles.ruleBar}>
                    <View style={[styles.track, { backgroundColor: theme.surface2 }]}>
                      <View style={[styles.fill, { width: `${pct}%`, backgroundColor: theme.good }]} />
                    </View>
                    <AppText variant="caption" weight="600" color="muted">
                      đúng {pct}%
                    </AppText>
                  </View>
                ) : (
                  <AppText variant="caption" color="muted" style={styles.ruleNote}>
                    Rải đều cả 4 thanh — không đoán được, phải nhớ riêng.
                  </AppText>
                )}
              </View>
              <View style={styles.chips}>
                {r.examples.map((e) => (
                  <SoundChip key={e.char} mark={`${e.hanViet} → ${e.mark}`} char={e.char} url={e.url} />
                ))}
              </View>
            </Card>
          );
        })}
      </View>
    </View>
  );
}

/** 1 dòng âm (thanh mẫu/vận mẫu): ô chữ cái + cách đọc, nút nghe xuống dưới (điện thoại). */
function SoundRow({ item, data, initial }: { item: PinyinItem; data: PinyinOverview | null; initial: boolean }) {
  const theme = useTheme();
  const s = firstSound(data, item.ex);
  return (
    <View style={styles.soundRow}>
      <View
        style={[
          styles.letter,
          initial ? { width: 48, backgroundColor: alpha(theme.primary, 0.1) } : { width: 56, backgroundColor: theme.surface2 },
        ]}>
        <AppText weight="800" color={initial ? 'primary' : 'text'} style={initial ? styles.letterBig : styles.letterText}>
          {item.l}
        </AppText>
      </View>
      <View style={styles.soundCopy}>
        <AppText style={styles.line20}>{item.tip}</AppText>
        {s && <SoundChip mark={s.mark} char={s.char} url={s.url} />}
      </View>
    </View>
  );
}

/** "21 thanh mẫu (phụ âm đầu)" — chú ý các cặp bật hơi / không bật hơi. */
export function InitialSection({ data }: { data: PinyinOverview | null }) {
  return (
    <View style={styles.section}>
      <SectionIntro title="21 thanh mẫu (phụ âm đầu)">
        Chú ý các cặp <AppText weight="700">bật hơi / không bật hơi</AppText> (b–p, d–t, g–k, j–q, zh–ch, z–c): tiếng Việt
        gần như không phân biệt kiểu này, nên đây là chỗ người Việt hay đọc sai nhất.
      </SectionIntro>
      <View style={styles.list16}>
        {INITIAL_GROUPS.map((g) => (
          <Card key={g.name} style={styles.groupCard}>
            <AppText weight="700">{g.name}</AppText>
            <AppText variant="caption" color="muted">
              {g.note}
            </AppText>
            <View style={styles.soundList}>
              {g.items.map((it) => (
                <SoundRow key={it.l} item={it} data={data} initial />
              ))}
            </View>
          </Card>
        ))}
      </View>
      <AppText variant="caption" color="muted">
        <AppText variant="caption" weight="700">
          y
        </AppText>{' '}
        và{' '}
        <AppText variant="caption" weight="700">
          w
        </AppText>{' '}
        không phải thanh mẫu thật: chúng chỉ là cách viết khi âm tiết bắt đầu bằng i, u, ü (yi, wu, yu).
      </AppText>
    </View>
  );
}

/** "36 vận mẫu (vần)". */
export function FinalSection({ data }: { data: PinyinOverview | null }) {
  return (
    <View style={styles.section}>
      <SectionIntro title="36 vận mẫu (vần)" />
      <View style={styles.list16}>
        {FINAL_GROUPS.map((g) => (
          <Card key={g.name} style={styles.groupCard}>
            <AppText weight="700">{g.name}</AppText>
            <View style={styles.soundList}>
              {g.items.map((it) => (
                <SoundRow key={it.l} item={it} data={data} initial={false} />
              ))}
            </View>
          </Card>
        ))}
      </View>
    </View>
  );
}

const TAB_LABEL: Record<string, string> = { '∅': 'a o e', 'y/w': 'y w' };

/**
 * Bảng ghép âm (`SyllableChart` của web): chọn phụ âm đầu → mọi âm tiết của nó, bấm từng thanh để nghe ghi âm thật.
 * Thanh nào từ điển không có chữ đơn 1 cách đọc thì để trống thay vì phát sai.
 */
export function SyllableChart({ data }: { data: PinyinOverview | null }) {
  const theme = useTheme();
  const [tab, setTab] = useState('b');
  const [last, setLast] = useState<string | null>(null);
  const list = (data?.syllables ?? []).filter((s) => initialOf(s.base) === tab);
  const rows: (typeof list)[] = [];
  for (let i = 0; i < list.length; i += 2) rows.push(list.slice(i, i + 2));
  return (
    <View style={styles.chart}>
      <View style={styles.tabs} accessibilityRole="tablist">
        {CHART_TABS.map((t) => {
          const on = t === tab;
          return (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              style={[
                styles.tab,
                on
                  ? { borderColor: alpha(theme.primary, 0.5), backgroundColor: alpha(theme.primary, 0.1) }
                  : { borderColor: theme.border, backgroundColor: theme.surface },
              ]}>
              <AppText weight="700" color={on ? 'primary' : 'text'}>
                {TAB_LABEL[t] ?? t}
              </AppText>
            </Pressable>
          );
        })}
      </View>
      {!data ? (
        <AppText color="muted">Đang tải bảng âm…</AppText>
      ) : (
        <View style={styles.list8}>
          {rows.map((row) => (
            <View key={row[0].base} style={styles.pairRow}>
              {row.map((s) => (
                <View key={s.base} style={[styles.syllable, { borderColor: theme.border, backgroundColor: theme.surface }]}>
                  <AppText weight="800" style={styles.syllableBase}>
                    {s.base}
                  </AppText>
                  <View style={styles.toneGrid}>
                    {TONE_KEYS.map((t) => {
                      const sound = s.tones[t];
                      if (!sound) {
                        return (
                          <View key={t} style={[styles.toneCell, { backgroundColor: alpha(theme.surface2, 0.6) }]}>
                            <AppText variant="caption" style={{ color: alpha(theme.muted, 0.5) }}>
                              –
                            </AppText>
                          </View>
                        );
                      }
                      const id = `${s.base}${t}`;
                      return (
                        <Pressable
                          key={t}
                          onPress={() => {
                            playWord(sound.url);
                            setLast(id);
                          }}
                          accessibilityLabel={`Nghe ${sound.mark} (${sound.char})`}
                          style={[
                            styles.toneCell,
                            { backgroundColor: last === id ? alpha(theme.primary, 0.15) : theme.surface2 },
                          ]}>
                          <AppText variant="caption" weight="700" style={{ color: ToneColors[t] }}>
                            {sound.mark}
                          </AppText>
                          <Hanzi size={12} color="muted">
                            {sound.char}
                          </Hanzi>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ))}
              {row.length === 1 && <View style={styles.flex} />}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const ROUNDS = 10;

interface Question {
  base: string;
  answer: Tone;
  options: { tone: Tone; sound: SyllableSound }[];
}

function makeQuiz(data: PinyinOverview): Question[] {
  // Chỉ lấy âm tiết có ≥ 3 thanh có ghi âm — 2 lựa chọn thì đoán bừa cũng đúng 50%.
  const pool = data.syllables.filter((s) => TONE_KEYS.filter((t) => s.tones[t]).length >= 3);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, ROUNDS).map((s) => {
    const options = TONE_KEYS.filter((t) => s.tones[t]).map((t) => ({ tone: t, sound: s.tones[t] as SyllableSound }));
    return { base: s.base, answer: options[Math.floor(Math.random() * options.length)].tone, options };
  });
}

/** Luyện tai (`TonePractice` của web): nghe 1 âm tiết, chọn đúng thanh — 10 câu. */
export function TonePractice({ data, onLearn, learnLabel }: { data: PinyinOverview | null; onLearn: () => void; learnLabel: string }) {
  const theme = useTheme();
  const [quiz, setQuiz] = useState<Question[]>([]);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<Tone | null>(null);
  const [score, setScore] = useState(0);
  const q = quiz[i];
  const done = quiz.length > 0 && i >= quiz.length;
  const sound = q?.options.find((o) => o.tone === q.answer)?.sound;

  function start() {
    if (!data) return;
    const qz = makeQuiz(data);
    setQuiz(qz);
    setI(0);
    setPicked(null);
    setScore(0);
    playWord(qz[0]?.options.find((o) => o.tone === qz[0].answer)?.sound.url);
  }
  function choose(t: Tone) {
    if (picked || !q) return;
    setPicked(t);
    if (t === q.answer) setScore((s) => s + 1);
  }
  function next() {
    const n = i + 1;
    setI(n);
    setPicked(null);
    const nq = quiz[n];
    if (nq) playWord(nq.options.find((o) => o.tone === nq.answer)?.sound.url);
  }

  if (quiz.length === 0) {
    return (
      <View style={styles.list12}>
        <AppText color="muted">{ROUNDS} câu: nghe 1 âm tiết rồi chọn đúng thanh điệu. Bật loa hoặc tai nghe nhé.</AppText>
        <Button title="Bắt đầu luyện" leftIcon="play" disabled={!data} onPress={start} style={styles.self} />
      </View>
    );
  }

  if (done) {
    return (
      <View style={styles.center}>
        <AppText weight="800" style={styles.score}>
          {score}
          <AppText weight="800" color="muted" style={styles.scoreMax}>
            /{ROUNDS}
          </AppText>
        </AppText>
        <AppText color="muted" center style={styles.scoreText}>
          {score >= 8
            ? 'Tai bạn bắt thanh rất tốt — sẵn sàng học từ vựng rồi!'
            : score >= 5
              ? 'Khá ổn. Thanh 2 và thanh 3 dễ nhầm nhất — nghe lại bảng ở trên rồi luyện thêm lượt nữa.'
              : 'Bình thường thôi — ai mới học cũng vậy. Nghe kỹ 4 thanh ở đầu trang rồi thử lại nhé.'}
        </AppText>
        <View style={styles.doneActions}>
          <Button title="Luyện lượt khác" leftIcon="refresh" variant="secondary" onPress={start} />
          <Button title={learnLabel} icon="arrow" onPress={onLearn} />
        </View>
      </View>
    );
  }

  if (!q || !sound) return null;
  const rows = [q.options.slice(0, 2), q.options.slice(2)].filter((r) => r.length);
  return (
    <View style={styles.list16}>
      <View style={styles.rowBetween}>
        <AppText variant="caption" color="muted">
          Câu {i + 1}/{quiz.length}
        </AppText>
        <AppText variant="caption" color="muted">
          Đúng {score}
        </AppText>
      </View>
      <View style={styles.center}>
        <Pressable
          onPress={() => playWord(sound.url)}
          accessibilityLabel="Nghe lại"
          style={({ pressed }) => [styles.bigSound, { backgroundColor: alpha(theme.primary, pressed ? 0.15 : 0.1) }]}>
          <Icon name="sound" size={34} color="primary" />
        </Pressable>
        <AppText color="muted" style={styles.ask}>
          Âm tiết <AppText weight="700">{q.base}</AppText> — thanh mấy?
        </AppText>
      </View>
      <View style={styles.list8}>
        {rows.map((row) => (
          <View key={row[0].tone} style={styles.pairRow}>
            {row.map((o) => {
              const state = !picked ? 'idle' : o.tone === q.answer ? 'right' : o.tone === picked ? 'wrong' : 'dim';
              return (
                <Pressable
                  key={o.tone}
                  disabled={!!picked}
                  onPress={() => choose(o.tone)}
                  style={[
                    styles.option,
                    state === 'right'
                      ? { borderColor: theme.good, backgroundColor: alpha(theme.good, 0.1) }
                      : state === 'wrong'
                        ? { borderColor: theme.danger, backgroundColor: alpha(theme.danger, 0.1) }
                        : { borderColor: theme.border, backgroundColor: theme.surface },
                    state === 'dim' && styles.dim,
                  ]}>
                  <AppText weight="800" style={[styles.optionMark, { color: ToneColors[o.tone] }]}>
                    {o.sound.mark}
                  </AppText>
                  <AppText variant="caption" color="muted">
                    Thanh {o.tone}
                  </AppText>
                </Pressable>
              );
            })}
            {row.length === 1 && <View style={styles.flex} />}
          </View>
        ))}
      </View>
      {picked && (
        <View style={[styles.feedback, { backgroundColor: theme.surface2 }]}>
          <AppText>
            {picked === q.answer ? 'Chính xác! ' : 'Chưa đúng — '}
            <Hanzi size={16}>{sound.char}</Hanzi> đọc là{' '}
            <AppText weight="700" style={{ color: ToneColors[q.answer] }}>
              {sound.mark}
            </AppText>{' '}
            (thanh {q.answer}).
          </AppText>
          <Button
            title={i + 1 < quiz.length ? 'Câu tiếp' : 'Xem kết quả'}
            icon="arrow"
            onPress={next}
            style={styles.nextButton}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  self: { alignSelf: 'flex-start' },
  center: { alignItems: 'center' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  section: { gap: 16 },
  intro: { gap: 16 },
  h2: { fontSize: 20, lineHeight: 28, letterSpacing: -0.5 },
  lead: { lineHeight: 28 },
  line20: { lineHeight: 20 },
  line24: { lineHeight: 24 },
  list8: { gap: 8 },
  list12: { gap: 12 },
  list16: { gap: 16 },
  chip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  chipBare: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  toneCard: { gap: 0, padding: 16 },
  toneMark: { fontSize: 24, lineHeight: 30 },
  contour: { marginTop: 8 },
  toneVi: { marginTop: 4, lineHeight: 20 },
  toneSound: { marginTop: 12 },
  sandhi: { gap: 12 },
  sandhiRow: { gap: 8, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 10 },
  ruleCard: { gap: 12, padding: 16 },
  ruleBar: { marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 8 },
  track: { flex: 1, height: 8, borderRadius: 999, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 999 },
  ruleNote: { marginTop: 4 },
  groupCard: { gap: 0, padding: 16 },
  soundList: { marginTop: 12, gap: 8 },
  soundRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  letter: { height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  letterBig: { fontSize: 18, lineHeight: 24 },
  letterText: { fontSize: 16, lineHeight: 22 },
  soundCopy: { flex: 1, minWidth: 0, gap: 6, alignItems: 'flex-start' },
  chart: { gap: 16 },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tab: { minWidth: 40, alignItems: 'center', borderWidth: 2, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 },
  pairRow: { flexDirection: 'row', gap: 8 },
  syllable: { flex: 1, minWidth: 0, borderWidth: 1, borderRadius: 16, padding: 10 },
  syllableBase: { paddingHorizontal: 4 },
  toneGrid: { marginTop: 6, flexDirection: 'row', gap: 4 },
  toneCell: { flex: 1, height: 44, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  score: { fontSize: 36, lineHeight: 44 },
  scoreMax: { fontSize: 20 },
  scoreText: { marginTop: 8 },
  doneActions: { marginTop: 16, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  bigSound: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  ask: { marginTop: 12 },
  option: { flex: 1, alignItems: 'center', borderWidth: 2, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 12 },
  optionMark: { fontSize: 20, lineHeight: 28 },
  dim: { opacity: 0.5 },
  feedback: { gap: 12, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12 },
  nextButton: { alignSelf: 'flex-start', minHeight: 36, paddingHorizontal: 16, paddingVertical: 6 },
});
