import { useEffect, useState } from 'react';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { TonePinyin } from '@/components/tone-pinyin';
import { AppText, Hanzi, Icon } from '@/components/ui';
import { alpha, ToneColors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { playWord } from '@/lib/audio';
import { TONE_RULE_TEXT } from '@/lib/tone-rules';
import type { SessionStep, SessionWord } from '@/lib/types';

type ChoiceStepData = Extract<SessionStep, { kind: 'choice' }>;
type SentenceStepData = Extract<SessionStep, { kind: 'sentence' }>;

/** Nghĩa ngắn cho phương án — khớp `shortMeaning()` phía server. */
export function shortMeaning(meaning: string): string {
  const first = meaning.split(';')[0].trim();
  const stripped = first.replace(/\([^)]*\)/g, '').replace(/\s+/g, ' ').trim();
  const out = stripped || first;
  return out.length > 48 ? `${out.slice(0, 47).trimEnd()}…` : out;
}

/** Nút loa tròn nền đỏ nhạt (`SoundButton` của phiên học web): 40px, `big` = 80px ở câu "Bạn nghe thấy từ nào?". */
function SoundButton({ src, big = false }: { src: string | null; big?: boolean }) {
  const theme = useTheme();
  if (!src) return null;
  return (
    <Pressable
      onPress={() => playWord(src)}
      accessibilityRole="button"
      accessibilityLabel="Nghe phát âm"
      style={({ pressed }) => [
        big ? styles.soundBig : styles.sound,
        { backgroundColor: alpha(theme.primary, pressed ? 0.15 : 0.1) },
        pressed && { transform: [{ scale: 0.96 }] },
      ]}>
      <Icon name="sound" size={big ? 36 : 18} color="primary" />
    </Pressable>
  );
}

