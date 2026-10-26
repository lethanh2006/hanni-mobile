import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, type HostInstance, type ScrollViewInstance } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Button, Hanzi, Icon, ShareButton } from '@/components/ui';
import { alpha } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { WEB_ORIGIN } from '@/lib/api';
import { addPendingWord } from '@/lib/guest-progress';
import { addWordToSrs } from '@/lib/hooks';
import { pairs } from '@/lib/pairs';
import type { MockAnswer, MockExamResult, MockPaper, MockReviewItem, MockWord } from '@/lib/types';

import { ExamBackBar } from './exam-chrome';
import { ExamItem, SharedBoard } from './exam-item';
import { mmss, officialIndexes, PART_ZH, SECTION_VI } from './labels';
import { PaperView } from './paper-view';
import { isRightAnswer, partCta, partInfo, partScores, practiceHref, SECTION_SHORT, weakest } from './part-info';

/** Từ thêm vào ôn tập là đến hạn ôn NGAY — lưu cả đống một lúc thì hàng ôn ngợp. Mỗi lần lưu tối đa 20. */
const SAVE_MAX = 20;

/**
 * Màn kết quả đề (`Result` của phòng thi web): điểm + đạt/chưa đạt, điểm từng phần thi, bảng đáp án, phân tích từng
 * phần + nên luyện thêm, chữa bài (lọc câu sai, pinyin, lưu từ ở câu sai) hoặc luyện lại câu sai.
 */
