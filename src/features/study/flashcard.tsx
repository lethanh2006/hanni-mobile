import { useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';

import { AppText, AudioButton, Hanzi, Icon } from '@/components/ui';
import { alpha, mix, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { playWord } from '@/lib/audio';
import { hskLabel, POS_VI } from '@/lib/hsk';
import type { Rating, Word } from '@/lib/types';

/** Nhãn nói KẾT QUẢ ("gặp lại khi nào") — đó chính là thứ người học đang quyết định. */
const RATINGS: { key: Rating; label: string; hint: string; color: ThemeColor }[] = [
  { key: 'AGAIN', label: 'Chưa nhớ', hint: 'Gặp lại ngay', color: 'danger' },
  { key: 'HARD', label: 'Hơi khó', hint: 'Gặp lại sớm', color: 'warn' },
  { key: 'GOOD', label: 'Đã nhớ', hint: 'Gặp lại sau vài ngày', color: 'primary' },
  { key: 'EASY', label: 'Rất dễ', hint: 'Gặp lại lâu hơn nữa', color: 'good' },
];

/**
 * Thẻ ghi nhớ (`Flashcard` của web, khổ điện thoại): chạm để lật 3D, mặt sau có nghĩa, từ loại, Hán Việt, câu ví dụ;
 * 4 nút đánh giá xếp 2×2 chỉ hiện sau khi lật; "Tôi đã biết từ này" ẩn hẳn từ khỏi hàng đợi.
 */
export function Flashcard({
  word,
  isNew,
  busy,
  onRate,
  onKnown,
}: {
  word: Word;
  isNew: boolean;
  busy: boolean;
  onRate: (rating: Rating, durationMs: number) => void;
  /** "Tôi đã biết từ này" — ẩn hẳn khỏi hàng đợi, KHÔNG ghi nhận lượt ôn. */
  onKnown: () => void;
}) {
  const theme = useTheme();
  const [revealed, setRevealed] = useState(false);
  const [start] = useState(() => Date.now());
  const [flip] = useState(() => new Animated.Value(0));
  const example = word.examples?.[0];

  function turn(toBack: boolean) {
    setRevealed(toBack);
    Animated.timing(flip, {
      toValue: toBack ? 1 : 0,
      duration: 560,
      easing: Easing.bezier(0.2, 0.75, 0.25, 1),
      useNativeDriver: true,
    }).start();
    if (toBack) playWord(word.audioUrl);
  }

  const face = {
    borderColor: mix(theme.primary, theme.border, 0.15),
    backgroundColor: theme.surface,
    boxShadow: `0 12px 28px -18px ${alpha(theme.text, 0.24)}`,
  };
  const frontTurn = flip.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const backTurn = flip.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });

  return (
    <View>
      <View style={styles.meta}>
        <View style={styles.level}>
          <Icon name="cards" size={16} color="muted" />
          <AppText variant="caption" color="muted">
            {hskLabel(word.hskLevel)}
          </AppText>
        </View>
        <View
          style={[
            styles.state,
            { backgroundColor: isNew ? mix(theme.accent, theme.surface, 0.1) : mix(theme.primary, theme.surface, 0.08) },
          ]}>
          <AppText variant="caption" color={isNew ? 'accent' : 'primary'}>
            {isNew ? 'Từ mới' : 'Ôn lại'}
          </AppText>
        </View>
      </View>

      {/* Hai mặt nằm chồng trong 1 hàng (mặt sau lùi -100%) để cùng cao bằng mặt dài hơn, như ô lưới chung của web. */}
      <View style={styles.deck}>
        <Animated.View
          pointerEvents={revealed ? 'none' : 'auto'}
          style={[
            styles.face,
            face,
            {
              backgroundImage: `radial-gradient(ellipse at 50% 48%, ${alpha(theme.primary, 0.04)}, transparent 70%)`,
              transform: [{ perspective: 1600 }, { rotateY: frontTurn }],
            },
          ]}>
          <Pressable
            onPress={() => turn(true)}
            accessibilityRole="button"
            accessibilityLabel={`Xem nghĩa của ${word.simplified}`}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.corner} pointerEvents="none">
            <Icon name="spark" size={19} rawColor={mix(theme.accent, theme.surface, 0.65)} />
          </View>
          <AppText variant="caption" color="muted" pointerEvents="none">
            Bạn còn nhớ từ này chứ?
          </AppText>
          <Hanzi size={58} style={styles.character} pointerEvents="none">
            {word.simplified}
          </Hanzi>
          <View style={styles.pronunciation}>
            <AppText color="primary" style={styles.pinyin}>
              {word.pinyin}
            </AppText>
            <AudioButton src={word.audioUrl} />
          </View>
          <View style={[styles.revealHint, { borderColor: theme.border }]} pointerEvents="none">
            <Icon name="refresh" size={15} color="primary" />
            <AppText variant="caption" color="muted">
              Chạm để lật
            </AppText>
          </View>
        </Animated.View>

        <Animated.View
          pointerEvents={revealed ? 'auto' : 'none'}
          style={[
            styles.face,
            styles.back,
            face,
            {
              backgroundImage: `linear-gradient(150deg, ${theme.surface} 65%, ${mix(theme.good, theme.surface, 0.04)})`,
              transform: [{ perspective: 1600 }, { rotateY: backTurn }],
            },
          ]}>
          <Pressable
            onPress={() => turn(false)}
            accessibilityRole="button"
            accessibilityLabel="Lật về mặt trước"
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.answerWord}>
            <Hanzi size={30} pointerEvents="none">
              {word.simplified}
            </Hanzi>
            <AppText color="primary" style={styles.answerPinyin} pointerEvents="none">
              {word.pinyin}
            </AppText>
            <AudioButton src={word.audioUrl} />
          </View>
          <View style={styles.meaning} pointerEvents="none">
            <AppText weight="600" center style={styles.meaningText}>
              {word.meaningVi ?? word.meaningEn ?? 'Nghĩa đang được cập nhật'}
            </AppText>
            <View style={styles.chips}>
              {word.pos.length > 0 && (
                <View style={[styles.chip, { backgroundColor: theme.surface2 }]}>
                  <AppText variant="caption" color="muted">
                    {word.pos.map((p) => POS_VI[p] ?? p).join(' · ')}
                  </AppText>
                </View>
              )}
              {word.hanViet && (
                <View style={[styles.chip, { backgroundColor: mix(theme.hanviet, theme.surface2, 0.12) }]}>
                  <AppText variant="caption" weight="600" color="hanviet">
                    Hán Việt: {word.hanViet}
                  </AppText>
                </View>
              )}
            </View>
          </View>
          {example && (
            <View
              pointerEvents="none"
              style={[
                styles.example,
                {
                  borderColor: mix(theme.accent, theme.border, 0.1),
                  backgroundColor: mix(theme.accent, theme.surface, 0.04),
                },
              ]}>
              <AppText weight="600" color="accent" style={styles.exampleLabel}>
                TRONG MỘT CÂU
              </AppText>
              <Hanzi size={20} style={styles.exampleHanzi}>
                {example.zh}
              </Hanzi>
              {example.pinyin && (
                <AppText variant="caption" color="muted">
                  {example.pinyin}
                </AppText>
              )}
              {(example.vi || example.en) && (
                <AppText variant="caption" style={styles.exampleVi}>
                  {example.vi ?? example.en}
                </AppText>
              )}
            </View>
          )}
        </Animated.View>
      </View>

      <AppText variant="caption" color="muted" center style={styles.ratingPrompt}>
        {revealed
          ? 'Bạn nhớ từ này đến đâu? Hanni dựa vào đây để xếp lịch ôn.'
          : 'Thử nhớ nghĩa, rồi lật thẻ để tự đánh giá'}
      </AppText>

      {/* Chưa lật thì ẩn hẳn 4 nút — hiện xám mờ thì người mới không biết là gì. */}
      {revealed && (
        <View style={styles.ratings}>
          {[RATINGS.slice(0, 2), RATINGS.slice(2)].map((row) => (
            <View key={row[0].key} style={styles.ratingRow}>
              {row.map((r) => {
                const c = theme[r.color];
                return (
                  <Pressable
                    key={r.key}
                    disabled={busy}
                    onPress={() => onRate(r.key, Date.now() - start)}
                    accessibilityRole="button"
                    style={({ pressed }) => [
                      styles.rating,
                      { borderColor: mix(c, theme.border, 0.2), backgroundColor: mix(c, theme.surface, 0.06) },
                      pressed && { transform: [{ translateY: 2 }] },
                      busy && styles.disabled,
                    ]}>
                    <AppText variant="caption" weight="700" style={{ color: c }}>
                      {r.label}
                    </AppText>
                    <AppText style={[styles.ratingHint, { color: c }]}>{r.hint}</AppText>
                    <View style={[styles.ratingKey, { borderColor: alpha(c, 0.16) }]}>
                      <AppText style={[styles.ratingKeyText, { color: c }]}>{RATINGS.indexOf(r) + 1}</AppText>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
      )}
      {revealed && (
        <Pressable
          disabled={busy}
          onPress={onKnown}
          style={({ pressed }) => [
            styles.known,
            { borderColor: pressed ? alpha(theme.good, 0.45) : theme.border },
            busy && styles.halfOpacity,
          ]}>
          <Icon name="check" size={14} color="muted" />
          <AppText variant="caption" color="muted">
            Tôi đã biết từ này — đừng hỏi lại
          </AppText>
        </Pressable>
      )}
      <AppText variant="caption" color="muted" center style={styles.saveStatus}>
        {busy ? 'Đang lưu kết quả…' : ''}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  meta: { marginHorizontal: 3, marginBottom: 13, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  level: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  state: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  deck: { flexDirection: 'row', marginBottom: 24 },
  face: {
    width: '100%',
    minHeight: 310,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingVertical: 26,
    backfaceVisibility: 'hidden',
  },
  back: { marginLeft: '-100%' },
  corner: { position: 'absolute', top: 22, right: 24 },
  character: { marginTop: 26, lineHeight: 67, letterSpacing: 2, textAlign: 'center' },
  pronunciation: { marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 7 },
  pinyin: { fontSize: 20, lineHeight: 28 },
  revealHint: {
    marginTop: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  answerWord: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 9 },
  answerPinyin: { fontSize: 16 },
  meaning: { marginTop: 15, alignItems: 'center' },
  meaningText: { fontSize: 23, lineHeight: 32, letterSpacing: -0.7 },
  chips: { marginTop: 9, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6 },
  chip: { borderRadius: 6, paddingHorizontal: 9, paddingVertical: 3 },
  example: { alignSelf: 'stretch', marginTop: 20, borderWidth: 1, borderRadius: 12, paddingHorizontal: 15, paddingVertical: 13 },
  exampleLabel: { marginBottom: 6, fontSize: 11, lineHeight: 14, letterSpacing: 0.8 },
  exampleHanzi: { lineHeight: 34 },
  exampleVi: { lineHeight: 22 },
  ratingPrompt: { minHeight: 20, marginBottom: 12 },
  ratings: { gap: 9 },
  ratingRow: { flexDirection: 'row', gap: 9 },
  rating: {
    flex: 1,
    minHeight: 67,
    borderWidth: 1,
    borderBottomWidth: 3,
    borderRadius: 13,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  ratingHint: { marginTop: 3, fontSize: 11, lineHeight: 14 },
  ratingKey: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 18,
    height: 18,
    borderWidth: 1,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.8,
  },
  ratingKeyText: { fontSize: 11, lineHeight: 14 },
  disabled: { opacity: 0.42 },
  known: {
    alignSelf: 'center',
    marginTop: 10,
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  halfOpacity: { opacity: 0.5 },
  saveStatus: { minHeight: 20, marginTop: 8 },
});
