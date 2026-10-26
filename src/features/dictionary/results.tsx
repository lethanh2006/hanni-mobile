import { router } from 'expo-router';
import { useRef, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import useSWR from 'swr';

import { AppText, AudioButton, Button, Card, Hanzi, Icon, Skeleton, type IconName } from '@/components/ui';
import { alpha } from '@/constants/theme';
import { HanziWriterView, type HanziWriterHandle } from '@/features/writing/hanzi-writer-view';
import { useTheme } from '@/hooks/use-theme';
import { hskLabel } from '@/lib/hsk';
import type { Paginated, Word } from '@/lib/types';

import type { CharInfo, ExampleHit, GrammarHit, SegToken } from './types';
import { WordRow } from './word-row';

const openWord = (s: string) => router.push(`/tu-dien/${encodeURIComponent(s)}`);

/** Từ loại tiếng Việt (`POS_VI` của web). */
const POS_VI: Record<string, string> = {
  NOUN: 'danh từ',
  VERB: 'động từ',
  ADJ: 'tính từ',
  ADV: 'phó từ',
  PRON: 'đại từ',
  NUM: 'số từ',
  MEASURE: 'lượng từ',
  CLASSIFIER: 'lượng từ',
  PREP: 'giới từ',
  CONJ: 'liên từ',
  PARTICLE: 'trợ từ',
  INTERJ: 'thán từ',
};

/** Khối có tiêu đề nhỏ đậm + biểu tượng đỏ (`Card` cục bộ ở trang từ điển của web). */
export function DictCard({
  title,
  icon,
  action,
  children,
}: {
  title: string;
  icon: IconName;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card style={styles.dictCard}>
      <View style={styles.dictHead}>
        <View style={styles.dictTitle}>
          <Icon name={icon} size={16} color="primary" />
          <AppText weight="700">{title}</AppText>
        </View>
        {action}
      </View>
      {children}
    </Card>
  );
}

/** Phân trang "← Trước · Trang x/y · Sau →". */
export function Pager({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (p: number) => void }) {
  const theme = useTheme();
  if (totalPages <= 1) return null;
  const button = (label: string, p: number) => (
    <Pressable onPress={() => onPage(p)} style={[styles.pagerButton, { borderColor: theme.border }]}>
      <AppText>{label}</AppText>
    </Pressable>
  );
  return (
    <View style={styles.pager}>
      {page > 1 && button('← Trước', page - 1)}
      <AppText color="muted">
        Trang {page}/{totalPages}
      </AppText>
      {page < totalPages && button('Sau →', page + 1)}
    </View>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return (
    <Card style={styles.empty}>
      <AppText color="muted" center>
        {children}
      </AppText>
    </Card>
  );
}

/** Gõ cả CÂU (hoặc cụm không có mục từ nào) thì tách câu theo từ điển — như trang từ điển web. */
function offerAnalysis(q: string, items: Word[]): boolean {
  const han = (q.match(/\p{Script=Han}/gu) ?? []).length;
  const words = q.split(/\s+/).filter(Boolean).length;
  if (han >= 5 || (han >= 3 && /[，。！？、,.!?\s]/.test(q)) || (han === 0 && words >= 3)) return true;
  const lower = q.toLowerCase();
  const exact = items.some(
    (w) => w.simplified === q || w.hanViet?.toLowerCase() === lower || w.meaningVi?.split(';')[0].trim().toLowerCase() === lower,
  );
  return !exact && (han >= 2 || (han === 0 && words >= 2));
}

/** Dán cả câu: mỗi từ có pinyin (trên) + âm Hán Việt (dưới) — không gọi AI. */
function Segmented({ tokens }: { tokens: SegToken[] }) {
  const theme = useTheme();
  const words = [...new Map(tokens.filter((t) => t.simplified).map((t) => [t.simplified, t])).values()];
  return (
    <DictCard title="Phiên âm + âm Hán Việt từng từ" icon="book">
      <AppText variant="caption" color="muted">
        Tách theo từ điển Hanni — bấm một từ để xem đầy đủ.
      </AppText>
      <View style={styles.tokens}>
        {tokens.map((t, i) => (
          <Pressable
            key={i}
            disabled={!t.simplified}
            onPress={() => t.simplified && openWord(t.simplified)}
            style={({ pressed }) => [styles.token, pressed && { backgroundColor: alpha(theme.primary, 0.05) }]}>
            <AppText variant="caption" color="muted">
              {t.pinyin ?? ' '}
            </AppText>
            <Hanzi size={24}>{t.text}</Hanzi>
            <AppText variant="caption" weight="700" color="hanviet">
              {t.simplified ? (t.hanViet ?? ' ').toUpperCase() : ' '}
            </AppText>
          </Pressable>
        ))}
      </View>
      {words.length > 0 && (
        <View style={[styles.segWords, { borderColor: theme.border }]}>
          {words.map((w) => (
            <Pressable key={w.simplified} onPress={() => openWord(w.simplified!)}>
              <AppText numberOfLines={1}>
                <Hanzi size={14}>{w.simplified}</Hanzi>
                <AppText color="muted"> {w.pinyin}</AppText> — {w.meaningVi ?? 'đang cập nhật'}
              </AppText>
            </Pressable>
          ))}
        </View>
      )}
    </DictCard>
  );
}

/** Tab Từ vựng: tách câu (nếu gõ câu) · thẻ "khớp chính xác" · danh sách từ liên quan · phân trang. */
export function WordResults({ q, page, onPage }: { q: string; page: number; onPage: (p: number) => void }) {
  const { data, error } = useSWR<Paginated<Word>>(`/words?q=${encodeURIComponent(q)}&page=${page}&pageSize=24`);
  const items = data?.items ?? [];
  const offer = !!data && offerAnalysis(q, items) && page === 1 && /\p{Script=Han}/u.test(q);
  const seg = useSWR<{ tokens: SegToken[] }>(offer ? `/ai/segment?q=${encodeURIComponent(q)}` : null);
  if (error) return <Empty>Chưa tra được. Bạn kiểm tra kết nối rồi thử lại nhé.</Empty>;
  if (!data)
    return (
      <View style={styles.list}>
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} height={72} radius={16} />
        ))}
      </View>
    );

  const lower = q.toLowerCase();
  const top = page === 1 ? items[0] : undefined;
  const exact =
    top &&
    (top.simplified === q ||
      top.hanViet?.toLowerCase() === lower ||
      top.pinyin.replace(/\s+/g, '').normalize('NFD').replace(/[̀-ͯ]/g, '') === lower.replace(/\s+/g, ''))
      ? top
      : undefined;
  const rest = exact ? items.slice(1) : items;
  const tokens = seg.data?.tokens ?? [];

  return (
    <View style={styles.results}>
      {tokens.length > 0 && <Segmented tokens={tokens} />}
      {exact && <ExactCard w={exact} />}
      {items.length === 0 ? (
        tokens.some((t) => t.simplified) ? null : (
          <Empty>
            Không có từ nào khớp “{q}”. Thử tab Ví dụ hoặc gõ Hán tự, pinyin, âm Hán Việt.
          </Empty>
        )
      ) : (
        rest.length > 0 && (
          <View>
            <AppText weight="700" color="muted" style={styles.listTitle}>
              {exact ? 'Từ liên quan' : `Kết quả cho “${q}”`} · {data.total}
            </AppText>
            <View style={styles.list}>
              {rest.map((w) => (
                <WordRow
                  key={w.id}
                  simplified={w.simplified}
                  pinyin={w.pinyin}
                  meaning={w.meaningVi ?? w.meaningEn}
                  hanViet={w.hanViet}
                  hskLevel={w.hskLevel}
                />
              ))}
            </View>
          </View>
        )
      )}
      <Pager page={data.page} totalPages={data.totalPages} onPage={onPage} />
    </View>
  );
}

