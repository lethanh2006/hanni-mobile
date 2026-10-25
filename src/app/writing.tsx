import { Stack, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import { AppText, Button, Card, ChipRow, EmptyState, Loading, Screen } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { ScopePicker, usePracticeWords } from '@/features/practice/practice-words';
import { HanziWriterView, type HanziWriterHandle, type WriterEvent, type WriterMode } from '@/features/writing/hanzi-writer-view';
import { useTheme } from '@/hooks/use-theme';
import type { Word } from '@/lib/types';

interface CharEntry {
  c: string;
  pinyin: string;
}

/** Các chữ Hán (không trùng) trong bộ từ đang luyện, kèm pinyin của từng chữ khi tách được. */
function charsOf(words: Word[]): CharEntry[] {
  const seen = new Map<string, CharEntry>();
  for (const w of words) {
    const chars = Array.from(w.simplified).filter((ch) => /\p{Script=Han}/u.test(ch));
    const syllables = w.pinyin.trim().split(/\s+/);
    chars.forEach((c, i) => {
      if (!seen.has(c)) seen.set(c, { c, pinyin: syllables.length === chars.length ? syllables[i] : '' });
    });
  }
  return [...seen.values()];
}

const MODES: { value: WriterMode; label: string }[] = [
  { value: 'watch', label: '1. Xem' },
  { value: 'trace', label: '2. Tô lại' },
  { value: 'test', label: '3. Tự viết' },
];

function feedbackText(e: WriterEvent | null, mode: WriterMode) {
  if (!e || e.type === 'ready') {
    return mode === 'watch' ? 'Xem kỹ thứ tự nét rồi sang bước 2.' : 'Dùng ngón tay vẽ từng nét vào khung.';
  }
  if (e.type === 'error') return 'Chưa có dữ liệu nét cho chữ này.';
  if (e.type === 'mistake') return 'Chưa đúng nét — thử lại nhé.';
  if (e.type === 'correct') return 'Đúng nét rồi, viết tiếp!';
  return e.mistakes === 0 ? 'Hoàn hảo! Không sai nét nào.' : `Xong chữ — sai ${e.mistakes} nét. Làm lại để nhớ chắc hơn.`;
}

/** Luyện viết chữ Hán theo 3 bước: xem thứ tự nét → tô theo nét mờ → tự viết. `?c=字` mở thẳng 1 chữ. */
export default function WritingScreen() {
  const theme = useTheme();
  const { c: wanted } = useLocalSearchParams<{ c?: string }>();
  const { width } = useWindowDimensions();
  const { words, loading, scope } = usePracticeWords();
  const writer = useRef<HanziWriterHandle>(null);
  const [active, setActive] = useState<string | null>(wanted ?? null);
  const [mode, setMode] = useState<WriterMode>('watch');
  const [event, setEvent] = useState<WriterEvent | null>(null);
  const [strokes, setStrokes] = useState<number | null>(null);

  const entries = charsOf(words);
  if (wanted && !entries.some((e) => e.c === wanted)) entries.unshift({ c: wanted, pinyin: '' });
  const current = entries.find((e) => e.c === active) ?? entries[0];
  const size = Math.min(300, width - 80);

  function choose(c: string) {
    setActive(c);
    setMode('watch');
    setEvent(null);
    setStrokes(null);
  }

  function run(next: WriterMode) {
    setMode(next);
    setEvent(null);
    writer.current?.run(next);
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Luyện viết chữ Hán' }} />
      <ScopePicker scope={scope} />
      {loading ? (
        <Loading />
      ) : !current ? (
        <EmptyState title="Chưa có chữ để luyện" description="Chọn cấp HSK khác để luyện viết nhé." />
      ) : (
        <>
          <Card style={styles.center}>
            <AppText variant="title">
              {current.c}{' '}
              <AppText color="primary">{current.pinyin}</AppText>
            </AppText>
            {strokes !== null && (
              <AppText variant="caption" color="muted">
                {strokes} nét
              </AppText>
            )}
            <HanziWriterView
              key={current.c}
              ref={writer}
              char={current.c}
              size={size}
              onEvent={(e) => {
                if (e.type === 'ready') {
                  setStrokes(e.strokes);
                  writer.current?.run('watch');
                }
                setEvent(e);
              }}
            />
            <ChipRow options={MODES} value={mode} onChange={run} />
            <AppText variant="small" color={event?.type === 'mistake' || event?.type === 'error' ? 'danger' : 'muted'} center>
              {feedbackText(event, mode)}
            </AppText>
            <Button title={mode === 'watch' ? 'Xem lại' : 'Làm lại bước này'} variant="secondary" onPress={() => run(mode)} />
          </Card>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chars}>
            {entries.map((e) => (
              <Pressable
                key={e.c}
                onPress={() => choose(e.c)}
                style={[
                  styles.char,
                  e.c === current.c
                    ? { borderColor: theme.primary, backgroundColor: theme.primarySoft }
                    : { borderColor: theme.border, backgroundColor: theme.surface },
                ]}>
                <AppText variant="title">{e.c}</AppText>
              </Pressable>
            ))}
          </ScrollView>
          <View style={styles.row}>
            <AppText variant="caption" color="muted">
              {entries.length} chữ trong nhóm này — bấm một chữ để luyện.
            </AppText>
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', gap: Spacing.md },
  chars: { gap: Spacing.sm },
  char: { width: 56, height: 56, borderWidth: 1.5, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  row: { alignItems: 'center' },
});
