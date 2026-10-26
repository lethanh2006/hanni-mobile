import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import useSWR from 'swr';

import { AppText, Button, EmptyState, Hanzi, Icon, Loading, Screen } from '@/components/ui';
import { alpha, tintPanel } from '@/constants/theme';
import { ExamItem, SharedBoard } from '@/features/mock-exam/exam-item';
import { PART_ZH, SECTION_VI } from '@/features/mock-exam/labels';
import { partInfo, SECTION_SHORT } from '@/features/mock-exam/part-info';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';
import type { MockAnswer, MockPracticeSet, MockPracticeSetMeta, MockReviewItem } from '@/lib/types';

const keyOf = (examSlug: string, no: number) => `${examSlug}:${no}`;

/**
 * Luyện từng dạng bài (`/thi-thu-hsk/dang-bai/[slug]` của web): các câu cùng 1 phần đề gom từ mọi đề cùng cấp —
 * không đồng hồ, làm câu nào chấm + chữa câu đó ngay (`POST /mock-exams/practice/check`).
 */
export default function PracticeSetScreen() {
  const theme = useTheme();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { data: set, error } = useSWR<MockPracticeSet>(`/mock-exams/practice/${slug}`);
  const { data: all } = useSWR<MockPracticeSetMeta[]>('/mock-exams/practice');
  const [answers, setAnswers] = useState<Record<string, MockAnswer | null>>({});
  const [reviews, setReviews] = useState<Record<string, MockReviewItem>>({});
  const [checking, setChecking] = useState<Record<string, boolean>>({});
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  const [pinyin, setPinyin] = useState<boolean | null>(null);
  const [round, setRound] = useState(0);

  if (error) {
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Luyện dạng bài' }} />
        <EmptyState title="Chưa tải được dạng bài này" description="Bạn kiểm tra kết nối rồi thử lại nhé." />
      </Screen>
    );
  }
  if (!set) {
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Luyện dạng bài' }} />
        <Loading />
      </Screen>
    );
  }

  const info = partInfo(set.section, set.type);
  const exams = new Set(set.groups.map((g) => g.examSlug)).size;
  const siblings = (all ?? []).filter((s) => s.level === set.level);
  const showPinyin = pinyin ?? set.showPinyin;
  const done = Object.keys(reviews).length;
  const right = Object.values(reviews).filter((r) => r.correct).length;

  async function check(examSlug: string, no: number, v: MockAnswer | null) {
    const k = keyOf(examSlug, no);
    setAnswers((a) => ({ ...a, [k]: v }));
    if (v === null) return; // câu sắp xếp chưa đủ mảnh
    setChecking((c) => ({ ...c, [k]: true }));
    setFailed((f) => ({ ...f, [k]: false }));
    try {
      const r = await api.post<MockReviewItem>('/mock-exams/practice/check', { examSlug, no, answer: v });
      setReviews((rv) => ({ ...rv, [k]: r }));
    } catch {
      setFailed((f) => ({ ...f, [k]: true }));
    } finally {
      setChecking((c) => ({ ...c, [k]: false }));
    }
  }

  function restart() {
    setAnswers({});
    setReviews({});
    setFailed({});
    setRound((r) => r + 1);
  }

  return (
    <Screen stickyHeaderIndices={[4]} contentStyle={styles.page}>
      <Stack.Screen options={{ title: `Luyện dạng bài HSK ${set.level}` }} />
      <View style={styles.crumbs}>
        <AppText color="muted" onPress={() => router.navigate('/thi-thu-hsk')}>
          Luyện thi HSK
        </AppText>
        <View style={{ transform: [{ rotate: '-90deg' }] }}>
          <Icon name="chevron" size={14} color="muted" />
        </View>
        <AppText color="muted">Luyện dạng bài HSK {set.level}</AppText>
      </View>

      <View style={[styles.header, tintPanel(theme)]}>
        <AppText variant="caption" weight="700" color="primary" style={styles.eyebrow}>
          LUYỆN TỪNG DẠNG BÀI · HSK {set.level} · {SECTION_VI[set.section].vi.toUpperCase()}{' '}
          <Hanzi size={12} color="primary">
            {PART_ZH[set.part - 1]}
          </Hanzi>
        </AppText>
        <AppText weight="800" style={styles.title}>
          {info.label}
        </AppText>
        <AppText color="muted" style={styles.lead}>
          {set.count} câu từ {exams} đề thi thử HSK {set.level} — làm câu nào chấm và chữa câu đó, không tính giờ.
        </AppText>
        {info.tip ? (
          <View style={[styles.tip, { backgroundColor: alpha(theme.surface, 0.7) }]}>
            <Icon name="spark" size={16} color="primary" />
            <AppText style={styles.tipText}>
              <AppText weight="700">Mẹo:</AppText> {info.tip}
            </AppText>
          </View>
        ) : null}
      </View>

      {siblings.length > 1 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.siblings}>
          {siblings.map((s) => {
            const current = s.slug === set.slug;
            return (
              <Pressable
                key={s.slug}
                onPress={() => !current && router.replace(`/thi-thu-hsk/dang-bai/${s.slug}`)}
                style={[
                  styles.sibling,
                  current
                    ? { borderColor: alpha(theme.primary, 0.5), backgroundColor: alpha(theme.primary, 0.1) }
                    : { borderColor: theme.border, backgroundColor: theme.surface },
                ]}>
                <AppText variant="caption" weight="600" color={current ? 'primary' : 'text'}>
                  {SECTION_SHORT[s.section]} {s.part} · {partInfo(s.section, s.type).label}
                </AppText>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : (
        <View />
      )}

      {/* Thanh tiến độ dính trên cùng khi cuộn. */}
      <View style={[styles.bar, { borderColor: theme.border, backgroundColor: alpha(theme.surface, 0.95) }]}>
        <AppText style={styles.flex}>
          Đã làm <AppText weight="700">{done}</AppText>/{set.count} câu
          {done > 0 && (
            <AppText color="muted">
              {' '}
              · đúng{' '}
              <AppText weight="700" color="good">
                {right}
              </AppText>
            </AppText>
          )}
        </AppText>
        <Pressable
          onPress={() => setPinyin(!showPinyin)}
          accessibilityState={{ selected: showPinyin }}
          style={[
            styles.pill,
            showPinyin
              ? { borderColor: alpha(theme.primary, 0.4), backgroundColor: alpha(theme.primary, 0.1) }
              : { borderColor: theme.border, backgroundColor: theme.surface },
          ]}>
          <AppText variant="caption" weight="600" color={showPinyin ? 'primary' : 'muted'}>
            Pinyin
          </AppText>
        </Pressable>
        {done > 0 && (
          <Pressable onPress={restart} style={styles.reset} hitSlop={6}>
            <Icon name="refresh" size={14} color="muted" />
            <AppText variant="caption" weight="600" color="muted">
              Làm lại
            </AppText>
          </Pressable>
        )}
      </View>

      {set.groups.map((g) => {
        const first = g.part.items[0]?.no;
        const last = g.part.items[g.part.items.length - 1]?.no;
        // Nhãn tranh của bộ tranh dùng chung chỉ có sau khi chữa ít nhất 1 câu.
        const labels = g.part.items.map((it) => reviews[keyOf(g.examSlug, it.no)]?.pictureLabels).find(Boolean);
        return (
          <View key={`${g.examSlug}-${first}`} style={styles.group}>
            <View style={styles.groupHead}>
              <AppText weight="700" style={styles.flex}>
                {g.examTitle}
                <AppText weight="400" color="muted">
                  {' '}
                  · câu {first}
                  {last !== first ? `–${last}` : ''}
                </AppText>
              </AppText>
              <AppText variant="caption" weight="600" color="primary" onPress={() => router.push(`/thi-thu-hsk/${g.examSlug}`)}>
                Làm cả đề
              </AppText>
            </View>
            <SharedBoard part={g.part} pinyin={showPinyin} labels={g.part.type === 'match-picture' ? labels : undefined} />
            {g.part.items.map((item) => {
              const k = keyOf(g.examSlug, item.no);
              const review = reviews[k];
              // Câu tự viết (HSK 4 viết phần 2): gõ chỉ lưu, bấm nút mới chấm — chấm theo từng phím thì chữ đầu đã bị khoá sai.
              const typed = g.part.type === 'write-sentence';
              return (
                <View key={`${k}-${round}`}>
                  <ExamItem
                    part={g.part}
                    item={item}
                    section={set.section}
                    given={answers[k] ?? null}
                    onChange={
                      review || checking[k]
                        ? undefined
                        : typed
                          ? (v) => setAnswers((a) => ({ ...a, [k]: v }))
                          : (v) => void check(g.examSlug, item.no, v)
                    }
                    review={review}
                    pinyin={showPinyin}
                  />
                  {typed && !review && (
                    <Button
                      title={checking[k] ? 'Đang chấm…' : 'Chấm câu này'}
                      disabled={!answers[k] || checking[k]}
                      onPress={() => void check(g.examSlug, item.no, answers[k] ?? null)}
                      style={styles.checkButton}
                    />
                  )}
                  {failed[k] && (
                    <AppText variant="caption" color="danger" style={styles.failed}>
                      Chưa chấm được — kiểm tra kết nối.{' '}
                      <AppText
                        variant="caption"
                        weight="600"
                        color="danger"
                        style={styles.underline}
                        onPress={() => void check(g.examSlug, item.no, answers[k] ?? null)}>
                        Thử lại
                      </AppText>
                    </AppText>
                  )}
                </View>
              );
            })}
          </View>
        );
      })}

      <View style={[styles.end, { borderColor: theme.border, backgroundColor: theme.surface }]}>
        {done === set.count ? (
          <AppText weight="700" center>
            Xong {set.count} câu — đúng {right}/{set.count}
            {right === set.count ? '. Dạng này bạn vững rồi!' : '.'}
          </AppText>
        ) : (
          <AppText color="muted" center>
            Còn {set.count - done} câu chưa làm.
          </AppText>
        )}
        <View style={styles.endActions}>
          <Button title="Làm đề thi thử đầy đủ" icon="arrow" onPress={() => router.navigate('/thi-thu-hsk')} />
          {done > 0 && <Button title="Làm lại dạng này" leftIcon="refresh" variant="ghost" onPress={restart} />}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { gap: 24 },
  flex: { flex: 1, minWidth: 0 },
  crumbs: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  header: { borderWidth: 1, borderRadius: 16, padding: 24 },
  eyebrow: { letterSpacing: 0.6, lineHeight: 18 },
  title: { marginTop: 6, fontSize: 24, lineHeight: 32, letterSpacing: -0.6 },
  lead: { marginTop: 8 },
  tip: { marginTop: 16, flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12 },
  tipText: { flex: 1, lineHeight: 24 },
  siblings: { gap: 8, paddingBottom: 4 },
  sibling: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  bar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  },
  pill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  reset: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 6 },
  group: { gap: 12 },
  groupHead: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  checkButton: { marginTop: 8 },
  failed: { marginTop: 6 },
  underline: { textDecorationLine: 'underline' },
  end: { borderWidth: 1, borderRadius: 16, padding: 20 },
  endActions: { marginTop: 12, gap: 8 },
});
