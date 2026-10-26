import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  AppText,
  Button,
  Card,
  EmptyState,
  ErrorNote,
  Hanzi,
  Icon,
  IconTile,
  Loading,
  PageHeader,
  Screen,
  SectionHeading,
} from '@/components/ui';
import { alpha } from '@/constants/theme';
import { WordCard } from '@/features/lesson/word-card';
import { useTheme } from '@/hooks/use-theme';
import { ApiError } from '@/lib/api';
import { useLesson } from '@/lib/hooks';
import { hskLabel } from '@/lib/hsk';

type Tab = 'words' | 'examples';

/** Trang 1 bài (`/learn/[lessonId]` của web): từ vựng kèm âm Hán Việt, câu ví dụ, luyện thêm, ngữ pháp liên quan. Khách xem được. */
export default function LessonDetailScreen() {
  const theme = useTheme();
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const { data, error, mutate } = useLesson(lessonId);
  const [tab, setTab] = useState<Tab>('words');
  const [showMeaning, setShowMeaning] = useState(true);

  if (error) {
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Bài học' }} />
        <BackLink />
        <ErrorNote>
          {error instanceof ApiError && error.status === 404
            ? 'Không tìm thấy bài học này. Hãy chọn một bài khác trong lộ trình.'
            : 'Chưa tải được bài học. Vui lòng thử lại.'}
        </ErrorNote>
        <Button title="Tải lại bài học" variant="secondary" onPress={() => void mutate()} style={styles.self} />
      </Screen>
    );
  }
  if (!data) {
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Bài học' }} />
        <Loading />
      </Screen>
    );
  }

  const { lesson, words, relatedGrammar } = data;
  const examples = words.flatMap((w) => (w.examples ?? []).map((e) => ({ ...e, word: w.simplified })));
  // Nhảy vào bài bất kỳ thì trang bài phải tự nói được mình đang ở đâu.
  const startedWords = words.filter((w) => w.progressState && w.progressState !== 'NEW').length;
  const startLabel = startedWords >= words.length && words.length > 0 ? 'Học lại bài này' : 'Bắt đầu học';

  return (
    <Screen>
      <Stack.Screen options={{ title: `Bài ${lesson.orderIndex} · ${hskLabel(lesson.hskLevel)}` }} />
      <BackLink level={lesson.hskLevel} />
      <View style={styles.head}>
        <PageHeader
          icon="book"
          title={lesson.title}
          description="Từ vựng của bài kèm âm Hán Việt, câu ví dụ và ngữ pháp liên quan."
        />
        {words.length > 0 && (
          <View style={styles.actions}>
            <Button title={startLabel} leftIcon="play" onPress={() => router.push(`/bai-hoc/${lesson.id}`)} />
            {startedWords > 0 && (
              <Button
                title="Ôn bằng flashcard"
                leftIcon="cards"
                variant="secondary"
                onPress={() => router.push({ pathname: '/review', params: { lesson: lesson.id } })}
              />
            )}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <View style={[styles.toolbar, { borderColor: theme.border, backgroundColor: theme.surface }]}>
          <View style={styles.tabs} accessibilityRole="tablist">
            <TabButton label="Từ vựng" count={words.length} active={tab === 'words'} onPress={() => setTab('words')} />
            {/* Bài chưa có câu ví dụ thì ẩn hẳn tab, khỏi bấm vào ra màn trống. */}
            {examples.length > 0 && (
              <TabButton label="Ví dụ" count={examples.length} active={tab === 'examples'} onPress={() => setTab('examples')} />
            )}
          </View>
          <Pressable
            onPress={() => setShowMeaning(!showMeaning)}
            accessibilityState={{ selected: !showMeaning }}
            style={({ pressed }) => [styles.toggle, pressed && { backgroundColor: theme.surface2 }]}>
            <AppText variant="caption" weight="600" color="muted">
              {showMeaning ? 'Ẩn nghĩa để tự ôn' : 'Hiện nghĩa'}
            </AppText>
          </Pressable>
        </View>

        {tab === 'words' &&
          (words.length > 0 ? (
            words.map((w, i) => <WordCard key={w.id} word={w} index={i} showMeaning={showMeaning} />)
          ) : (
            <EmptyState
              title="Chưa có từ vựng"
              description="Nội dung bài học này đang được bổ sung. Hãy chọn bài khác trong lộ trình."
            />
          ))}

        {tab === 'examples' &&
          examples.map((e) => (
            <Card key={e.id}>
              <View style={[styles.exampleWord, { backgroundColor: alpha(theme.primary, 0.08) }]}>
                <Hanzi size={14} color="primary">
                  {e.word}
                </Hanzi>
              </View>
              <Hanzi size={24} style={styles.exampleZh}>
                {e.zh}
              </Hanzi>
              {e.pinyin && <AppText color="primary">{e.pinyin}</AppText>}
              {showMeaning && (e.vi || e.en) && (
                <AppText color="muted" style={styles.line24}>
                  {e.vi ?? e.en}
                </AppText>
              )}
            </Card>
          ))}
      </View>

      <Card style={styles.more}>
        <IconTile icon="book" iconSize={23} size={48} />
        <AppText weight="600" style={styles.moreTitle}>
          Luyện thêm với bài này
        </AppText>
        <AppText color="muted" style={styles.moreText}>
          Học xong từ vựng thì nghe lại và đọc to — cùng bộ từ của bài, không phải từ ngẫu nhiên.
        </AppText>
        <View style={[styles.facts, { borderColor: theme.border }]}>
          <Fact label="Cấp độ" value={hskLabel(lesson.hskLevel)} />
          <Fact label="Từ vựng" value={`${words.length} từ`} />
          {examples.length > 0 && <Fact label="Ví dụ" value={`${examples.length} câu`} />}
          {words.length > 0 && <Fact label="Đã học" value={`${startedWords}/${words.length} từ`} />}
          {relatedGrammar.length > 0 && <Fact label="Ngữ pháp liên quan" value={String(relatedGrammar.length)} />}
        </View>
        {/* Web có thêm "Luyện phát âm" và "Bài đọc AI" — app chưa có 2 màn đó. */}
        {words.length > 0 && (
          <Button
            title="Luyện nghe"
            leftIcon="headphones"
            variant="secondary"
            onPress={() => router.push({ pathname: '/listening', params: { lesson: lesson.id } })}
            style={styles.moreButton}
          />
        )}
      </Card>

      {relatedGrammar.length > 0 && (
        <Card style={styles.grammar}>
          <SectionHeading icon="cards" title="Ngữ pháp liên quan" tone="lavender" />
          <View style={styles.grammarList}>
            {relatedGrammar.map((g) => (
              <Pressable
                key={g.slug}
                onPress={() => router.push(`/ngu-phap/${encodeURIComponent(g.slug)}`)}
                style={({ pressed }) => [
                  styles.grammarRow,
                  { borderColor: theme.border },
                  pressed && { backgroundColor: theme.surface2 },
                ]}>
                <Hanzi size={18} color="primary">
                  {g.titleZh}
                </Hanzi>
                <AppText weight="500" numberOfLines={1} style={styles.flex}>
                  {g.titleVi}
                </AppText>
                <Icon name="arrow" size={14} color="muted" />
              </Pressable>
            ))}
          </View>
        </Card>
      )}

      <View style={[styles.tip, { borderColor: alpha(theme.primary, 0.15), backgroundColor: alpha(theme.primary, 0.04) }]}>
        <View style={styles.tipTitle}>
          <Icon name="sound" size={18} color="primary" />
          <AppText weight="600" color="primary">
            Nghe, đọc, ghi nhớ
          </AppText>
        </View>
        <AppText color="muted" style={[styles.line24, styles.tipText]}>
          Nhấn biểu tượng loa bên cạnh từ để nghe bản phát âm có sẵn. Thử đọc theo và dùng tính năng ẩn nghĩa để tự kiểm
          tra.
        </AppText>
      </View>
    </Screen>
  );
}

/** "← Lộ trình HSK / HSK N" — lộ trình nằm ở Trang chủ của app (web là `/learn`). */
function BackLink({ level }: { level?: number }) {
  const theme = useTheme();
  return (
    <Pressable onPress={() => router.navigate('/')} style={styles.back} hitSlop={6}>
      <Icon name="back" size={16} color="muted" />
      <AppText weight="600" color="muted">
        Lộ trình HSK
      </AppText>
      {level != null && (
        <>
          <AppText style={[styles.slash, { color: theme.border }]}>/</AppText>
          <AppText weight="600" color="muted">
            {hskLabel(level)}
          </AppText>
        </>
      )}
    </Pressable>
  );
}

function TabButton({ label, count, active, onPress }: { label: string; count: number; active: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [
        styles.tab,
        active ? { backgroundColor: alpha(theme.primary, 0.08) } : pressed && { backgroundColor: theme.surface2 },
      ]}>
      <AppText weight="600" color={active ? 'primary' : 'muted'}>
        {label}
      </AppText>
      <AppText variant="caption" color={active ? 'primary' : 'muted'} style={styles.count}>
        {count}
      </AppText>
    </Pressable>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fact}>
      <AppText color="muted">{label}</AppText>
      <AppText weight="600">{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  self: { alignSelf: 'flex-start' },
  back: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', paddingVertical: 4 },
  slash: { paddingHorizontal: 4 },
  head: { gap: 16 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  section: { gap: 16 },
  toolbar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderWidth: 1,
    borderRadius: 16,
    padding: 8,
  },
  tabs: { flexDirection: 'row', gap: 4 },
  tab: { flexDirection: 'row', alignItems: 'baseline', gap: 4, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10 },
  count: { opacity: 0.7 },
  toggle: { minHeight: 36, justifyContent: 'center', borderRadius: 12, paddingHorizontal: 12 },
  exampleWord: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  exampleZh: { lineHeight: 39 },
  line24: { lineHeight: 24 },
  more: { gap: 0 },
  moreTitle: { marginTop: 16, fontSize: 18, lineHeight: 28 },
  moreText: { marginTop: 8, lineHeight: 24 },
  facts: { marginTop: 20, gap: 12, borderTopWidth: 1, borderBottomWidth: 1, paddingVertical: 16 },
  fact: { flexDirection: 'row', justifyContent: 'space-between' },
  moreButton: { marginTop: 20 },
  grammar: { gap: 16 },
  grammarList: { gap: 8 },
  grammarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  flex: { flex: 1, minWidth: 0 },
  tip: { borderWidth: 1, borderRadius: 16, padding: 20 },
  tipTitle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tipText: { marginTop: 8 },
});
