import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Animated, Modal, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Button, Details, ErrorNote, Hanzi, Icon, Loading, NextStep, Screen, TourButton, type TourStep } from '@/components/ui';
import { alpha } from '@/constants/theme';
import { MobileTranscript } from '@/features/video/transcript';
import { YoutubePlayer, type YoutubePlayerHandle } from '@/features/video/youtube-player';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { addPendingWord } from '@/lib/guest-progress';
import { addWordToSrs, useVideo } from '@/lib/hooks';
import { hskBand } from '@/lib/hsk';
import { reportScroll } from '@/lib/scroll-tuck';
import type { LineToken, VideoLine } from '@/lib/types';

/**
 * Thời điểm bắt đầu (giây) mỗi câu — chép `computeTimes` của web: có mốc `startMs` thì dùng đúng; không thì ước lượng
 * theo nhịp đọc (chữ/giây) + khoảng nghỉ, chỉ gần đúng.
 */
const LEAD_IN = 1.2;
const CHARS_PER_SEC = 3.2;
const GAP = 0.6;

function computeTimes(lines: VideoLine[]): number[] {
  if (lines.some((l) => l.startMs != null)) {
    let last = 0;
    return lines.map((l) => {
      if (l.startMs != null) last = l.startMs / 1000;
      return last;
    });
  }
  let acc = LEAD_IN;
  return lines.map((l) => {
    const start = acc;
    const chars = Math.max(2, Array.from(l.zh.replace(/[，。、！？：；…·\s]/g, '')).length);
    acc += chars / CHARS_PER_SEC + GAP;
    return start;
  });
}

const WATCH_TOUR: TourStep[] = [
  {
    icon: 'play',
    title: 'Bản chép chạy đồng bộ',
    description: 'Phụ đề chạy khớp theo video như máy nhắc chữ — bấm vào 1 dòng bất kỳ để video tự tua tới đúng câu đó.',
  },
  {
    icon: 'eye',
    title: 'Xem trên điện thoại',
    description:
      'Khi cuộn xuống đọc bản chép trên điện thoại, video sẽ dán lại ngay dưới thanh menu để bạn vừa nghe vừa đọc cùng lúc.',
  },
];

/**
 * Xem 1 video (`/watch/[id]` của web ở khổ điện thoại): tên + nhãn cấp/số câu/kiểu đồng bộ, khung YouTube dính trên cùng
 * khi cuộn (có phụ đề đè tuỳ chọn), bản chép chạy theo video, bấm từ để xem nghĩa + "Lưu để ôn tập", giới thiệu video,
 * NextStep. Khách xem được; lưu từ của khách giữ tạm tới khi tạo tài khoản, tiến độ chỉ lưu khi đã đăng nhập.
 */
