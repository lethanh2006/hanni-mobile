import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, AudioButton, Button, Card, ErrorNote, Hanzi, Icon, Loading, Screen } from '@/components/ui';
import { alpha, panelShadow } from '@/constants/theme';
import { speakSequence, stopListening } from '@/features/mock-exam/listening';
import { useTheme } from '@/hooks/use-theme';
import { errorMessage } from '@/lib/api';
import { askAssistant } from '@/lib/assistant';
import { useAuth } from '@/lib/auth';
import { hskLabel } from '@/lib/hsk';
import { createLessonReading, splitByWords, useLessonReading, type ReadingWord } from '@/lib/reading';

/**
 * Bài đọc AI viết riêng cho 1 bài học (`/bai-doc/[lessonId]` của web): hội thoại 2 bên (A trái, B phải), từ của bài tô
 * đỏ bấm ra nghĩa + Hán Việt + loa, bật/tắt Pinyin (mặc định bật HSK 1–2) và Dịch, "Nghe cả bài" (A giọng nữ, B giọng
 * nam, câu đang đọc sáng lên). Chưa có bài đọc thì người đăng nhập bấm cho AI viết (1 lượt AI).
 */
export default function LessonReadingScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const { user, loading } = useAuth();
  const { data, error, isLoading } = useLessonReading(lessonId);
  const [pinyinPref, setShowPinyin] = useState<boolean | null>(null);
  const [showVi, setShowVi] = useState(false);
  const [playing, setPlaying] = useState<number | null>(null);
  const [picked, setPicked] = useState<ReadingWord | null>(null);
  const [opened, setOpened] = useState<Set<number>>(new Set());
  const [writing, setWriting] = useState(false);
  const [writeError, setWriteError] = useState<string | null>(null);
  const [noVoice, setNoVoice] = useState(false);

  useEffect(() => () => stopListening(), []);

  const title = <Stack.Screen options={{ title: 'Bài đọc AI' }} />;
  if (loading || isLoading)
    return (
      <Screen>
        {title}
        <Loading />
      </Screen>
    );
  if (error || !data)
    return (
      <Screen>
        {title}
        <ErrorNote>Không tìm thấy bài học này.</ErrorNote>
      </Screen>
    );

  const { lesson, words, reading } = data;
  // Mặc định: HSK 1–2 hiện pinyin, cấp cao ẩn (như đề HSK 3+ không in pinyin) — người học tự bật/tắt.
  const showPinyin = pinyinPref ?? lesson.hskLevel <= 2;

  async function play(from: number | null) {
    if (!reading) return;
    if (playing !== null) {
      stopListening();
      setPlaying(null);
      return;
    }
    const lines = (from === null ? reading.sentences : [reading.sentences[from]]).map((s) => ({
      zh: s.zh,
      s: s.speaker === 'B' ? ('M' as const) : s.speaker === 'A' ? ('F' as const) : ('N' as const),
    }));
    setPlaying(from ?? 0);
    const r = await speakSequence(lines, (i) => setPlaying((from ?? 0) + i));
    if (r === 'no-voice') setNoVoice(true);
    if (r !== 'cancelled') setPlaying(null);
  }

  async function write() {
    setWriting(true);
    setWriteError(null);
    try {
      await createLessonReading(lesson.id);
    } catch (err) {
      setWriteError(errorMessage(err, 'AI chưa viết được bài đọc, thử lại sau nhé.'));
    } finally {
      setWriting(false);
    }
  }

  const heading = (
    <View>
      <Pressable onPress={() => router.push(`/learn/${lesson.id}`)} style={styles.back} hitSlop={6}>
        <Icon name="back" size={14} color="muted" />
        <AppText variant="caption" weight="600" color="muted" style={styles.flex}>
          {hskLabel(lesson.hskLevel)} · Bài {lesson.orderIndex}: {lesson.title}
        </AppText>
      </Pressable>
      <AppText variant="label" color="muted" style={styles.eyebrow}>
        Bài đọc AI · chỉ dùng từ {hskLabel(lesson.hskLevel)}
      </AppText>
      <AppText style={styles.h1}>{reading ? reading.title : `Bài đọc cho "${lesson.title}"`}</AppText>
    </View>
  );

  if (!reading)
    return (
      <Screen contentStyle={styles.page}>
        {title}
        {heading}
        <Card style={styles.intro}>
          <AppText color="muted" style={styles.line24}>
            AI viết một đoạn hội thoại ngắn dùng chính các từ của bài này, chỉ với chữ thuộc {hskLabel(lesson.hskLevel)} —
            Hanni soát lại từng chữ trước khi lưu. Bài đọc tạo một lần, ai học bài này cũng đọc được.
          </AppText>
          <View style={styles.chips}>
            {words.map((w) => (
              <View key={w.id} style={[styles.chip, { backgroundColor: theme.surface2 }]}>
                <AppText>
                  <Hanzi size={14}>{w.simplified}</Hanzi>{' '}
                  <AppText variant="caption" color="muted">
                    {w.meaningVi?.split(';')[0]}
                  </AppText>
                </AppText>
              </View>
            ))}
          </View>
          {writeError && <ErrorNote>{writeError}</ErrorNote>}
          {!data.enabled ? (
            <AppText color="muted">Tiện ích AI chưa được bật trên máy chủ.</AppText>
          ) : user ? (
            <Button
              title={writing ? 'AI đang viết… (khoảng 10 giây)' : 'Viết bài đọc cho bài này (1 lượt AI)'}
              leftIcon="spark"
              disabled={writing}
              onPress={() => void write()}
              style={styles.start}
            />
          ) : (
            <Button title="Đăng nhập để AI viết bài đọc" onPress={() => router.push('/login')} style={styles.start} />
          )}
        </Card>
      </Screen>
    );

  const toggles = [
    { label: 'Pinyin', on: showPinyin, set: setShowPinyin },
    { label: 'Dịch', on: showVi, set: setShowVi },
  ];

  return (
    <View style={styles.flex}>
      {title}
      <Screen contentStyle={styles.page} stickyHeaderIndices={[1]}>
        {heading}
        {/* Thanh dính trên cùng khi cuộn, như `sticky top-16` của web. */}
        <View
          style={[
            styles.toolbar,
            { borderColor: theme.border, backgroundColor: alpha(theme.surface, 0.95), boxShadow: panelShadow(theme) },
          ]}>
          <View style={styles.toolRow}>
            <Button
              title={playing !== null ? 'Dừng' : 'Nghe cả bài'}
              leftIcon={playing !== null ? 'pause' : 'play'}
              onPress={() => void play(null)}
              style={styles.playAll}
            />
            {toggles.map(({ label, on, set }) => (
              <Pressable
                key={label}
                onPress={() => set(!on)}
                accessibilityState={{ selected: on }}
                style={[
                  styles.toggle,
                  on
                    ? { borderColor: alpha(theme.primary, 0.4), backgroundColor: alpha(theme.primary, 0.08) }
                    : { borderColor: theme.border },
                ]}>
                <AppText weight="600" color={on ? 'primary' : 'muted'}>
                  {label}
                </AppText>
              </Pressable>
            ))}
          </View>
          <AppText variant="caption" color="muted" style={styles.used}>
            Dùng {reading.wordsUsed.length}/{words.length} từ của bài
          </AppText>
        </View>
        {noVoice && (
          <AppText variant="caption" color="muted">
            Máy này chưa có giọng đọc tiếng Trung — vẫn đọc được bài và bấm loa từng từ.
          </AppText>
        )}

        <View style={styles.sentences}>
          {reading.sentences.map((s, i) => {
            const right = s.speaker === 'B';
            const open = opened.has(i);
            return (
              <View key={i} style={[styles.sentence, right && styles.reverse]}>
                {s.speaker && (
                  <View
                    accessibilityLabel={`Người ${s.speaker}`}
                    style={[styles.speaker, { backgroundColor: right ? alpha(theme.accent, 0.15) : alpha(theme.primary, 0.12) }]}>
                    <AppText variant="caption" weight="700" color={right ? 'accent' : 'primary'}>
                      {s.speaker}
                    </AppText>
                  </View>
                )}
                <View
                  style={[
                    styles.bubble,
                    s.speaker ? styles.half : styles.full,
                    playing === i
                      ? { borderColor: alpha(theme.primary, 0.5), backgroundColor: alpha(theme.primary, 0.05) }
                      : { borderColor: theme.border, backgroundColor: theme.surface },
                  ]}>
                  <Hanzi size={20} style={[styles.zh, right && styles.textRight]}>
                    {splitByWords(s.zh, words).map((part, k) =>
                      part.word ? (
                        <Hanzi
                          key={k}
                          size={20}
                          color="primary"
                          onPress={() => setPicked(part.word!)}
                          style={[styles.word, { textDecorationColor: alpha(theme.primary, 0.3) }]}>
                          {part.text}
                        </Hanzi>
                      ) : (
                        part.text
                      ),
                    )}
                  </Hanzi>
                  {showPinyin && (
                    <AppText color="muted" style={[styles.pinyin, right && styles.textRight]}>
                      {s.pinyin}
                    </AppText>
                  )}
                  {(showVi || open) && <AppText style={[styles.vi, right && styles.textRight]}>{s.vi}</AppText>}
                  <View style={[styles.actions, right && styles.actionsRight]}>
                    <Pressable onPress={() => void play(i)} style={styles.action} hitSlop={6}>
                      <Icon name="sound" size={13} color="muted" />
                      <AppText variant="caption" weight="600" color="muted">
                        Nghe
                      </AppText>
                    </Pressable>
                    {!showVi && (
                      <Pressable
                        onPress={() =>
                          setOpened((cur) => {
                            const next = new Set(cur);
                            if (open) next.delete(i);
                            else next.add(i);
                            return next;
                          })
                        }
                        hitSlop={6}>
                        <AppText variant="caption" weight="600" color="muted">
                          Nghĩa
                        </AppText>
                      </Pressable>
                    )}
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        <Card style={styles.summary}>
          <AppText weight="700">Từ của bài trong bài đọc</AppText>
          <View style={styles.chips}>
            {words.map((w) => {
              const used = reading.wordsUsed.includes(w.simplified);
              return (
                <Pressable
                  key={w.id}
                  onPress={() => setPicked(w)}
                  accessibilityHint={used ? 'Có trong bài đọc' : 'Chưa có trong bài đọc'}
                  style={[styles.chip, { backgroundColor: used ? alpha(theme.primary, 0.08) : theme.surface2 }]}>
                  <Hanzi size={14} color={used ? 'primary' : 'muted'}>
                    {w.simplified}
                  </Hanzi>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.buttons}>
            {user && (
              <Button
                title="Ôn từ của bài"
                leftIcon="cards"
                variant="secondary"
                onPress={() => router.push({ pathname: '/review', params: { lesson: lesson.id } })}
              />
            )}
            {user && (
              <Button
                title="Hỏi trợ lý về bài đọc"
                leftIcon="spark"
                variant="secondary"
                onPress={() =>
                  askAssistant(
                    `Giải thích ngữ pháp trong bài đọc này giúp mình (HSK ${lesson.hskLevel}):\n${reading.sentences.map((s) => s.zh).join('\n')}`.slice(
                      0,
                      1000,
                    ),
                  )
                }
              />
            )}
            <Button title="Về bài học" variant="ghost" onPress={() => router.push(`/learn/${lesson.id}`)} />
          </View>
          <AppText variant="caption" color="muted" style={styles.note}>
            Bài đọc do AI viết, Hanni đã soát chữ theo cấp; pinyin theo từ điển Hanni.
          </AppText>
        </Card>
      </Screen>

      {picked && (
        <View
          style={[
            styles.popup,
            {
              bottom: insets.bottom + 12,
              borderColor: theme.border,
              backgroundColor: theme.surface,
              boxShadow: `0 20px 25px -5px ${alpha('#000000', 0.12)}, 0 8px 10px -6px ${alpha('#000000', 0.1)}`,
            },
          ]}>
          <View style={styles.popupRow}>
            <Hanzi size={30}>{picked.simplified}</Hanzi>
            <View style={styles.flex}>
              <AppText>
                {picked.pinyin}
                {picked.hanViet ? (
                  <AppText weight="700" color="hanviet">
                    {'  '}
                    {picked.hanViet}
                  </AppText>
                ) : null}
              </AppText>
              <AppText color="muted">{picked.meaningVi}</AppText>
            </View>
            <AudioButton src={picked.audioUrl} />
            <Pressable onPress={() => setPicked(null)} accessibilityLabel="Đóng" hitSlop={6} style={styles.close}>
              <Icon name="close" size={16} color="muted" />
            </Pressable>
          </View>
          <AppText
            variant="caption"
            weight="600"
            color="primary"
            onPress={() => router.push(`/tu-dien/${encodeURIComponent(picked.simplified)}`)}
            style={styles.dictLink}>
            Xem trong từ điển →
          </AppText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  page: { gap: 20, paddingTop: 32 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' },
  eyebrow: { marginTop: 12 },
  h1: { marginTop: 4, fontSize: 24, lineHeight: 32, fontWeight: '800', letterSpacing: -0.6 },
  line24: { lineHeight: 24 },
  intro: { gap: 16, padding: 24 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  start: { alignSelf: 'flex-start' },
  toolbar: { marginHorizontal: -4, borderWidth: 1, borderRadius: 16, padding: 8, gap: 8 },
  toolRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  playAll: { minHeight: 40, paddingHorizontal: 14 },
  toggle: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  used: { alignSelf: 'flex-end', paddingRight: 8 },
  sentences: { gap: 12 },
  sentence: { flexDirection: 'row', gap: 8 },
  reverse: { flexDirection: 'row-reverse' },
  speaker: { marginTop: 4, width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  bubble: { minWidth: 0, borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12 },
  half: { maxWidth: '85%' },
  full: { width: '100%' },
  zh: { lineHeight: 36 },
  word: { fontWeight: '600', textDecorationLine: 'underline' },
  textRight: { textAlign: 'right' },
  pinyin: { marginTop: 2 },
  vi: { marginTop: 4 },
  actions: { marginTop: 6, flexDirection: 'row', gap: 12 },
  actionsRight: { justifyContent: 'flex-end' },
  action: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  summary: { gap: 12 },
  buttons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingTop: 4 },
  note: { lineHeight: 20 },
  popup: { position: 'absolute', left: 12, right: 12, borderWidth: 1, borderRadius: 16, padding: 16 },
  popupRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  close: { padding: 4, borderRadius: 8 },
  dictLink: { marginTop: 8 },
});