/** Thẻ "khớp chính xác" đầu kết quả: chữ Hán rất to · [pinyin] [HÁN VIỆT] · cấp + từ loại · nghĩa · "Xem đầy đủ". */
function ExactCard({ w }: { w: Word }) {
  return (
    <Card style={styles.exact}>
      <Pressable onPress={() => openWord(w.simplified)}>
        <Hanzi size={60} color="primary">
          {w.simplified}
        </Hanzi>
      </Pressable>
      <View>
        <View style={styles.exactLine}>
          <AppText style={styles.exactPinyin}>[{w.pinyin}]</AppText>
          {w.hanViet && (
            <AppText weight="700" color="hanviet" style={styles.exactPinyin}>
              [{w.hanViet.toUpperCase()}]
            </AppText>
          )}
          <AudioButton src={w.audioUrl} size={18} />
        </View>
        <AppText variant="caption" weight="700" color="primary" style={styles.exactPos}>
          {hskLabel(w.hskLevel).toUpperCase()}
          {w.pos.length > 0 && ` · ${w.pos.map((p) => (POS_VI[p] ?? p).toUpperCase()).join(' · ')}`}
        </AppText>
        <AppText weight="500" style={styles.exactMeaning}>
          {(w.meaningVi ?? w.meaningEn ?? '').split(';').slice(0, 4).join('; ')}
        </AppText>
      </View>
      <Button title="Xem đầy đủ" variant="secondary" icon="arrow" onPress={() => openWord(w.simplified)} style={styles.self} />
    </Card>
  );
}