export default function WatchDetailScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { user, loading } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, error } = useVideo(id);
  const [showPinyin, setShowPinyin] = useState(true);
  const [showTrans, setShowTrans] = useState(true);
  const [showCaption, setShowCaption] = useState(false);
  const [active, setActive] = useState<number | null>(null);
  const [readMax, setReadMax] = useState(0);
  const [wordPopup, setWordPopup] = useState<LineToken | null>(null);
  const [savingWord, setSavingWord] = useState(false);
  const [savedWordIds, setSavedWordIds] = useState<Set<string>>(new Set());
  const player = useRef<YoutubePlayerHandle>(null);
  const [scrollY] = useState(() => new Animated.Value(0));
  // Vị trí khung video trong trang (đo khi vẽ) — cuộn quá mốc này thì video dính trên cùng.
  const [playerTop, setPlayerTop] = useState(170);
  const savedAt = useRef(0);
  const activeRef = useRef(0);
  const readRef = useRef(0);

  const times = useMemo(() => (data ? computeTimes(data.lines) : []), [data]);

  const saveProgress = useCallback(
    (index: number, read: number, force = false) => {
      const now = Date.now();
      if (!user) return;
      if (!force && now - savedAt.current < 2500) return;
      savedAt.current = now;
      void api.patch(`/videos/${id}/progress`, { lastLineIndex: index, linesRead: read }).catch(() => undefined);
    },
    [id, user],
  );

  const goToLine = useCallback(
    (lineIndex: number) => {
      if (lineIndex === activeRef.current) return;
      activeRef.current = lineIndex;
      setActive(lineIndex);
      const nextRead = Math.max(readRef.current, lineIndex);
      readRef.current = nextRead;
      setReadMax(nextRead);
      saveProgress(lineIndex, nextRead);
    },
    [saveProgress],
  );

  const onTick = useCallback(
    (t: number) => {
      if (!times.length) return;
      let idx = -1;
      for (let i = 0; i < times.length; i += 1) {
        if (times[i] <= t + 0.2) idx = i;
        else break;
      }
      if (idx >= 0) goToLine(idx + 1);
    },
    [times, goToLine],
  );

  const title = <Stack.Screen options={{ title: 'Học qua video' }} />;
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
        <ErrorNote>Không tải được video này.</ErrorNote>
        <AppText weight="600" color="primary" onPress={() => router.navigate('/watch')}>
          ← Về danh sách
        </AppText>
      </Screen>
    );

  const read = Math.max(readMax, data.progress.linesRead);
  const pct = data.sentenceCount ? Math.round((read / data.sentenceCount) * 100) : 0;
  const activeLine = active ? data.lines.find((l) => l.index === active) : null;
  const realSync = data.lines.some((l) => l.startMs != null);
  const band = data.hskLevel ? hskBand(data.hskLevel) : null;
  // Bản chép lấp phần màn hình còn lại dưới khung video (`.transcript` của web: 100svh − đỉnh khung − video − 12px): lúc
  // đầu vừa khít màn hình, cuộn xuống thì giãn dần tới khi video dính dưới thanh trên.
  const playerHeight = ((width - 24) * 9) / 16;
  const pinnedHeight = Math.max(300, height - (insets.top + 64) - playerHeight - 12 - insets.bottom);
  const transcriptHeight = scrollY.interpolate({
    inputRange: [0, Math.max(1, playerTop)],
    outputRange: [Math.max(300, pinnedHeight - playerTop), pinnedHeight],
    extrapolate: 'clamp',
  });

  function selectLine(index: number) {
    const t = times[index - 1];
    if (Number.isFinite(t)) player.current?.seek(t);
    readRef.current = Math.max(readRef.current, read, index);
    activeRef.current = index;
    setActive(index);
    setReadMax(readRef.current);
    saveProgress(index, readRef.current, true);
  }

  async function saveWord(wordId: string) {
    if (!user) {
      // Khách: giữ tạm, đăng ký xong tự vào hàng đợi ôn.
      addPendingWord(wordId);
      setSavedWordIds((prev) => new Set(prev).add(wordId));
      return;
    }
    setSavingWord(true);
    try {
      await addWordToSrs(wordId);
      setSavedWordIds((prev) => new Set(prev).add(wordId));
    } catch {
      // im lặng — nút vẫn hiện lại "Lưu để ôn tập" để thử lại, không chặn xem video
    } finally {
      setSavingWord(false);
    }
  }

  const word = wordPopup?.word;

  return (
    <>
      {title}
      <Animated.ScrollView
        style={[styles.flex, { backgroundColor: theme.background }]}
        contentContainerStyle={[styles.page, { paddingBottom: insets.bottom + 28 }]}
        contentInsetAdjustmentBehavior="never"
        stickyHeaderIndices={[3]}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: false,
          listener: (e: { nativeEvent: { contentOffset: { y: number } } }) => reportScroll(e.nativeEvent.contentOffset.y),
        })}>
        <Pressable onPress={() => router.navigate('/watch')} style={styles.back}>
          <Icon name="back" size={16} color="muted" />
          <AppText color="muted">Học qua video</AppText>
        </Pressable>

        <View style={styles.titleRow}>
          <AppText weight="700" style={styles.title}>
            {data.title}
          </AppText>
          {/* Trang có khá nhiều thứ ẩn/hiện (pinyin, dịch, phụ đề đè, bấm từ) — cho mở lại hướng dẫn. */}
          <TourButton steps={WATCH_TOUR} />
        </View>

        {/* Khối dính được ScrollView bọc riêng nên đo vị trí ở khối ngay trên nó (+ lề dưới 12). */}
        <View style={styles.meta} onLayout={(e) => setPlayerTop(e.nativeEvent.layout.y + e.nativeEvent.layout.height + 12)}>
          {data.hskLevel && band && (
            <View style={[styles.chip, { backgroundColor: alpha(theme[band.color], 0.1) }]}>
              <AppText variant="caption" weight="600" color={band.color}>
                HSK {data.hskLevel} · {band.label}
              </AppText>
            </View>
          )}
          <AppText color="muted">{data.sentenceCount} câu</AppText>
          <View style={[styles.chip, { backgroundColor: realSync ? alpha(theme.good, 0.1) : theme.surface2 }]}>
            <AppText variant="caption" color={realSync ? 'good' : 'muted'}>
              {realSync ? 'Đồng bộ theo lời nói' : 'Thời gian ước lượng'}
            </AppText>
          </View>
        </View>

        {/* Khung video dính trên cùng khi cuộn đọc bản chép. */}
        <View style={[styles.sticky, { backgroundColor: theme.background }]}>
          <View style={[styles.player, { borderColor: theme.border }]}>
            <YoutubePlayer ref={player} youtubeId={data.youtubeId} onTick={onTick} />
            {/* Phụ đề đè đặt cao hơn thanh điều khiển YouTube (~48px) để không che nút tua. */}
            {showCaption && activeLine && (
              <View pointerEvents="none" style={styles.caption}>
                <Hanzi size={16} style={styles.captionZh}>
                  {activeLine.zh}
                </Hanzi>
                {showTrans && activeLine.vi && (
                  <AppText variant="caption" center style={styles.captionVi}>
                    {activeLine.vi}
                  </AppText>
                )}
              </View>
            )}
          </View>
        </View>

        <MobileTranscript
          key={id}
          lines={data.lines}
          active={active}
          progress={pct}
          resumeAt={data.progress.lastLineIndex}
          height={transcriptHeight}
          showPinyin={showPinyin}
          showTrans={showTrans}
          showCaption={showCaption}
          onTogglePinyin={() => setShowPinyin((v) => !v)}
          onToggleTrans={() => setShowTrans((v) => !v)}
          onToggleCaption={() => setShowCaption((v) => !v)}
          onSelect={selectLine}
          onWordClick={setWordPopup}
        />

        {data.description ? (
          <View style={styles.section}>
            <Details title="Giới thiệu video">
              <AppText color="muted" style={styles.description}>
                {data.description}
              </AppText>
            </Details>
          </View>
        ) : null}

        {/* Bấm từ trong bản chép để lưu — bước tiếp theo tự nhiên là đi ôn đúng những từ vừa lưu. */}
        <View style={styles.section}>
          <NextStep
            title="Xem xong rồi, ôn lại từ vừa lưu nhé"
            description="Những từ bạn bấm lưu trong bản chép đã nằm trong hàng đợi ôn tập — gặp lại đúng lúc sắp quên thì mới nhớ được."
            actions={[
              { href: '/study', label: 'Ôn tập flashcard', icon: 'cards' },
              { href: '/watch', label: 'Xem video khác', icon: 'play' },
            ]}
          />
        </View>
      </Animated.ScrollView>

      <Modal visible={Boolean(word)} transparent animationType="fade" onRequestClose={() => setWordPopup(null)} statusBarTranslucent>
        <Pressable style={styles.backdrop} onPress={() => setWordPopup(null)}>
          {wordPopup && word && (
            <Pressable
              onPress={() => undefined}
              style={[styles.sheet, { backgroundColor: theme.surface, boxShadow: `0 20px 25px -5px ${alpha('#000000', 0.2)}` }]}>
              <View style={styles.sheetHead}>
                <View style={styles.flex}>
                  <Hanzi size={30}>{wordPopup.text}</Hanzi>
                  <AppText color="primary" style={styles.sheetPinyin}>
                    {word.pinyin}
                  </AppText>
                </View>
                <View style={[styles.hsk, { backgroundColor: theme.surface2 }]}>
                  <AppText variant="caption" weight="600" color="muted">
                    HSK {word.hskLevel}
                  </AppText>
                </View>
              </View>
              {word.imageUrl && <Image source={word.imageUrl} style={styles.image} contentFit="cover" />}
              <AppText style={styles.meaning}>{word.meaningVi ?? 'Nghĩa đang được cập nhật.'}</AppText>
              <View style={styles.sheetButtons}>
                <Button title="Đóng" variant="secondary" onPress={() => setWordPopup(null)} style={styles.flex} />
                <Button
                  title={
                    savedWordIds.has(word.id) ? (user ? 'Đã lưu' : 'Đã ghi nhớ') : savingWord ? 'Đang lưu…' : 'Lưu để ôn tập'
                  }
                  disabled={savingWord || savedWordIds.has(word.id)}
                  onPress={() => void saveWord(word.id)}
                  style={styles.flex}
                />
              </View>
              {!user && savedWordIds.has(word.id) && (
                <AppText variant="caption" color="muted" style={styles.guestNote}>
                  <AppText
                    variant="caption"
                    weight="600"
                    color="primary"
                    onPress={() => {
                      setWordPopup(null);
                      router.push('/register');
                    }}>
                    Tạo tài khoản
                  </AppText>{' '}
                  để giữ các từ đã ghi nhớ — Hanni nhắc ôn đúng lúc sắp quên.
                </AppText>
              )}
            </Pressable>
          )}
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  page: { paddingHorizontal: 12, paddingTop: 12, gap: 0 },
  back: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start' },
  titleRow: { marginTop: 12, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  title: { flex: 1, minWidth: 0, fontSize: 16, lineHeight: 22 },
  meta: { marginTop: 8, marginBottom: 12, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  chip: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  sticky: { zIndex: 20 },
  player: { borderWidth: 1, borderBottomWidth: 0, borderTopLeftRadius: 16, borderTopRightRadius: 16, overflow: 'hidden' },
  caption: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 64,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  captionZh: { color: '#ffffff', lineHeight: 22, textAlign: 'center' },
  captionVi: { marginTop: 2, color: 'rgba(255,255,255,0.8)' },
  section: { marginTop: 12 },
  description: { lineHeight: 24 },
  backdrop: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', padding: 16, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { width: '100%', maxWidth: 384, borderRadius: 16, padding: 20 },
  sheetHead: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  sheetPinyin: { marginTop: 4 },
  hsk: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  image: { marginTop: 12, height: 128, width: '100%', borderRadius: 12 },
  meaning: { marginTop: 12, lineHeight: 24 },
  sheetButtons: { marginTop: 20, flexDirection: 'row', gap: 8 },
  guestNote: { marginTop: 12, lineHeight: 20 },
});
