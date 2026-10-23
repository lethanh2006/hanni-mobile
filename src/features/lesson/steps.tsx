import { useEffect, useState } from 'react';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { TonePinyin } from '@/components/tone-pinyin';
import { AppText, AudioButton } from '@/components/ui';
import { Radius, Spacing, ToneColors } from '@/constants/theme';
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

/** Thẻ giới thiệu từ mới: Hán tự + pinyin tô màu, âm Hán Việt kèm mẹo thanh điệu, nghĩa, câu ví dụ. */
export function IntroStep({ word }: { word: SessionWord }) {
  const theme = useTheme();
  useEffect(() => {
    playWord(word.audioUrl);
  }, [word.audioUrl]);

  const example = word.examples[0];
  const hints = word.toneHints?.filter((h) => h.follows !== null) ?? [];

  return (
    <View style={styles.center}>
      <View style={[styles.badge, { backgroundColor: theme.primarySoft }]}>
        <AppText variant="label" color="primary">
          Từ mới
        </AppText>
      </View>
      {word.imageUrl && <Image source={word.imageUrl} style={styles.image} contentFit="cover" />}
      <View style={styles.wordRow}>
        <TonePinyin zh={word.simplified} pinyin={word.pinyin} pinyinNum={word.pinyinNumeric} size="lg" />
        <AudioButton src={word.audioUrl} />
      </View>
      <AppText variant="title" center>
        {word.meaningVi ?? word.meaningEn ?? 'Đang cập nhật nghĩa'}
      </AppText>

      {word.hanViet && (
        <View style={[styles.box, { borderColor: theme.hanviet, backgroundColor: theme.surface }]}>
          <AppText center>
            Âm Hán Việt:{' '}
            <AppText bold color="hanviet">
              {word.hanViet}
            </AppText>
          </AppText>
          {hints.map((h, i) => (
            <AppText key={`${h.char}-${i}`} variant="small" color="muted" center>
              {h.hanViet} →{' '}
              <Text style={{ color: ToneColors[String(h.tone)], fontWeight: '700' }}>thanh {h.tone}</Text>
              {h.follows ? ` ✓ ${TONE_RULE_TEXT[h.rule] ?? ''}` : ' (ngoại lệ, nhớ riêng nhé)'}
            </AppText>
          ))}
        </View>
      )}

      {word.mnemonicVi && (
        <View style={[styles.box, { borderColor: theme.accent, backgroundColor: theme.surface }]}>
          <AppText variant="small">
            <AppText variant="small" bold color="accent">
              Mẹo nhớ:{' '}
            </AppText>
            {word.mnemonicVi}
          </AppText>
        </View>
      )}

      {example && (
        <View style={[styles.box, { borderColor: theme.border, backgroundColor: theme.surface2 }]}>
          <AppText variant="heading">{example.zh}</AppText>
          {example.pinyin && (
            <AppText variant="caption" color="muted">
              {example.pinyin}
            </AppText>
          )}
          {example.vi && <AppText variant="small">{example.vi}</AppText>}
        </View>
      )}
    </View>
  );
}

/** Danh sách phương án trắc nghiệm. Sau khi chọn: đáp án đúng xanh, phương án chọn sai đỏ. */
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
            ? { borderColor: theme.good, backgroundColor: theme.goodSoft }
            : state === 'wrong'
              ? { borderColor: theme.danger, backgroundColor: theme.dangerSoft }
              : { borderColor: theme.border, backgroundColor: theme.surface };
        return (
          <Pressable
            key={`${opt}-${i}`}
            disabled={picked !== null}
            onPress={() => onPick(i)}
            accessibilityRole="button"
            style={[styles.option, look, state === 'dim' && styles.dim]}>
            <View style={[styles.optionIndex, { borderColor: theme.border }]}>
              <AppText variant="caption" color="muted">
                {i + 1}
              </AppText>
            </View>
            <AppText variant={hanzi ? 'title' : 'body'} bold={!hanzi} style={styles.flex}>
              {opt}
            </AppText>
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
  const theme = useTheme();
  useEffect(() => {
    if (step.prompt === 'audio') playWord(word.audioUrl);
  }, [step.prompt, word.audioUrl]);

  return (
    <View style={styles.center}>
      <AppText variant="small" bold color="muted">
        {CHOICE_QUESTION[step.prompt]}
      </AppText>
      <View style={styles.prompt}>
        {step.prompt === 'hanzi' && (
          <View style={styles.wordRow}>
            <Text style={[styles.bigHanzi, { color: theme.text }]}>{word.simplified}</Text>
            <AudioButton src={word.audioUrl} />
          </View>
        )}
        {step.prompt === 'meaning' && (
          <AppText variant="title" center>
            {shortMeaning(word.meaningVi ?? '')}
          </AppText>
        )}
        {step.prompt === 'audio' && <AudioButton src={word.audioUrl} big />}
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
      <AppText variant="small" bold color="muted">
        Điền từ vào chỗ trống
      </AppText>
      <Text style={[styles.sentence, { color: theme.text }]}>
        {step.before}
        <Text style={{ color: fill ? theme.good : theme.primary, textDecorationLine: 'underline' }}>
          {fill ?? '　　'}
        </Text>
        {step.after}
      </Text>
      {step.vi && (
        <AppText variant="small" color="muted" center>
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
    if (matched.has(wordId)) return [{ borderColor: theme.good, backgroundColor: theme.goodSoft }, styles.dim];
    if (isWrong) return { borderColor: theme.danger, backgroundColor: theme.dangerSoft };
    if (selected) return { borderColor: theme.primary, backgroundColor: theme.primarySoft };
    return { borderColor: theme.border, backgroundColor: theme.surface };
  }

  return (
    <View style={styles.center}>
      <AppText variant="small" bold color="muted">
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
              <AppText variant="title">{t.label}</AppText>
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
              <AppText variant="small" bold center>
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
  center: { alignItems: 'center', gap: Spacing.lg },
  flex: { flex: 1 },
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: Radius.pill },
  image: { width: 160, height: 112, borderRadius: Radius.lg },
  wordRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.md },
  box: { alignSelf: 'stretch', borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.md, gap: 4 },
  prompt: { minHeight: 112, alignItems: 'center', justifyContent: 'center' },
  bigHanzi: { fontSize: 56, lineHeight: 70 },
  sentence: { fontSize: 28, lineHeight: 44, textAlign: 'center' },
  options: { alignSelf: 'stretch', gap: Spacing.md },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    minHeight: 60,
    borderWidth: 2,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  optionIndex: {
    width: 28,
    height: 28,
    borderWidth: 1,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dim: { opacity: 0.5 },
  matchGrid: { flexDirection: 'row', gap: Spacing.md, alignSelf: 'stretch' },
  matchColumn: { flex: 1, gap: Spacing.md },
  tile: {
    minHeight: 60,
    borderWidth: 2,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.sm,
  },
});
