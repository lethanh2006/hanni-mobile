import { Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';
import useSWR from 'swr';

import {
  AppText,
  Button,
  Card,
  EmptyState,
  Hanzi,
  Icon,
  Loading,
  NextStep,
  PageHeader,
  Screen,
  TourButton,
  type IconName,
  type TourStep,
} from '@/components/ui';
import { alpha, Fonts } from '@/constants/theme';
import { HanziWriterView, type HanziWriterHandle, type WriterEvent, type WriterMode } from '@/features/writing/hanzi-writer-view';
import { useTheme } from '@/hooks/use-theme';
import { WEB_ORIGIN } from '@/lib/api';
import { useCurrentLesson, useLesson } from '@/lib/hooks';
import { HSK_LEVELS, hskLabel } from '@/lib/hsk';

interface HanziEntry {
  c: string;
  level: number;
  pinyin: string;
}

const TOUR: TourStep[] = [
  {
    icon: 'pencil',
    title: 'Ba bước, đi theo thứ tự',
    description:
      'Bắt đầu ở "1. Xem" để nhìn đúng thứ tự nét, sang "2. Tô lại" để tô theo nét mờ, rồi "3. Tự viết" để kiểm tra trí nhớ. Nút bên dưới khung luôn cho bạn làm lại bước đang đứng.',
  },
  {
    icon: 'route',
    title: 'Mặc định là chữ trong bài đang học',
    description:
      'Danh sách chỉ hiện những chữ có trong bài bạn đang học, để luyện viết không lạc khỏi lộ trình. Muốn rộng hơn thì bấm "Cả cấp HSK", hoặc gõ thẳng chữ/pinyin vào ô tìm.',
  },
  {
    icon: 'book',
    title: 'Viết xong nhớ tra nghĩa',
    description:
      'Cuối trang có lối sang trang từ điển của đúng chữ vừa viết — xem âm Hán Việt và nghĩa để nhớ cả mặt chữ lẫn nghĩa, thay vì chỉ thuộc tay.',
  },
];

/** 3 bước đánh số để người mới biết bắt đầu từ đâu; nút dưới khung đổi nhãn theo bước đang đứng. */
const MODES: { key: WriterMode; label: string; icon: IconName; hint: string; replay: string }[] = [
  { key: 'watch', label: '1. Xem', icon: 'eye', hint: 'Chữ tự động vẽ theo đúng thứ tự nét — chỉ cần quan sát.', replay: 'Xem lại từ đầu' },
  { key: 'trace', label: '2. Tô lại', icon: 'pencil', hint: 'Nét mờ hiện sẵn — bạn dùng ngón tay tô lại theo đúng nét.', replay: 'Tô lại từ đầu' },
  { key: 'test', label: '3. Tự viết', icon: 'check', hint: 'Không còn nét mờ — tự viết lại chữ từ trí nhớ để kiểm tra.', replay: 'Viết lại từ đầu' },
];

/** Danh sách 3.088 chữ HSK có dữ liệu nét (file tĩnh của web Hanni, cho phép CORS). */
const fetchIndex = (url: string) => fetch(url).then((r) => (r.ok ? (r.json() as Promise<HanziEntry[]>) : Promise.reject(r)));

/** Luyện viết Hán tự (`/writing` của web): xem thứ tự nét → tô theo nét mờ → tự viết. `?c=字` mở thẳng 1 chữ. */
export default function WritingScreen() {
  const theme = useTheme();
  const { c: wanted } = useLocalSearchParams<{ c?: string }>();
  const { width } = useWindowDimensions();
  const { data: index, error: indexError } = useSWR<HanziEntry[]>(`${WEB_ORIGIN}/hanzi-strokes/index.json`, fetchIndex, {
    revalidateOnFocus: false,
    revalidateIfStale: false,
  });
  const wantedEntry = wanted ? index?.find((d) => d.c === wanted) : undefined;
  const [level, setLevel] = useState<number | null>(null);
  const [q, setQ] = useState('');
  // Mặc định luyện ĐÚNG các chữ trong bài đang học, thay vì đổ ra cả nghìn chữ của một cấp.
  const current = useCurrentLesson();
  const lessonDetail = useLesson(current.data?.id ?? null);
  const [byLesson, setByLesson] = useState<boolean | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const [mode, setMode] = useState<WriterMode>('watch');
  const [event, setEvent] = useState<WriterEvent | null>(null);
  const [strokes, setStrokes] = useState<number | null>(null);
  const writer = useRef<HanziWriterHandle>(null);

  const lessonChars = useMemo(() => {
    const words = lessonDetail.data?.words;
    return words?.length ? new Set(words.flatMap((w) => Array.from(w.simplified))) : null;
  }, [lessonDetail.data]);
  // Bài toàn chữ không có dữ liệu nét thì lọc ra rỗng — chỉ bật chế độ bài học khi có chữ luyện được.
  const lessonWritable = index && lessonChars ? index.filter((e) => lessonChars.has(e.c)).length : 0;
  // `?c=` (từ nút "Luyện viết" ở trang từ điển) mở thẳng chữ đó trong cả cấp của nó.
  const lessonMode = byLesson ?? !wantedEntry;
  const lessonScope = lessonMode && lessonWritable > 0;
  const shownLevel = level ?? wantedEntry?.level ?? 1;

  const filtered = useMemo(() => {
    if (!index) return [];
    const term = q.trim().toLowerCase();
    return index.filter((e) => {
      if (lessonScope) {
        if (!lessonChars?.has(e.c)) return false;
      } else if (e.level !== shownLevel) return false;
      return !term || e.c.includes(term) || e.pinyin.toLowerCase().includes(term);
    });
  }, [index, q, lessonScope, lessonChars, shownLevel]);

  // Luôn lấy trong danh sách ĐANG LỌC: đổi phạm vi mà giữ chữ cũ không thuộc danh sách thì hiển thị lệch.
  const activeEntry = filtered.find((e) => e.c === (active ?? wanted)) ?? filtered[0] ?? null;
  const activeIdx = activeEntry ? filtered.findIndex((e) => e.c === activeEntry.c) : -1;
  const size = Math.max(220, Math.min(280, width - 100));
  const modeInfo = MODES.find((m) => m.key === mode) ?? MODES[0];

  function choose(c: string) {
    setActive(c);
    setMode('watch');
    setEvent(null);
    setStrokes(null);
  }

  function step(delta: number) {
    if (!filtered.length) return;
    const base = activeIdx >= 0 ? activeIdx : 0;
    choose(filtered[(base + delta + filtered.length) % filtered.length].c);
  }

  function run(next: WriterMode) {
    setMode(next);
    setEvent(null);
    writer.current?.run(next);
  }

  const chipOn = { borderColor: alpha(theme.primary, 0.5), backgroundColor: alpha(theme.primary, 0.1) };

  return (
    <Screen contentStyle={styles.page}>
      <Stack.Screen options={{ title: 'Luyện viết Hán tự' }} />
      <PageHeader
        icon="pencil"
        title="Luyện viết Hán tự"
        description="Xem thứ tự nét, tô theo nét mờ, rồi tự viết lại để kiểm tra trí nhớ."
        right={<TourButton steps={TOUR} />}
      />

      <Card style={styles.picker}>
        <View style={[styles.search, { borderColor: alpha(theme.border, 0.8), backgroundColor: alpha(theme.surface, 0.8) }]}>
          <Icon name="search" size={17} color="muted" />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Tìm chữ, pinyin…"
            placeholderTextColor={theme.muted}
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel="Tìm chữ hoặc pinyin"
            style={[styles.searchInput, { color: theme.text }]}
          />
        </View>
        {lessonWritable > 0 && (
          <View style={[styles.scope, { backgroundColor: theme.surface2 }]}>
            <View style={styles.scopeRow}>
              {[
                { on: true, label: 'Bài đang học' },
                { on: false, label: 'Cả cấp HSK' },
              ].map((o) => {
                const selected = lessonMode === o.on;
                return (
                  <Pressable
                    key={o.label}
                    onPress={() => setByLesson(o.on)}
                    accessibilityState={{ selected }}
                    style={[styles.scopeButton, selected ? chipOn : { borderColor: 'transparent' }]}>
                    <AppText variant="caption" weight="500" color={selected ? 'primary' : 'muted'}>
                      {o.label}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
            {lessonMode && current.data && (
              <AppText variant="caption" color="muted" style={styles.scopeLesson}>
                Bài {current.data.orderIndex}: {current.data.title}
              </AppText>
            )}
          </View>
        )}
        {!lessonScope && (
          <View style={styles.levels} accessibilityLabel="Lọc theo cấp HSK">
            {HSK_LEVELS.map((l) => (
              <Pressable
                key={l}
                onPress={() => setLevel(l)}
                accessibilityState={{ selected: shownLevel === l }}
                style={[styles.level, shownLevel === l ? chipOn : { borderColor: theme.border, backgroundColor: theme.surface }]}>
                <AppText variant="caption" weight="500" color={shownLevel === l ? 'primary' : 'muted'}>
                  {hskLabel(l)}
                </AppText>
              </Pressable>
            ))}
          </View>
        )}
        <ScrollView style={styles.gridScroll} nestedScrollEnabled>
          {!index ? (
            indexError ? null : <Loading />
          ) : filtered.length === 0 ? (
            <AppText variant="caption" color="muted" center style={styles.none}>
              Không tìm thấy chữ phù hợp.
            </AppText>
          ) : (
            <View style={styles.grid}>
              {filtered.map((e) => {
                const on = activeEntry?.c === e.c;
                return (
                  <Pressable
                    key={e.c}
                    onPress={() => choose(e.c)}
                    accessibilityState={{ selected: on }}
                    style={[styles.cell, on ? chipOn : { borderColor: theme.border, backgroundColor: theme.surface }]}>
                    <Hanzi size={20} color={on ? 'primary' : 'text'}>
                      {e.c}
                    </Hanzi>
                  </Pressable>
                );
              })}
            </View>
          )}
        </ScrollView>
        {index && (
          <AppText variant="caption" color="muted" center>
            {filtered.length} / {index.length} chữ
          </AppText>
        )}
      </Card>

      <Card style={styles.board}>
        {indexError ? (
          <EmptyState title="Chưa tải được danh sách chữ" description="Vui lòng thử lại sau." />
        ) : !activeEntry ? (
          <Loading />
        ) : (
          <>
            <View style={styles.charRow}>
              <Pressable
                onPress={() => step(-1)}
                disabled={filtered.length < 2}
                accessibilityLabel="Chữ trước"
                style={[styles.arrow, { borderColor: theme.border, backgroundColor: theme.surface }, filtered.length < 2 && styles.faded]}>
                <Icon name="back" size={16} color="muted" />
              </Pressable>
              <View style={styles.charInfo}>
                <Hanzi size={48}>{activeEntry.c}</Hanzi>
                <View style={styles.meta}>
                  <AppText color="primary">{activeEntry.pinyin}</AppText>
                  <View style={[styles.tag, { backgroundColor: alpha(theme.primary, 0.08) }]}>
                    <AppText variant="caption" weight="500" color="primary">
                      HSK {activeEntry.level}
                    </AppText>
                  </View>
                  {strokes != null && (
                    <View style={[styles.tag, { backgroundColor: theme.surface2 }]}>
                      <AppText variant="caption" weight="500" color="muted">
                        {strokes} nét
                      </AppText>
                    </View>
                  )}
                </View>
              </View>
              <Pressable
                onPress={() => step(1)}
                disabled={filtered.length < 2}
                accessibilityLabel="Chữ tiếp theo"
                style={[styles.arrow, { borderColor: theme.border, backgroundColor: theme.surface }, filtered.length < 2 && styles.faded]}>
                <Icon name="arrow" size={16} color="muted" />
              </Pressable>
            </View>

            <View style={styles.writer}>
              <View style={styles.modes} accessibilityLabel="Chế độ luyện viết">
                {MODES.map((m) => {
                  const on = mode === m.key;
                  return (
                    <Pressable
                      key={m.key}
                      onPress={() => run(m.key)}
                      disabled={strokes === null}
                      accessibilityState={{ selected: on }}
                      style={[
                        styles.mode,
                        on ? chipOn : { borderColor: theme.border, backgroundColor: theme.surface },
                        strokes === null && styles.half,
                      ]}>
                      <Icon name={m.icon} size={15} color={on ? 'primary' : 'muted'} />
                      <AppText variant="caption" weight="500" color={on ? 'primary' : 'muted'}>
                        {m.label}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
              <View style={styles.hint}>
                <Icon name="info" size={14} color="primary" />
                <AppText variant="caption" color="muted" style={styles.flex}>
                  {modeInfo.hint}
                </AppText>
              </View>
              <View style={[styles.canvas, { borderColor: theme.border, backgroundColor: alpha(theme.surface2, 0.5) }]}>
                <HanziWriterView
                  key={activeEntry.c}
                  ref={writer}
                  char={activeEntry.c}
                  size={size}
                  onEvent={(e) => {
                    if (e.type === 'ready') {
                      setStrokes(e.strokes);
                      writer.current?.run('watch');
                    }
                    setEvent(e);
                  }}
                />
              </View>
              <View style={styles.footer}>
                <View style={styles.flex}>
                  {event?.type === 'mistake' && (
                    <AppText variant="caption" color="danger">
                      Sai nét rồi, thử lại nét này nhé.
                    </AppText>
                  )}
                  {event?.type === 'correct' && (
                    <AppText variant="caption" color="good">
                      Đúng nét — tiếp tục nào.
                    </AppText>
                  )}
                  {event?.type === 'done' && (
                    <AppText variant="caption" weight="500" color="good">
                      ✓ Xong! {event.mistakes === 0 ? 'Không sai nét nào.' : `Sai ${event.mistakes} lần.`}
                    </AppText>
                  )}
                  {event?.type === 'error' && (
                    <AppText variant="caption" color="muted">
                      Chưa có dữ liệu nét viết cho chữ này.
                    </AppText>
                  )}
                </View>
                <Button
                  title={modeInfo.replay}
                  leftIcon="refresh"
                  variant="secondary"
                  disabled={strokes === null}
                  onPress={() => run(mode)}
                />
              </View>
            </View>
          </>
        )}
      </Card>

      {/* Viết xong là cụt đường nếu không gợi ý gì — tra nghĩa chính chữ vừa viết, rồi ôn lại. */}
      <NextStep
        title="Viết xong rồi, nhớ nghĩa chưa?"
        description={
          activeEntry
            ? `Xem nghĩa và âm Hán Việt của ${activeEntry.c}, hoặc ôn lại những từ đã học.`
            : 'Tra nghĩa các chữ vừa viết, hoặc ôn lại những từ đã học.'
        }
        actions={[
          ...(activeEntry
            ? [{ href: `/tu-dien/${encodeURIComponent(activeEntry.c)}` as const, label: `Nghĩa của ${activeEntry.c}`, icon: 'book' as const }]
            : []),
          { href: '/study', label: 'Ôn tập flashcard', icon: 'cards' },
          { href: '/', label: 'Lộ trình HSK', icon: 'route' },
        ]}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { gap: 28 },
  flex: { flex: 1, minWidth: 0 },
  picker: { gap: 16 },
  search: { minHeight: 46, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 12, paddingLeft: 14 },
  searchInput: { flex: 1, fontFamily: Fonts.sans, fontSize: 14, paddingVertical: 12, paddingRight: 14 },
  scope: { borderRadius: 12, padding: 6, gap: 6 },
  scopeRow: { flexDirection: 'row', gap: 6 },
  scopeButton: { flex: 1, minHeight: 36, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 8, paddingHorizontal: 8 },
  scopeLesson: { paddingHorizontal: 4, paddingBottom: 2 },
  levels: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  level: { minHeight: 32, justifyContent: 'center', borderWidth: 1, borderRadius: 8, paddingHorizontal: 10 },
  gridScroll: { maxHeight: 420 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  cell: { width: '18.4%', height: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 8 },
  none: { paddingVertical: 24 },
  board: { alignItems: 'center', gap: 8, paddingVertical: 32 },
  charRow: { alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16 },
  arrow: { width: 36, height: 36, borderWidth: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  faded: { opacity: 0.4 },
  charInfo: { alignItems: 'center', gap: 4 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tag: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  writer: { marginTop: 16, alignSelf: 'stretch', gap: 16 },
  modes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  mode: { minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8 },
  half: { opacity: 0.5 },
  hint: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  canvas: { alignSelf: 'center', borderWidth: 1, borderRadius: 16, padding: 12 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
});