/** Tab Hán tự: từng chữ trong ô tra — hoạt hình thứ tự nét, Hán Việt, pinyin, nghĩa, bộ thủ, số nét, từ có chữ đó. */
export function CharResults({ q }: { q: string }) {
  const chars = [...new Set(Array.from(q).filter((c) => /\p{Script=Han}/u.test(c)))].slice(0, 6);
  if (chars.length === 0) return <Empty>Tab Hán tự cần chữ Hán — gõ hoặc dán một chữ, vd 学, 好, 爱.</Empty>;
  return (
    <View style={styles.results}>
      {chars.map((c) => (
        <CharCard key={c} char={c} />
      ))}
    </View>
  );
}

function CharCard({ char }: { char: string }) {
  const theme = useTheme();
  const writer = useRef<HanziWriterHandle>(null);
  const { data: info, error } = useSWR<CharInfo>(`/dictionary/char/${encodeURIComponent(char)}`);
  if (error)
    return (
      <Card>
        <AppText color="muted">
          Chữ <Hanzi size={14}>{char}</Hanzi> không có trong từ vựng HSK.
        </AppText>
      </Card>
    );
  if (!info) return <Skeleton height={260} radius={16} />;
  const rows: [string, ReactNode][] = [];
  if (info.hanViet)
    rows.push([
      'Hán Việt',
      <AppText key="hv" weight="700" color="hanviet">
        {info.hanViet.toUpperCase()}
      </AppText>,
    ]);
  if (info.pinyin) rows.push(['Pinyin', <AppText key="py">{info.pinyin}</AppText>]);
  rows.push([
    'Nghĩa',
    info.meaningVi ? (
      <AppText key="m">{info.meaningVi.split(';').slice(0, 4).join('; ')}</AppText>
    ) : (
      <AppText key="m" color="muted">
        không đứng riêng thành từ — xem các từ bên dưới
      </AppText>
    ),
  ]);
  if (info.radical)
    rows.push([
      'Bộ thủ',
      <AppText key="r">
        <Hanzi size={16} color="primary">
          {info.radical.char}
        </Hanzi>{' '}
        <AppText weight="700">{info.radical.nameVi.toUpperCase()}</AppText>
        <AppText color="muted"> · bộ số {info.radical.number}</AppText>
      </AppText>,
    ]);
  if (info.strokes) rows.push(['Số nét', <AppText key="s">{info.strokes}</AppText>]);
  if (info.hskLevel) rows.push(['Cấp', <AppText key="l">{hskLabel(info.hskLevel)}</AppText>]);

  return (
    <Card style={styles.charCard}>
      <View style={styles.charLeft}>
        <HanziWriterView
          ref={writer}
          char={info.char}
          size={140}
          onEvent={(e) => {
            if (e.type === 'ready') writer.current?.run('watch');
          }}
        />
        <Pressable onPress={() => router.push({ pathname: '/writing', params: { c: info.char } })} style={styles.link}>
          <Icon name="pencil" size={13} color="primary" />
          <AppText variant="caption" weight="600" color="primary">
            Tập viết
          </AppText>
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
      {info.wordSlug && (
        <Pressable onPress={() => openWord(info.wordSlug!)}>
          <AppText variant="caption" weight="600" color="primary">
            Xem mục từ <Hanzi size={12}>{info.wordSlug}</Hanzi> →
          </AppText>
        </Pressable>
      )}
      {info.words.length > 0 && (
        <View>
          <AppText variant="caption" weight="700" color="muted" style={styles.wordsTitle}>
            TỪ CÓ CHỮ {info.char}
          </AppText>
          <View style={styles.charWords}>
            {info.words.slice(0, 18).map((w) => (
              <Pressable
                key={w.simplified}
                onPress={() => openWord(w.simplified)}
                style={[styles.charWord, { borderColor: theme.border, backgroundColor: theme.surface }]}>
                <Hanzi size={14}>{w.simplified}</Hanzi>
                {w.hanViet && (
                  <AppText variant="caption" weight="600" color="hanviet">
                    {w.hanViet.toUpperCase()}
                  </AppText>
                )}
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </Card>
  );
}

/** Tab Ví dụ: câu ví dụ chứa từ/cụm đã gõ. */
export function ExampleResults({ q, page, onPage }: { q: string; page: number; onPage: (p: number) => void }) {
  const { data } = useSWR<{ items: ExampleHit[]; total: number; page: number; pageSize: number }>(
    `/dictionary/examples?q=${encodeURIComponent(q)}&page=${page}`,
  );
  if (!data) return <Skeleton height={200} radius={16} />;
  if (data.items.length === 0)
    return (
      <Empty>
        Chưa có câu ví dụ nào chứa “{q}”. Câu ví dụ hiện có cho từ HSK 1–3 — thử một từ thông dụng như 学习, 喜欢.
      </Empty>
    );
  return (
    <View style={styles.results}>
      <AppText weight="700" color="muted">
        {data.total} câu ví dụ có “{q}”
      </AppText>
      {data.items.map((ex) => (
        <Card key={ex.id} style={styles.example}>
          <Hanzi size={18} style={styles.exampleZh}>
            {ex.zh}
          </Hanzi>
          {ex.pinyin && (
            <AppText variant="caption" color="muted">
              {ex.pinyin}
            </AppText>
          )}
          {ex.vi && <AppText style={styles.exampleVi}>{ex.vi}</AppText>}
          <Pressable onPress={() => openWord(ex.word.simplified)} style={styles.exampleOf}>
            <AppText variant="caption" color="muted">
              Ví dụ của <Hanzi size={14} color="primary">{ex.word.simplified}</Hanzi>
              {ex.word.hanViet ? (
                <AppText variant="caption" weight="700" color="hanviet">
                  {' '}
                  {ex.word.hanViet.toUpperCase()}
                </AppText>
              ) : null}{' '}
              · {hskLabel(ex.word.hskLevel)}
            </AppText>
          </Pressable>
        </Card>
      ))}
      <Pager page={page} totalPages={Math.ceil(data.total / data.pageSize)} onPage={onPage} />
    </View>
  );
}

/** Tab Ngữ pháp: điểm ngữ pháp khớp từ khoá. */
export function GrammarResults({ q }: { q: string }) {
  const theme = useTheme();
  const { data } = useSWR<GrammarHit[]>(`/grammar/search?q=${encodeURIComponent(q)}`);
  if (!data) return <Skeleton height={200} radius={16} />;
  if (data.length === 0)
    return (
      <Card style={styles.empty}>
        <AppText color="muted" center>
          Không có điểm ngữ pháp nào khớp “{q}”.
        </AppText>
        <Pressable onPress={() => router.push('/ngu-phap')} style={styles.centerLink}>
          <AppText weight="600" color="primary">
            Xem 235 điểm ngữ pháp theo cấp →
          </AppText>
        </Pressable>
      </Card>
    );
  return (
    <View style={styles.results}>
      <AppText weight="700" color="muted">
        {data.length} điểm ngữ pháp có “{q}”
      </AppText>
      {data.map((g) => (
        <Pressable
          key={g.slug}
          onPress={() => router.push(`/ngu-phap/${g.slug}`)}
          style={({ pressed }) => [
            styles.grammar,
            { borderColor: pressed ? alpha(theme.primary, 0.3) : theme.border, backgroundColor: theme.surface },
          ]}>
          <View style={styles.grammarHead}>
            <Hanzi size={18} color="primary">
              {g.titleZh}
            </Hanzi>
            <View style={[styles.badge, { backgroundColor: theme.surface2 }]}>
              <AppText variant="caption" weight="600" color="muted">
                {hskLabel(g.hskLevel)}
              </AppText>
            </View>
          </View>
          <AppText weight="600" style={styles.grammarTitle}>
            {g.titleVi}
          </AppText>
          <AppText variant="caption" color="muted" numberOfLines={2} style={styles.grammarSummary}>
            {g.summaryVi}
          </AppText>
        </Pressable>
      ))}
    </View>
  );
}

/** Danh sách từ theo cấp HSK (`/tu-dien?level=N` của web). */
export function LevelList({
  level,
  page,
  levels,
  onLevel,
  onPage,
}: {
  level: number;
  page: number;
  levels: number[];
  onLevel: (l: number) => void;
  onPage: (p: number) => void;
}) {
  const theme = useTheme();
  const { data, error } = useSWR<Paginated<Word>>(`/words?level=${level}&page=${page}&pageSize=40`);
  return (
    <View style={styles.results}>
      <View>
        <AppText variant="caption" color="muted">
          Từ điển › {hskLabel(level)}
        </AppText>
        <AppText weight="800" style={styles.levelTitle}>
          Từ vựng {hskLabel(level)}
        </AppText>
        <AppText color="muted" style={styles.levelSub}>
          {data ? `${data.total.toLocaleString('vi-VN')} từ theo chuẩn HSK 3.0, ` : ''}sắp theo mức thông dụng — kèm
          pinyin, âm Hán Việt, nghĩa.
        </AppText>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.levels}>
        {levels.map((l) => {
          const on = l === level;
          return (
            <Pressable
              key={l}
              onPress={() => onLevel(l)}
              style={[
                styles.levelChip,
                on
                  ? { borderColor: alpha(theme.primary, 0.5), backgroundColor: alpha(theme.primary, 0.1) }
                  : { borderColor: theme.border },
              ]}>
              <AppText weight={on ? '700' : '600'} color={on ? 'primary' : 'muted'}>
                {hskLabel(l)}
              </AppText>
            </Pressable>
          );
        })}
      </ScrollView>
      {error ? (
        <Empty>Chưa tải được danh sách. Vui lòng thử lại sau.</Empty>
      ) : !data ? (
        <View style={styles.list}>
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} height={72} radius={16} />
          ))}
        </View>
      ) : (
        <>
          <View style={styles.list}>
            {data.items.map((w) => (
              <WordRow
                key={w.id}
                simplified={w.simplified}
                pinyin={w.pinyin}
                meaning={w.meaningVi ?? w.meaningEn}
                hanViet={w.hanViet}
                hskLevel={w.hskLevel}
              />
            ))}
          </View>
          <Pager page={data.page} totalPages={data.totalPages} onPage={onPage} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  dictCard: { gap: 12 },
  dictHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  dictTitle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pager: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  pagerButton: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 6 },
  empty: { padding: 24, gap: 8 },
  centerLink: { alignSelf: 'center' },
  results: { gap: 16 },
  list: { gap: 8 },
  listTitle: { marginBottom: 12 },
  tokens: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end', columnGap: 4, rowGap: 12 },
  token: { alignItems: 'center', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 4 },
  segWords: { borderTopWidth: 1, paddingTop: 12, gap: 4 },
  exact: { gap: 16 },
  exactLine: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 12 },
  exactPinyin: { fontSize: 18, lineHeight: 28 },
  exactPos: { marginTop: 4, letterSpacing: 0.6 },
  exactMeaning: { marginTop: 6, fontSize: 15, lineHeight: 22 },
  self: { alignSelf: 'flex-start' },
  charCard: { gap: 16 },
  charLeft: { alignItems: 'center', gap: 8 },
  link: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dl: { gap: 6 },
  dlRow: { flexDirection: 'row', gap: 16 },
  dt: { width: 64 },
  dd: { flex: 1, minWidth: 0 },
  wordsTitle: { marginTop: 4, marginBottom: 8 },
  charWords: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  charWord: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  example: { padding: 16, gap: 2 },
  exampleZh: { lineHeight: 32 },
  exampleVi: { marginTop: 2 },
  exampleOf: { marginTop: 8 },
  grammar: { borderWidth: 1, borderRadius: 16, padding: 16 },
  grammarHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  grammarTitle: { marginTop: 4 },
  grammarSummary: { marginTop: 2 },
  levelTitle: { marginTop: 8, fontSize: 24, lineHeight: 32, letterSpacing: -0.6 },
  levelSub: { marginTop: 4 },
  levels: { gap: 8, paddingBottom: 4 },
  levelChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 6 },
});