/** Thẻ giới thiệu từ mới: Hán tự + pinyin tô màu theo thanh, âm Hán Việt kèm mẹo thanh điệu, nghĩa, ảnh, câu ví dụ. */
export function IntroStep({ word }: { word: SessionWord }) {
  const theme = useTheme();
  useEffect(() => {
    playWord(word.audioUrl);
  }, [word.audioUrl]);

  const example = word.examples[0];
  const hints = word.toneHints?.filter((h) => h.follows !== null) ?? [];

  return (
    <View style={styles.center}>
      <View style={[styles.badge, { backgroundColor: alpha(theme.primary, 0.1) }]}>
        <AppText variant="caption" weight="700" color="primary" style={styles.badgeText}>
          TỪ MỚI
        </AppText>
      </View>
      {word.imageUrl && <Image source={word.imageUrl} style={styles.image} contentFit="cover" />}
      <View style={styles.wordRow}>
        <TonePinyin zh={word.simplified} pinyin={word.pinyin} pinyinNum={word.pinyinNumeric} size="lg" />
        <SoundButton src={word.audioUrl} />
      </View>
      <AppText weight="700" center style={styles.meaning}>
        {word.meaningVi ?? word.meaningEn ?? 'Đang cập nhật nghĩa'}
      </AppText>

      {word.hanViet && (
        <View
          style={[
            styles.box,
            styles.hanvietBox,
            { borderColor: alpha(theme.hanviet, 0.2), backgroundColor: alpha(theme.hanviet, 0.05) },
          ]}>
          <AppText center>
            Âm Hán Việt:{' '}
            <AppText weight="700" color="hanviet">
              {word.hanViet}
            </AppText>
          </AppText>
          {hints.length > 0 && (
            <View style={styles.hints}>
              {hints.map((h, i) => (
                <View
                  key={`${h.char}-${i}`}
                  accessibilityHint={h.follows ? TONE_RULE_TEXT[h.rule] : 'Ngoại lệ — chữ này không theo quy luật, nhớ riêng nhé'}
                  style={[styles.hint, { backgroundColor: theme.surface }]}>
                  <AppText variant="caption" color="muted">
                    {h.hanViet} →{' '}
                    <Text style={{ color: ToneColors[String(h.tone)] ?? theme.muted, fontWeight: '700' }}>thanh {h.tone}</Text>
                    {h.follows ? ' ✓' : ' (ngoại lệ)'}
                  </AppText>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {word.mnemonicVi && (
        <View
          style={[
            styles.box,
            styles.mnemonic,
            { borderColor: alpha(theme.accent, 0.25), backgroundColor: alpha(theme.accent, 0.05) },
          ]}>
          <AppText style={styles.line24}>
            <AppText weight="600" color="accent">
              Mẹo nhớ:{' '}
            </AppText>
            {word.mnemonicVi}
          </AppText>
        </View>
      )}

      {example && (
        <View style={[styles.box, styles.example, { backgroundColor: theme.surface2 }]}>
          <Hanzi size={18}>{example.zh}</Hanzi>
          {example.pinyin && (
            <AppText variant="caption" color="muted">
              {example.pinyin}
            </AppText>
          )}
          {example.vi && <AppText style={styles.exampleVi}>{example.vi}</AppText>}
        </View>
      )}
    </View>
  );
}

/** Lưới phương án trắc nghiệm (`OptionGrid` của web). Sau khi chọn: đáp án đúng xanh, phương án chọn sai đỏ. */
export function OptionList({
  options,
  answer,
  picked,
  hanzi,
  onPick,
}: {
  options: string[];
  answer: number;
  picked: number | null;
  hanzi: boolean;
  onPick: (i: number) => void;
}) {
  const theme = useTheme();
  return (
    <View style={styles.options}>
      {options.map((opt, i) => {
        const state = picked === null ? 'idle' : i === answer ? 'right' : i === picked ? 'wrong' : 'dim';
        const look =
          state === 'right'
            ? { borderColor: theme.good, backgroundColor: alpha(theme.good, 0.1) }
            : state === 'wrong'
              ? { borderColor: theme.danger, backgroundColor: alpha(theme.danger, 0.1) }
              : { borderColor: theme.border, backgroundColor: theme.surface };
        return (
          <Pressable
            key={`${opt}-${i}`}
            disabled={picked !== null}
            onPress={() => onPick(i)}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.option,
              look,
              state === 'idle' &&
                pressed && { borderColor: alpha(theme.primary, 0.4), backgroundColor: alpha(theme.primary, 0.05) },
              state === 'dim' && styles.dim,
            ]}>
            <View style={[styles.optionIndex, { borderColor: theme.border }]}>
              <AppText variant="caption" color="muted">
                {i + 1}
              </AppText>
            </View>
            {hanzi ? (
              <Hanzi size={24} style={styles.flex}>
                {opt}
              </Hanzi>
            ) : (
              <AppText weight="600" style={styles.flex}>
                {opt}
              </AppText>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const CHOICE_QUESTION: Record<ChoiceStepData['prompt'], string> = {
  hanzi: 'Từ này nghĩa là gì?',
  meaning: 'Chọn chữ Hán đúng',
  audio: 'Bạn nghe thấy từ nào?',
};

export function ChoiceStep({
  step,
  word,
  picked,
  onPick,
}: {
  step: ChoiceStepData;
  word: Pick<SessionWord, 'simplified' | 'meaningVi' | 'audioUrl'>;
  picked: number | null;
  onPick: (i: number) => void;
}) {
  useEffect(() => {
    if (step.prompt === 'audio') playWord(word.audioUrl);
  }, [step.prompt, word.audioUrl]);

  return (
    <View style={styles.center}>
      <AppText weight="600" color="muted">
        {CHOICE_QUESTION[step.prompt]}
      </AppText>
      <View style={styles.prompt}>
        {step.prompt === 'hanzi' && (
          <View style={styles.promptWord}>
            <Hanzi size={60}>{word.simplified}</Hanzi>
            <SoundButton src={word.audioUrl} />
          </View>
        )}
        {step.prompt === 'meaning' && (
          <AppText weight="700" center style={styles.meaningPrompt}>
            {shortMeaning(word.meaningVi ?? '')}
          </AppText>
        )}
        {step.prompt === 'audio' && <SoundButton src={word.audioUrl} big />}
      </View>
      <OptionList
        options={step.options}
        answer={step.answer}
        picked={picked}
        hanzi={step.prompt !== 'hanzi'}
        onPick={onPick}
      />
    </View>
  );
}

export function SentenceStep({
  step,
  picked,
  onPick,
}: {
  step: SentenceStepData;
  picked: number | null;
  onPick: (i: number) => void;
}) {
  const theme = useTheme();
  const fill = picked === null ? null : step.options[step.answer];
  return (
    <View style={styles.center}>
      <AppText weight="600" color="muted">
        Điền từ vào chỗ trống
      </AppText>
      <Hanzi size={30} style={styles.sentence}>
        {step.before}
        {/* Web là ô gạch chân 64px; chữ lồng trong câu không có viền nên dùng gạch chân màu. */}
        <Text
          style={{
            color: fill ? theme.good : theme.text,
            textDecorationLine: 'underline',
            textDecorationColor: fill ? theme.good : theme.primary,
          }}>
          {fill ? ` ${fill} ` : '\u3000\u3000\u3000'}
        </Text>
        {step.after}
      </Hanzi>
      {step.vi && (
        <AppText color="muted" center style={styles.sentenceVi}>
          “{step.vi}”
        </AppText>
      )}
      <OptionList options={step.options} answer={step.answer} picked={picked} hanzi onPick={onPick} />
    </View>
  );
}

interface Tile {
  wordId: string;
  label: string;
}

function shuffled<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Ghép Hán tự với nghĩa. Sai 1 cặp = tính 1 lần sai cho từ bên chữ Hán. */
export function MatchStep({
  words,
  onMistake,
  onDone,
}: {
  words: SessionWord[];
  onMistake: (wordId: string) => void;
  onDone: () => void;
}) {
  const theme = useTheme();
  const [left] = useState<Tile[]>(() => shuffled(words.map((w) => ({ wordId: w.id, label: w.simplified }))));
  const [right] = useState<Tile[]>(() =>
    shuffled(words.map((w) => ({ wordId: w.id, label: shortMeaning(w.meaningVi ?? '') }))),
  );
  const [selZh, setSelZh] = useState<string | null>(null);
  const [selVi, setSelVi] = useState<string | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [wrong, setWrong] = useState<{ zh: string; vi: string } | null>(null);

  function check(zh: string, vi: string) {
    setSelZh(null);
    setSelVi(null);
    if (zh === vi) {
      const next = new Set(matched).add(zh);
      setMatched(next);
      if (next.size === words.length) setTimeout(onDone, 450);
      return;
    }
    onMistake(zh);
    setWrong({ zh, vi });
    setTimeout(() => setWrong(null), 500);
  }

  function tileStyle(wordId: string, selected: boolean, isWrong: boolean) {
    if (matched.has(wordId)) return [{ borderColor: alpha(theme.good, 0.4), backgroundColor: alpha(theme.good, 0.1) }, styles.matched];
    if (isWrong) return { borderColor: theme.danger, backgroundColor: alpha(theme.danger, 0.1) };
    if (selected) return { borderColor: theme.primary, backgroundColor: alpha(theme.primary, 0.1) };
    return { borderColor: theme.border, backgroundColor: theme.surface };
  }

  return (
    <View style={styles.center}>
      <AppText weight="600" color="muted">
        Ghép từ với nghĩa
      </AppText>
      <View style={styles.matchGrid}>
        <View style={styles.matchColumn}>
          {left.map((t) => (
            <Pressable
              key={t.wordId}
              disabled={matched.has(t.wordId)}
              onPress={() => {
                playWord(words.find((w) => w.id === t.wordId)?.audioUrl);
                if (selVi) check(t.wordId, selVi);
                else setSelZh(t.wordId);
              }}
              style={[styles.tile, tileStyle(t.wordId, selZh === t.wordId, wrong?.zh === t.wordId)]}>
              <Hanzi size={24} color={matched.has(t.wordId) ? 'good' : 'text'}>
                {t.label}
              </Hanzi>
            </Pressable>
          ))}
        </View>
        <View style={styles.matchColumn}>
          {right.map((t) => (
            <Pressable
              key={t.wordId}
              disabled={matched.has(t.wordId)}
              onPress={() => {
                if (selZh) check(selZh, t.wordId);
                else setSelVi(t.wordId);
              }}
              style={[styles.tile, tileStyle(t.wordId, selVi === t.wordId, wrong?.vi === t.wordId)]}>
              <AppText weight="600" center color={matched.has(t.wordId) ? 'good' : 'text'}>
                {t.label}
              </AppText>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center' },
  flex: { flex: 1, minWidth: 0 },
  badge: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 },
  badgeText: { letterSpacing: 0.3 },
  image: { marginTop: 20, width: 160, height: 112, borderRadius: 16 },
  wordRow: { marginTop: 20, flexDirection: 'row', alignItems: 'flex-end', gap: 16 },
  sound: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  soundBig: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  meaning: { marginTop: 20, fontSize: 24, lineHeight: 32 },
  box: { alignSelf: 'stretch', borderRadius: 16, paddingHorizontal: 16 },
  hanvietBox: { marginTop: 16, borderWidth: 1, paddingVertical: 12 },
  hints: { marginTop: 8, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6 },
  hint: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  mnemonic: { marginTop: 12, borderWidth: 1, paddingVertical: 10 },
  line24: { lineHeight: 24 },
  example: { marginTop: 16, paddingVertical: 12 },
  exampleVi: { marginTop: 4 },
  prompt: { marginVertical: 28, minHeight: 112, alignItems: 'center', justifyContent: 'center' },
  promptWord: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  meaningPrompt: { fontSize: 24, lineHeight: 32 },
  sentence: { marginVertical: 24, lineHeight: 48, textAlign: 'center' },
  sentenceVi: { marginTop: -8, marginBottom: 24 },
  options: { alignSelf: 'stretch', gap: 12 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 64,
    borderWidth: 2,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  optionIndex: { width: 28, height: 28, borderWidth: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  dim: { opacity: 0.5 },
  matched: { opacity: 0.6 },
  matchGrid: { marginTop: 24, flexDirection: 'row', gap: 12, alignSelf: 'stretch' },
  matchColumn: { flex: 1, gap: 12 },
  tile: {
    minHeight: 56,
    borderWidth: 2,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});
