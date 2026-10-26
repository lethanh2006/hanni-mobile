import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Card, Hanzi, Icon } from '@/components/ui';
import { alpha } from '@/constants/theme';
import { HanziWriterView, type HanziWriterHandle } from '@/features/writing/hanzi-writer-view';
import { useTheme } from '@/hooks/use-theme';

/** `glyphs` của `GET /dictionary/:từ` — từng chữ của từ. */
export interface Glyph {
  char: string;
  traditional?: string | null;
  hanViet: string | null;
  pinyin: string | null;
  meaningVi: string | null;
  strokes: number | null;
  radical: { number: number; char: string; nameVi: string } | null;
}

/**
 * Khung "Hán tự" (`GlyphPanel` của web): mỗi chữ một tab (kèm chữ phồn thể nếu khác), hoạt hình thứ tự nét, âm Hán
 * Việt, pinyin, nghĩa riêng, bộ thủ, số nét; nút Tập viết + "Từ có chữ X".
 */
export function GlyphPanel({ glyphs }: { glyphs: Glyph[] }) {
  const theme = useTheme();
  const writer = useRef<HanziWriterHandle>(null);
  const tabs = glyphs.flatMap((g) => [
    { char: g.char, glyph: g, isTraditional: false },
    ...(g.traditional ? [{ char: g.traditional, glyph: g, isTraditional: true }] : []),
  ]);
  const [index, setIndex] = useState(0);
  const [counted, setCounted] = useState<Record<string, number>>({});
  const tab = tabs[Math.min(index, tabs.length - 1)];
  if (!tab) return null;
  const g = tab.glyph;
  const strokes = tab.isTraditional ? (counted[tab.char] ?? null) : (g.strokes ?? counted[tab.char] ?? null);

  const rows: [string, React.ReactNode][] = [];
  if (tab.isTraditional)
    rows.push([
      'Dạng',
      <AppText key="d">
        Phồn thể của <Hanzi size={14}>{g.char}</Hanzi>
      </AppText>,
    ]);
  if (g.hanViet)
    rows.push([
      'Hán Việt',
      <AppText key="hv" weight="700" color="hanviet">
        {g.hanViet.toUpperCase()}
      </AppText>,
    ]);
  if (g.pinyin) rows.push(['Pinyin', <AppText key="p">{g.pinyin}</AppText>]);
  if (g.meaningVi) rows.push(['Nghĩa', <AppText key="m">{g.meaningVi.split(';').slice(0, 3).join('; ')}</AppText>]);
  if (g.radical && !tab.isTraditional)
    rows.push([
      'Bộ thủ',
      <AppText key="r">
        <Hanzi size={16} color="primary">
          {g.radical.char}
        </Hanzi>{' '}
        <AppText weight="700">{g.radical.nameVi.toUpperCase()}</AppText>
        <AppText color="muted"> · bộ số {g.radical.number}</AppText>
      </AppText>,
    ]);
  if (strokes !== null) rows.push(['Số nét', <AppText key="s">{strokes} nét</AppText>]);

  return (
    <Card style={styles.card}>
      <View style={styles.tabs}>
        {tabs.map((t, i) => {
          const on = i === index;
          return (
            <Pressable
              key={`${t.char}-${i}`}
              onPress={() => setIndex(i)}
              accessibilityState={{ selected: on }}
              style={[
                styles.tab,
                on
                  ? { borderColor: alpha(theme.primary, 0.5), backgroundColor: alpha(theme.primary, 0.1) }
                  : { borderColor: 'transparent', backgroundColor: theme.surface2 },
              ]}>
              <Hanzi size={20} color={on ? 'primary' : 'text'}>
                {t.char}
              </Hanzi>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.writer}>
        <HanziWriterView
          key={tab.char}
          ref={writer}
          char={tab.char}
          size={196}
          onEvent={(e) => {
            if (e.type === 'ready') {
              setCounted((prev) => (prev[tab.char] === e.strokes ? prev : { ...prev, [tab.char]: e.strokes }));
              writer.current?.run('watch');
            }
          }}
        />
        <Pressable
          onPress={() => writer.current?.run('watch')}
          accessibilityLabel={`Xem lại thứ tự nét chữ ${tab.char}`}
          style={[styles.replay, { backgroundColor: theme.surface, boxShadow: `0 1px 2px ${alpha(theme.text, 0.1)}` }]}>
          <Icon name="refresh" size={15} color="muted" />
        </Pressable>
      </View>
      <View style={styles.dl}>
        {rows.map(([k, v]) => (
          <View key={k} style={styles.dlRow}>
            <AppText color="muted" style={styles.dt}>
              {k}
            </AppText>
            <View style={styles.dd}>{v}</View>
          </View>
        ))}
      </View>
      <View style={styles.actions}>
        <Pressable
          onPress={() => router.push({ pathname: '/writing', params: { c: g.char } })}
          style={[styles.action, { backgroundColor: alpha(theme.primary, 0.1) }]}>
          <Icon name="pencil" size={15} color="primary" />
          <AppText weight="600" color="primary">
            Tập viết
          </AppText>
        </Pressable>
        <Pressable
          onPress={() => router.navigate({ pathname: '/tu-dien', params: { q: g.char, tab: 'han-tu' } })}
          style={[styles.action, { backgroundColor: theme.surface2 }]}>
          <Icon name="search" size={15} />
          <AppText weight="600">
            Từ có chữ <Hanzi size={14}>{g.char}</Hanzi>
          </AppText>
        </Pressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 0 },
  tabs: { marginBottom: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tab: { minWidth: 40, height: 40, borderWidth: 1, borderRadius: 12, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center' },
  writer: { alignSelf: 'center' },
  replay: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dl: { marginTop: 16, gap: 8 },
  dlRow: { flexDirection: 'row', gap: 12 },
  dt: { width: 64 },
  dd: { flex: 1, minWidth: 0 },
  actions: { marginTop: 16, flexDirection: 'row', gap: 8 },
  action: { flex: 1, minHeight: 40, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
});
