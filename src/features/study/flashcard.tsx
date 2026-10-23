import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, AudioButton, Card, Icon, TextLink } from '@/components/ui';
import { Radius, Spacing, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { playWord } from '@/lib/audio';
import { hskLabel, POS_VI } from '@/lib/hsk';
import type { Rating, Word } from '@/lib/types';

/** Nhãn nói KẾT QUẢ ("gặp lại khi nào") — đó chính là thứ người học đang quyết định. */
const RATINGS: { key: Rating; label: string; hint: string; color: ThemeColor }[] = [
  { key: 'AGAIN', label: 'Chưa nhớ', hint: 'Gặp lại ngay', color: 'danger' },
  { key: 'HARD', label: 'Hơi khó', hint: 'Gặp lại sớm', color: 'warn' },
  { key: 'GOOD', label: 'Đã nhớ', hint: 'Sau vài ngày', color: 'good' },
  { key: 'EASY', label: 'Rất dễ', hint: 'Lâu hơn nữa', color: 'lavender' },
];

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
  const example = word.examples?.[0];

  function reveal() {
    if (revealed) return;
    setRevealed(true);
    playWord(word.audioUrl);
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.meta}>
        <AppText variant="caption" color="muted">
          {hskLabel(word.hskLevel)}
        </AppText>
        <AppText variant="caption" bold color={isNew ? 'primary' : 'muted'}>
          {isNew ? 'Từ mới' : 'Ôn lại'}
        </AppText>
      </View>

      <Pressable onPress={() => (revealed ? setRevealed(false) : reveal())} accessibilityRole="button">
        <Card style={styles.card}>
          {!revealed ? (
            <>
              <AppText variant="small" color="muted">
                Bạn còn nhớ từ này chứ?
              </AppText>
              <AppText style={styles.hanzi}>{word.simplified}</AppText>
              <View style={styles.row}>
                <AppText color="primary">{word.pinyin}</AppText>
                <AudioButton src={word.audioUrl} />
              </View>
              <AppText variant="caption" color="muted">
                Chạm để lật thẻ
              </AppText>
            </>
          ) : (
            <>
              <View style={styles.row}>
                <AppText variant="title">{word.simplified}</AppText>
                <AppText color="primary">{word.pinyin}</AppText>
                <AudioButton src={word.audioUrl} />
              </View>
              {word.imageUrl && <Image source={word.imageUrl} style={styles.image} contentFit="cover" />}
              <AppText variant="heading" center>
                {word.meaningVi ?? word.meaningEn ?? 'Nghĩa đang được cập nhật'}
              </AppText>
              {word.pos.length > 0 && (
                <AppText variant="caption" color="muted">
                  {word.pos.map((p) => POS_VI[p] ?? p).join(' · ')}
                </AppText>
              )}
              {word.hanViet && (
                <AppText variant="small" bold color="hanviet">
                  Hán Việt: {word.hanViet}
                </AppText>
              )}
              {example && (
                <View style={[styles.example, { backgroundColor: theme.surface2 }]}>
                  <AppText variant="caption" color="muted">
                    Trong một câu
                  </AppText>
                  <AppText variant="heading">{example.zh}</AppText>
                  {example.pinyin && (
                    <AppText variant="caption" color="muted">
                      {example.pinyin}
                    </AppText>
                  )}
                  {(example.vi || example.en) && <AppText variant="small">{example.vi ?? example.en}</AppText>}
                </View>
              )}
            </>
          )}
        </Card>
      </Pressable>

      <AppText variant="small" color="muted" center>
        {revealed
          ? 'Bạn nhớ từ này đến đâu? Hanni dựa vào đây để xếp lịch ôn.'
          : 'Thử nhớ nghĩa, rồi lật thẻ để tự đánh giá'}
      </AppText>

      {/* Chưa lật thì ẩn hẳn 4 nút — hiện xám mờ thì người mới không biết là gì. */}
      {revealed && (
        <>
          <View style={styles.ratings}>
            {RATINGS.map((r) => (
              <Pressable
                key={r.key}
                disabled={busy}
                onPress={() => onRate(r.key, Date.now() - start)}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.rating,
                  { borderColor: theme[r.color], backgroundColor: theme.surface },
                  (pressed || busy) && styles.dim,
                ]}>
                <AppText variant="small" bold color={r.color}>
                  {r.label}
                </AppText>
                <AppText variant="caption" color="muted" center>
                  {r.hint}
                </AppText>
              </Pressable>
            ))}
          </View>
          <View style={styles.known}>
            <Icon name="check" size={14} color="muted" />
            <TextLink title="Tôi đã biết từ này — đừng hỏi lại" color="muted" onPress={onKnown} />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.md },
  meta: { flexDirection: 'row', justifyContent: 'space-between' },
  card: { alignItems: 'center', minHeight: 300, justifyContent: 'center', paddingVertical: Spacing.xl },
  hanzi: { fontSize: 64, lineHeight: 80 },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  image: { width: 140, height: 100, borderRadius: Radius.lg },
  example: { alignSelf: 'stretch', borderRadius: Radius.md, padding: Spacing.md, gap: 2 },
  ratings: { flexDirection: 'row', gap: Spacing.sm },
  rating: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: 4,
    gap: 2,
  },
  dim: { opacity: 0.6 },
  known: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
});