export function ExamResult({
  paper,
  result,
  answers,
  usedSec,
  pinyin,
  setPinyin,
  isGuest,
  onRetry,
}: {
  paper: MockPaper;
  result: MockExamResult;
  answers: (MockAnswer | null)[];
  usedSec: number;
  pinyin: boolean;
  setPinyin: (v: boolean) => void;
  isGuest: boolean;
  onRetry: () => void;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<'all' | 'wrong'>('wrong');
  const [mode, setMode] = useState<'review' | 'practice'>('review');
  const [practice, setPractice] = useState<Record<number, MockAnswer>>({});
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const scrollRef = useRef<ScrollViewInstance>(null);
  const contentRef = useRef<HostInstance>(null);
  const reviewRef = useRef<HostInstance>(null);
  const itemViews = useRef(new Map<number, HostInstance>());

  const review = useMemo(() => new Map(result.review.map((r) => [r.no, r])), [result]);
  const wrongItems = useMemo(() => result.review.filter((r) => !r.correct), [result]);
  const wrong = wrongItems.length;
  const wrongSet = useMemo(() => new Set(wrongItems.map((r) => r.no)), [wrongItems]);
  const parts = useMemo(() => partScores(paper, review), [paper, review]);
  const weak = weakest(parts);
  // Từ ở các câu sai (không trùng, theo thứ tự câu) — "sai ở đâu ôn từ đó" bằng 1 nút.
  const allWrongWords = useMemo(() => {
    const byId = new Map<string, MockWord>();
    for (const r of wrongItems) for (const w of r.words ?? []) byId.set(w.id, w);
    return [...byId.values()];
  }, [wrongItems]);
  const wrongWords = allWrongWords.slice(0, SAVE_MAX);
  const pct = Math.round((result.score / result.maxScore) * 100);
  const practiceDone = Object.keys(practice).length;
  const practiceRight = wrongItems.filter((r) => isRightAnswer(r, practice[r.no] ?? null)).length;

  function scrollToView(view: HostInstance | null | undefined) {
    const content = contentRef.current;
    if (!view || !content) return;
    view.measureLayout(content, (_x: number, y: number) => scrollRef.current?.scrollTo({ y: Math.max(0, y - 120), animated: true }));
  }

  function jumpTo(no: number) {
    if (filter === 'wrong' && review.get(no)?.correct) setFilter('all');
    setMode('review');
    setTimeout(() => scrollToView(itemViews.current.get(no)), 80);
  }

  function startPractice() {
    setPractice({});
    setMode('practice');
    setTimeout(() => scrollToView(reviewRef.current), 80);
  }

  async function saveWords() {
    setSaveState('saving');
    await Promise.allSettled(wrongWords.map((w) => addWordToSrs(w.id)));
    setSaveState('saved');
  }

  const chip = (active: boolean) =>
    active
      ? { borderColor: alpha(theme.primary, 0.5), backgroundColor: alpha(theme.primary, 0.1) }
      : { borderColor: theme.border, backgroundColor: theme.surface };

  return (
    <View style={styles.fill}>
      <ExamBackBar />
      <ScrollView ref={scrollRef} contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
        <View ref={contentRef} style={styles.main}>
          {/* Điểm */}
          <View style={[styles.card, styles.center, { borderColor: theme.border, backgroundColor: theme.surface }]}>
            <Image source={require('@/assets/images/mascot.png')} style={styles.mascot} contentFit="contain" />
            <AppText variant="caption" weight="700" color="primary" center style={styles.eyebrow}>
              KẾT QUẢ · {paper.title.toUpperCase()}
            </AppText>
            <AppText weight="800" style={styles.score}>
              {result.score}
              <AppText weight="800" color="muted" style={styles.scoreMax}>
                /{result.maxScore}
              </AppText>
            </AppText>
            <View
              style={[
                styles.verdict,
                { backgroundColor: result.passed ? alpha(theme.good, 0.15) : alpha(theme.danger, 0.1) },
              ]}>
              <Icon name={result.passed ? 'check' : 'close'} size={16} color={result.passed ? 'good' : 'danger'} />
              <AppText weight="700" color={result.passed ? 'good' : 'danger'}>
                {result.passed ? `ĐẠT (từ ${result.passScore} điểm)` : `CHƯA ĐẠT — cần ${result.passScore} điểm`}
              </AppText>
            </View>
            <AppText color="muted" center style={styles.comment}>
              {pct >= 90
                ? 'Rất vững! Bạn sẵn sàng đi thi cấp này — thử đề khác để chắc chắn.'
                : result.passed
                  ? 'Đã qua mốc đạt. Xem phần nào còn yếu bên dưới để kéo điểm lên cao hơn.'
                  : 'Chưa sao — xem phần nào đang yếu, luyện lại các câu sai rồi làm lại, điểm sẽ lên nhanh.'}
            </AppText>
            <View style={styles.sectionGrid}>
              {pairs([
                ...result.sections.map((s) => ({
                  key: s.kind,
                  k: `${SECTION_VI[s.kind].vi} · đúng ${s.correct}/${s.total}`,
                  v: `${s.score}/100`,
                })),
                { key: 'time', k: 'Thời gian làm', v: mmss(usedSec) },
              ])
                .map((row) => (
                  <View key={row[0].key} style={styles.gridRow}>
                    {row.map((c) => (
                      <View key={c.key} style={[styles.sectionCell, { backgroundColor: theme.surface2 }]}>
                        <AppText variant="caption" color="muted">
                          {c.k}
                        </AppText>
                        <AppText weight="700" style={styles.sectionValue}>
                          {c.v}
                        </AppText>
                      </View>
                    ))}
                  </View>
                ))}
            </View>
            <View style={styles.actions}>
              {isGuest ? (
                <Button
                  title={
                    wrongWords.length > 0
                      ? `Lưu điểm + ${wrongWords.length} từ ở câu sai — tạo tài khoản`
                      : 'Lưu điểm — tạo tài khoản miễn phí'
                  }
                  icon="arrow"
                  onPress={() => {
                    wrongWords.forEach((w) => addPendingWord(w.id));
                    router.push({ pathname: '/register', params: { next: '/thi-thu-hsk' } });
                  }}
                />
              ) : (
                <Button title="Làm đề khác" icon="arrow" onPress={() => router.navigate('/thi-thu-hsk')} />
              )}
              {wrong > 0 && (
                <Button title={`Luyện lại ${wrong} câu sai`} leftIcon="target" variant="secondary" onPress={startPractice} />
              )}
              <Button title="Làm lại cả đề" leftIcon="refresh" variant="ghost" onPress={onRetry} />
            </View>
            <ShareButton
              message={`Mình vừa được ${result.score}/${result.maxScore} điểm đề thi thử ${paper.title} trên Hanni. Thử sức xem bạn được bao nhiêu điểm nhé: ${WEB_ORIGIN}/thi-thu-hsk/${paper.slug}`}
              style={styles.share}
            />
          </View>

          {/* Bảng đáp án: nhìn 1 lượt câu nào đúng/sai, bấm số để tới câu đó. */}
          <View style={[styles.panel, { borderColor: theme.border, backgroundColor: theme.surface }]}>
            <View style={styles.panelHead}>
              <AppText weight="700" style={styles.panelTitle}>
                Bảng đáp án
              </AppText>
              <View style={styles.legend}>
                <Dot color={theme.good} label="Đúng" />
                <Dot color={theme.danger} label="Sai" />
                <Dot color={alpha(theme.muted, 0.3)} label="Bỏ trống" />
              </View>
            </View>
            {paper.sections.map((s) => {
              const nos = s.parts.flatMap((p) => p.items.map((it) => it.no));
              const rows: number[][] = [];
              for (let i = 0; i < nos.length; i += 10) rows.push(nos.slice(i, i + 10));
              return (
                <View key={s.kind} style={styles.answerSection}>
                  <AppText variant="caption" weight="600" color="muted">
                    {SECTION_VI[s.kind].vi}
                  </AppText>
                  {rows.map((row) => (
                    <View key={row[0]} style={styles.answerRow}>
                      {row.map((no) => {
                        const r = review.get(no);
                        const blank = r?.given === null || r?.given === undefined;
                        const look = r?.correct
                          ? { bg: alpha(theme.good, 0.15), fg: theme.good }
                          : blank
                            ? { bg: theme.surface2, fg: theme.muted }
                            : { bg: alpha(theme.danger, 0.12), fg: theme.danger };
                        return (
                          <Pressable
                            key={no}
                            onPress={() => jumpTo(no)}
                            accessibilityLabel={`Câu ${no}: ${r?.correct ? 'đúng' : blank ? 'bỏ trống' : 'sai'}`}
                            style={[styles.answerCell, { backgroundColor: look.bg }]}>
                            <AppText variant="caption" weight="700" style={{ color: look.fg }}>
                              {no}
                            </AppText>
                          </Pressable>
                        );
                      })}
                      {Array.from({ length: 10 - row.length }, (_, k) => (
                        <View key={`gap-${k}`} style={styles.answerGap} />
                      ))}
                    </View>
                  ))}
                </View>
              );
            })}
          </View>

          {/* Phân tích từng phần */}
          <View style={[styles.panel, { borderColor: theme.border, backgroundColor: theme.surface }]}>
            <AppText weight="700" style={styles.panelTitle}>
              Phân tích từng phần
            </AppText>
            <View style={styles.partList}>
              {parts.map((p) => {
                const ratio = p.correct / Math.max(1, p.total);
                return (
                  <View key={`${p.section}-${p.part}`}>
                    <View style={styles.partRow}>
                      <AppText style={styles.partLabel}>
                        <AppText weight="600">
                          {SECTION_SHORT[p.section]} {p.part}
                        </AppText>
                        <AppText color="muted"> · {partInfo(p.section, p.type).label}</AppText>
                      </AppText>
                      <AppText weight="700">
                        {p.correct}/{p.total}
                      </AppText>
                    </View>
                    <View style={[styles.bar, { backgroundColor: theme.surface2 }]}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            width: `${Math.max(ratio * 100, 2)}%`,
                            backgroundColor: ratio >= 0.8 ? theme.good : ratio >= 0.6 ? theme.warn : theme.danger,
                          },
                        ]}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
            {weak.length > 0 ? (
              <View style={styles.weak}>
                <AppText weight="700">Nên luyện thêm</AppText>
                {weak.map((p) => {
                  const info = partInfo(p.section, p.type);
                  const cta = partCta(p.section, p.type);
                  return (
                    <View
                      key={`${p.section}-${p.part}`}
                      style={[styles.weakCard, { borderColor: alpha(theme.warn, 0.3), backgroundColor: alpha(theme.warn, 0.08) }]}>
                      <AppText weight="600">
                        {SECTION_SHORT[p.section]} {p.part} · {info.label} — đúng {p.correct}/{p.total}
                      </AppText>
                      <AppText color="muted" style={styles.weakTip}>
                        {info.tip}
                      </AppText>
                      {/* Luyện đúng dạng câu này, gom từ mọi đề cùng cấp — khách làm được. */}
                      <View style={styles.links}>
                        <Pressable
                          onPress={() => router.push(practiceHref(paper.level, p.section, p.part))}
                          style={styles.inlineLink}
                          hitSlop={4}>
                          <AppText weight="600" color="primary">
                            Luyện riêng dạng này
                          </AppText>
                          <Icon name="arrow" size={14} color="primary" />
                        </Pressable>
                        {!isGuest && cta && (
                          <Pressable onPress={() => router.push(cta.href)} style={styles.inlineLink} hitSlop={4}>
                            <AppText weight="600" color="muted">
                              {cta.label}
                            </AppText>
                            <Icon name="arrow" size={14} color="muted" />
                          </Pressable>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <AppText weight="600" color="good" style={styles.allGood}>
                Phần nào cũng đúng từ 80% trở lên — đều tay!
              </AppText>
            )}
          </View>

          <View ref={reviewRef} style={styles.reviewArea}>
            {mode === 'practice' ? (
              <>
                <View style={styles.reviewHead}>
                  <AppText weight="800" style={styles.reviewTitle}>
                    Luyện lại câu sai
                  </AppText>
                  <AppText color="muted">
                    Đã làm {practiceDone}/{wrong} · đúng {practiceRight}
                  </AppText>
                </View>
                <AppText color="muted">Chọn lại đáp án — Hanni chấm ngay và hiện lời giải từng câu.</AppText>
                {paper.sections.map((section) =>
                  section.parts.map((part, pi) => {
                    const items = part.items.filter((it) => !review.get(it.no)?.correct);
                    if (items.length === 0) return null;
                    return (
                      <View key={part.no} style={styles.reviewPart}>
                        <AppText weight="700">
                          {SECTION_VI[section.kind].vi} · <Hanzi size={14}>{PART_ZH[officialIndexes(section.parts)[pi]]}</Hanzi>
                        </AppText>
                        {(part.type === 'match-picture' || part.type === 'match-text' || part.type === 'fill-blank') && (
                          <SharedBoard part={part} pinyin={pinyin} />
                        )}
                        {items.map((item) => {
                          const r = review.get(item.no) as MockReviewItem;
                          const picked = practice[item.no];
                          const done = picked !== undefined;
                          return (
                            <ExamItem
                              key={item.no}
                              part={part}
                              item={item}
                              section={section.kind}
                              given={done ? picked : null}
                              onChange={done ? undefined : (v) => v !== null && setPractice((p) => ({ ...p, [item.no]: v }))}
                              review={done ? { ...r, given: picked, correct: isRightAnswer(r, picked) } : undefined}
                              pinyin={pinyin}
                            />
                          );
                        })}
                      </View>
                    );
                  }),
                )}
                <View style={[styles.panel, styles.center, { borderColor: theme.border, backgroundColor: theme.surface }]}>
                  {practiceDone === wrong ? (
                    <AppText weight="700" center>
                      Lần này đúng {practiceRight}/{wrong} câu{practiceRight === wrong ? ' — sửa được hết rồi!' : '.'}
                    </AppText>
                  ) : (
                    <AppText color="muted" center>
                      Còn {wrong - practiceDone} câu chưa làm lại.
                    </AppText>
                  )}
                  <View style={styles.practiceActions}>
                    <Button title="Xem chữa bài" variant="secondary" onPress={() => setMode('review')} />
                    <Button title="Làm lại cả đề" leftIcon="refresh" variant="ghost" onPress={onRetry} />
                  </View>
                </View>
              </>
            ) : (
              <>
                <View style={styles.reviewHead}>
                  <AppText weight="800" style={styles.reviewTitle}>
                    Chữa bài
                  </AppText>
                  <View style={styles.chips}>
                    {(
                      [
                        ['wrong', `Câu sai (${wrong})`],
                        ['all', `Tất cả (${result.review.length})`],
                      ] as const
                    ).map(([k, label]) => (
                      <Pressable key={k} onPress={() => setFilter(k)} style={[styles.chip, chip(filter === k)]}>
                        <AppText variant="caption" weight="600" color={filter === k ? 'primary' : 'text'}>
                          {label}
                        </AppText>
                      </Pressable>
                    ))}
                    <Pressable
                      onPress={() => setPinyin(!pinyin)}
                      accessibilityState={{ selected: pinyin }}
                      style={[
                        styles.chip,
                        pinyin
                          ? { borderColor: alpha(theme.primary, 0.4), backgroundColor: alpha(theme.primary, 0.1) }
                          : { borderColor: theme.border, backgroundColor: theme.surface },
                      ]}>
                      <AppText variant="caption" weight="600" color={pinyin ? 'primary' : 'muted'}>
                        Pinyin
                      </AppText>
                    </Pressable>
                  </View>
                </View>
                {!isGuest && wrongWords.length > 0 && (
                  <View style={[styles.saveBox, { borderColor: alpha(theme.primary, 0.2), backgroundColor: alpha(theme.primary, 0.05) }]}>
                    <View style={styles.saveText}>
                      <Icon name="cards" size={18} color="primary" />
                      <AppText style={styles.flex}>
                        {saveState === 'saved' ? (
                          `Đã thêm ${wrongWords.length} từ vào Ôn tập — Hanni sẽ nhắc đúng lúc bạn sắp quên.`
                        ) : (
                          <>
                            <AppText weight="700">{wrongWords.length} từ</AppText>
                            {allWrongWords.length > SAVE_MAX ? ` (trong ${allWrongWords.length})` : ''} ở các câu sai. Lưu
                            để ôn, lần sau gặp là nhận ra.
                          </>
                        )}
                      </AppText>
                    </View>
                    {saveState === 'saved' ? (
                      <AppText weight="600" color="primary" onPress={() => router.push({ pathname: '/review', params: { review: '1' } })}>
                        Ôn ngay
                      </AppText>
                    ) : (
                      <Button
                        title={saveState === 'saving' ? 'Đang lưu…' : 'Lưu vào Ôn tập'}
                        disabled={saveState === 'saving'}
                        onPress={() => void saveWords()}
                        style={styles.saveButton}
                      />
                    )}
                  </View>
                )}
                {wrong === 0 && filter === 'wrong' ? (
                  <View style={[styles.panel, { borderColor: theme.border, backgroundColor: theme.surface }]}>
                    <AppText color="muted" center>
                      Không sai câu nào — xuất sắc! Chọn &quot;Tất cả&quot; để xem lại lời thoại và bản dịch.
                    </AppText>
                  </View>
                ) : (
                  <PaperView
                    paper={paper}
                    answers={answers}
                    pinyin={pinyin}
                    review={review}
                    only={filter === 'wrong' ? wrongSet : undefined}
                    compactHead
                    itemRef={(no) => (view) => {
                      if (view) itemViews.current.set(no, view);
                      else itemViews.current.delete(no);
                    }}
                  />
                )}
                <AppText variant="caption" color="muted" center>
                  Ôn thêm từ vựng HSK {paper.level === 7 ? '7–9' : paper.level}:{' '}
                  <AppText variant="caption" weight="600" color="primary" onPress={() => router.navigate('/')}>
                    học theo lộ trình
                  </AppText>
                </AppText>
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function Dot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.dotRow}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <AppText variant="caption" color="muted">
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  flex: { flex: 1, minWidth: 0 },
  main: { paddingHorizontal: 16, paddingTop: 32, gap: 24 },
  card: { borderWidth: 1, borderRadius: 16, padding: 24 },
  center: { alignItems: 'center' },
  mascot: { width: 133, height: 112 },
  eyebrow: { marginTop: 12, letterSpacing: 0.6 },
  score: { marginTop: 8, fontSize: 48, lineHeight: 56, letterSpacing: -1.2 },
  scoreMax: { fontSize: 24 },
  verdict: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  comment: { marginTop: 12 },
  sectionGrid: { alignSelf: 'stretch', marginTop: 24, gap: 12 },
  gridRow: { flexDirection: 'row', gap: 12 },
  sectionCell: { flex: 1, alignItems: 'center', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 12 },
  sectionValue: { marginTop: 2, fontSize: 20, lineHeight: 28 },
  actions: { alignSelf: 'stretch', marginTop: 24, gap: 8 },
  share: { marginTop: 16, alignSelf: 'center' },
  panel: { borderWidth: 1, borderRadius: 16, padding: 20 },
  panelHead: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  panelTitle: { fontSize: 16, lineHeight: 24 },
  legend: { flexDirection: 'row', gap: 12 },
  dotRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  answerSection: { marginTop: 12, gap: 4 },
  answerRow: { flexDirection: 'row', gap: 4 },
  answerCell: { flex: 1, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  answerGap: { flex: 1 },
  partList: { marginTop: 12, gap: 12 },
  partRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 },
  partLabel: { flex: 1, minWidth: 0 },
  bar: { marginTop: 4, height: 8, borderRadius: 999, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 999 },
  weak: { marginTop: 20, gap: 8 },
  weakCard: { borderWidth: 1, borderRadius: 16, padding: 12 },
  weakTip: { marginTop: 4, lineHeight: 24 },
  links: { marginTop: 6, flexDirection: 'row', flexWrap: 'wrap', columnGap: 16, rowGap: 4 },
  inlineLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  allGood: { marginTop: 16 },
  reviewArea: { gap: 16 },
  reviewHead: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  reviewTitle: { fontSize: 18, lineHeight: 28, letterSpacing: -0.4 },
  reviewPart: { gap: 12 },
  practiceActions: { alignSelf: 'stretch', marginTop: 12, gap: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  saveBox: { gap: 12, borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12 },
  saveText: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  saveButton: { minHeight: 36, paddingHorizontal: 16, paddingVertical: 6 },
});
