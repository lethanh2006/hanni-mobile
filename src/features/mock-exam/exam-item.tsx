import { useEffect, type Ref } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type HostInstance } from 'react-native';

import { AppText, Hanzi, Icon } from '@/components/ui';
import { alpha, Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { MockAnswer, MockItem, MockPart, MockReviewItem, MockSectionKind, Ruby } from '@/lib/types';

import { JudgeButtons, letterColor, LetterRow, OptionBox, optionState, PictureTile } from './answer-controls';
import { LETTERS } from './labels';
import { ListenButton } from './listen-button';
import { stopListening } from './listening';
import { OrderBuilder } from './order-builder';
import { ReviewNotes } from './review-notes';
import { RubyText } from './ruby-text';

/** Câu có dấu ★ in trên đề: câu cần xét đúng/sai hoặc câu hỏi phần đọc. */
function StarLine({ ruby, pinyin, label }: { ruby: Ruby; pinyin: boolean; label: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.star, { backgroundColor: theme.surface2 }]}>
      <AppText weight="700" color="primary" accessibilityLabel={label}>
        ★
      </AppText>
      <View style={styles.flex}>
        <RubyText ruby={ruby} pinyin={pinyin} size={18} />
      </View>
    </View>
  );
}

/** Câu có chỗ trống ở giữa (điền từ / viết chữ theo pinyin); chữa bài: chữ chọn sai gạch đỏ, đáp án xanh. */
function BlankSentence({
  before,
  after,
  chosen,
  answer,
  pinyinAbove,
  pinyin,
  review,
}: {
  before: Ruby;
  after: Ruby;
  chosen: string | null;
  answer: string | null;
  /** Dạng `pinyin-char`: pinyin in TRÊN chỗ trống như đề thật. */
  pinyinAbove?: string;
  pinyin: boolean;
  review?: MockReviewItem;
}) {
  const theme = useTheme();
  const line = review ? (review.correct ? theme.good : theme.danger) : theme.text;
  return (
    <View style={styles.blankRow}>
      <RubyText ruby={before} pinyin={pinyin} />
      <View style={styles.blankCell}>
        {pinyinAbove && (
          <AppText variant="caption" weight="600" color="primary">
            {pinyinAbove}
          </AppText>
        )}
        <View style={[styles.blank, { borderColor: line }]}>
          {review && !review.correct && chosen && (
            <Hanzi size={20} color="danger" style={styles.strike}>
              {chosen}
            </Hanzi>
          )}
          <Hanzi size={20} color={review ? 'good' : 'text'}>
            {(review ? answer : chosen) ?? ' '}
          </Hanzi>
        </View>
      </View>
      <RubyText ruby={after} pinyin={pinyin} />
    </View>
  );
}

/** Bảng phương án A–F dùng chung cả phần (tranh hoặc chữ). `labels` = tên tranh (chỉ có khi chữa bài). */
export function SharedBoard({ part, pinyin, labels }: { part: MockPart; pinyin: boolean; labels?: string[] }) {
  const theme = useTheme();
  if (part.pictures) {
    const rows: string[][] = [];
    for (let i = 0; i < part.pictures.length; i += 3) rows.push(part.pictures.slice(i, i + 3));
    return (
      <View style={styles.board}>
        {rows.map((row, r) => (
          <View key={r} style={styles.boardRow}>
            {row.map((emoji, k) => {
              const i = r * 3 + k;
              return (
                <View key={i} style={[styles.boardCell, { borderColor: theme.border, backgroundColor: theme.surface }]}>
                  <AppText variant="caption" weight="700" color="muted">
                    {LETTERS[i]}
                  </AppText>
                  <PictureTile emoji={emoji} label={labels?.[i]} size="sm" />
                </View>
              );
            })}
            {Array.from({ length: 3 - row.length }, (_, k) => (
              <View key={`gap-${k}`} style={styles.flex} />
            ))}
          </View>
        ))}
      </View>
    );
  }
  if (part.options) {
    const options = part.options;
    const cols = part.type === 'fill-blank' ? 2 : 1;
    const rows: number[][] = [];
    for (let i = 0; i < options.length; i += cols) rows.push(options.slice(i, i + cols).map((_, k) => i + k));
    return (
      <View style={styles.boardOptions}>
        {rows.map((row) => (
          <View key={row[0]} style={styles.boardOptionRow}>
            {row.map((i) => (
              <View key={i} style={[styles.boardOption, { borderColor: theme.border, backgroundColor: theme.surface }]}>
                <View style={[styles.boardLetter, { backgroundColor: theme.surface2 }]}>
                  <AppText variant="caption" weight="700">
                    {LETTERS[i]}
                  </AppText>
                </View>
                <View style={styles.flex}>
                  <RubyText ruby={options[i]} pinyin={pinyin} size={18} />
                </View>
              </View>
            ))}
            {row.length < cols && <View style={styles.flex} />}
          </View>
        ))}
      </View>
    );
  }
  return null;
}

/** HSK 4 viết phần 2: nhìn tranh, dùng từ cho sẵn đặt 1 câu bằng bàn phím tiếng Trung (web có thêm viết tay). */
function SentenceWriter({
  picture,
  label,
  word,
  given,
  review,
  onChange,
  pinyin,
}: {
  picture: string;
  label?: string;
  word: Ruby;
  given: MockAnswer | null;
  review?: MockReviewItem;
  onChange?: (v: MockAnswer | null) => void;
  pinyin: boolean;
}) {
  const theme = useTheme();
  const value = typeof given === 'string' ? given : '';
  return (
    <View style={styles.writer}>
      <View style={styles.wrapRow}>
        <PictureTile emoji={picture} label={label} size="lg" />
        <View>
          <AppText variant="caption" weight="600" color="muted">
            Dùng từ
          </AppText>
          <RubyText ruby={word} pinyin={pinyin} size={24} style={styles.bold} />
        </View>
      </View>
      {onChange ? (
        <TextInput
          value={value}
          onChangeText={(v) => onChange(v.trim() ? v : null)}
          placeholder={`Đặt một câu có từ “${word.zh}”…`}
          placeholderTextColor={theme.muted}
          multiline
          accessibilityLabel={`Câu có từ ${word.zh}`}
          style={[styles.input, { borderColor: alpha(theme.border, 0.8), color: theme.text, backgroundColor: theme.surface }]}
        />
      ) : (
        <Hanzi size={20} color={review ? (review.correct ? 'good' : 'danger') : 'text'}>
          {value || '(bỏ trống)'}
        </Hanzi>
      )}
      {review && typeof review.answer === 'string' && (
        <View style={[styles.sample, { borderColor: theme.border }]}>
          <AppText variant="caption" weight="600" color="muted">
            Câu mẫu
          </AppText>
          {[review.answer, ...(review.alternatives ?? [])].map((s) => (
            <Hanzi key={s} size={18} color="good">
              {s}
            </Hanzi>
          ))}
          <AppText variant="caption" color="muted" style={styles.sampleNote}>
            Chấm tự động: câu có dùng từ đã cho, ít nhất 6 chữ Hán và chỉ gồm chữ Hán + dấu câu. Giám khảo thật còn chấm
            ngữ pháp và ý — hãy so với câu mẫu.
          </AppText>
        </View>
      )}
    </View>
  );
}

/**
 * 1 câu hỏi (`ExamItem` của web): số câu (màu theo trạng thái) + nút đánh dấu ở cột trái, nội dung câu bên phải.
 * `onChange` vắng mặt = chế độ chữa bài (chỉ xem). `itemRef` để màn làm bài cuộn tới câu.
 */
export function ExamItem({
  part,
  item,
  section,
  given,
  onChange,
  review,
  pinyin,
  flagged,
  onFlag,
  itemRef,
  onAsk,
}: {
  part: MockPart;
  item: MockItem;
  section: MockSectionKind;
  given: MockAnswer | null;
  /** `null` = bỏ chọn (câu sắp xếp chưa đủ mảnh, ô đặt câu bị xoá trắng). */
  onChange?: (v: MockAnswer | null) => void;
  review?: MockReviewItem;
  pinyin: boolean;
  flagged?: boolean;
  onFlag?: () => void;
  itemRef?: Ref<HostInstance>;
  /** Chữa bài: hỏi trợ lý AI về câu này (chỉ người đã đăng nhập). */
  onAsk?: () => void;
}) {
  const theme = useTheme();
  const labels = review?.pictureLabels;
  const badge = review
    ? review.correct
      ? { bg: theme.good, fg: '#ffffff' }
      : review.given === null
        ? { bg: alpha(theme.muted, 0.3), fg: theme.text }
        : { bg: theme.danger, fg: '#ffffff' }
    : given !== null
      ? { bg: theme.text, fg: theme.background }
      : { bg: theme.surface2, fg: theme.text };
  const pick = onChange && ((v: MockAnswer) => onChange(v));
  const optionText = (i: MockAnswer | null | undefined) =>
    typeof i === 'number' ? (item.choices?.[i] ?? part.options?.[i]?.zh ?? null) : null;

  // Rời câu/thoát đề khi đang phát thì dừng, khỏi đọc chồng lên câu khác.
  useEffect(() => () => stopListening(), []);

  return (
    <View ref={itemRef} style={[styles.card, { borderColor: theme.border, backgroundColor: theme.surface }]}>
      {/* Nút đánh dấu nằm DƯỚI số câu — để riêng cột phải thì điện thoại hẹp không đủ chỗ cho hàng A–F. */}
      <View style={styles.side}>
        <View style={[styles.badge, { backgroundColor: badge.bg }]}>
          <Text style={[styles.badgeText, { color: badge.fg }]}>{item.no}</Text>
        </View>
        {onFlag && (
          <Pressable
            onPress={onFlag}
            accessibilityLabel={flagged ? 'Bỏ đánh dấu câu này' : 'Đánh dấu để xem lại'}
            accessibilityState={{ selected: flagged }}
            style={[
              styles.flag,
              flagged
                ? { borderColor: theme.warn, backgroundColor: alpha(theme.warn, 0.15) }
                : { borderColor: theme.border },
            ]}>
            <Icon name="flag" size={15} color={flagged ? 'warn' : 'muted'} />
          </Pressable>
        )}
      </View>
      <View style={styles.body}>
        {section === 'listening' && item.audio && <ListenButton audio={item.audio} />}

        {part.type === 'judge' && item.picture && (
          <View style={styles.wrapRow}>
            <PictureTile emoji={item.picture} label={labels?.[0]} size="lg" />
            {item.text && <RubyText ruby={item.text} pinyin={pinyin} size={24} />}
            <View style={styles.pushRight}>
              <JudgeButtons given={given} review={review} onChange={pick} />
            </View>
          </View>
        )}

        {/* Phần đọc in sẵn đoạn văn; phần nghe (HSK 3) chỉ có lời đọc + câu ★. */}
        {part.type === 'judge-text' && (
          <>
            {item.text && <RubyText ruby={item.text} pinyin={pinyin} />}
            {item.statement && <StarLine ruby={item.statement} pinyin={pinyin} label="Câu cần xét" />}
            <JudgeButtons given={given} review={review} onChange={pick} />
          </>
        )}

        {part.type === 'choose-picture' && item.pictures && (
          <View style={styles.wrapRow}>
            {item.pictures.map((emoji, i) => (
              <OptionBox
                key={i}
                state={optionState(i, given, review)}
                onPress={pick && (() => pick(i))}
                style={styles.pictureOption}>
                <AppText variant="caption" weight="700" color={letterColor(optionState(i, given, review))}>
                  {LETTERS[i]}
                </AppText>
                <PictureTile emoji={emoji} label={labels?.[i]} />
              </OptionBox>
            ))}
          </View>
        )}

        {part.type === 'choose-text' && item.text && <RubyText ruby={item.text} pinyin={pinyin} size={18} />}
        {item.question && <StarLine ruby={item.question} pinyin={pinyin} label="Câu hỏi" />}
        {part.type === 'choose-text' && item.options && (
          <View style={styles.options}>
            {item.options.map((o, i) => (
              <OptionBox
                key={i}
                state={optionState(i, given, review)}
                onPress={pick && (() => pick(i))}
                style={styles.textOption}>
                <AppText variant="caption" weight="700" color={letterColor(optionState(i, given, review))}>
                  {LETTERS[i]}
                </AppText>
                <View style={styles.flex}>
                  <RubyText ruby={o} pinyin={pinyin} size={18} />
                </View>
              </OptionBox>
            ))}
          </View>
        )}

        {(part.type === 'match-picture' || part.type === 'match-text') && (
          <>
            {item.text && <RubyText ruby={item.text} pinyin={pinyin} />}
            <LetterRow count={(part.pictures ?? part.options ?? []).length} given={given} review={review} onChange={pick} />
          </>
        )}

        {part.type === 'fill-blank' && item.blank && (
          <>
            <BlankSentence
              before={item.blank.before}
              after={item.blank.after}
              chosen={optionText(given)}
              answer={optionText(review?.answer)}
              pinyin={pinyin}
              review={review}
            />
            <LetterRow count={part.options?.length ?? 0} given={given} review={review} onChange={pick} />
          </>
        )}

        {part.type === 'order' && item.pieces && (
          <OrderBuilder pieces={item.pieces} given={given} review={review} onChange={onChange} pinyin={pinyin} />
        )}

        {part.type === 'pinyin-char' && item.blank && item.choices && (
          <>
            <BlankSentence
              before={item.blank.before}
              after={item.blank.after}
              chosen={optionText(given)}
              answer={optionText(review?.answer)}
              pinyinAbove={item.pinyin}
              pinyin={pinyin}
              review={review}
            />
            {/* 6 ô chia đều bề ngang để vừa 1 hàng cả ở màn 360px. */}
            <View style={styles.chars}>
              {item.choices.map((c, i) => (
                <OptionBox key={c} state={optionState(i, given, review)} onPress={pick && (() => pick(i))} style={styles.char}>
                  <Hanzi size={24} color={letterColor(optionState(i, given, review))}>
                    {c}
                  </Hanzi>
                </OptionBox>
              ))}
            </View>
          </>
        )}

        {part.type === 'write-sentence' && item.picture && item.word && (
          <SentenceWriter
            picture={item.picture}
            label={labels?.[0]}
            word={item.word}
            given={given}
            review={review}
            onChange={onChange}
            pinyin={pinyin}
          />
        )}

        {review && <ReviewNotes review={review} pinyin={pinyin} onAsk={onAsk} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  card: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderWidth: 1, borderRadius: 16, padding: 16 },
  side: { alignItems: 'center', gap: 8 },
  badge: { minWidth: 32, height: 32, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  badgeText: { fontFamily: Fonts.sans, fontSize: 14, fontWeight: '700' },
  flag: { width: 32, height: 32, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, minWidth: 0, gap: 12 },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 16 },
  pushRight: { marginLeft: 'auto' },
  star: { flexDirection: 'row', alignItems: 'baseline', gap: 8, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8 },
  blankRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end' },
  blankCell: { alignItems: 'center', marginHorizontal: 4 },
  blank: { minWidth: 56, flexDirection: 'row', justifyContent: 'center', gap: 4, borderBottomWidth: 2, paddingHorizontal: 4 },
  strike: { textDecorationLine: 'line-through' },
  pictureOption: { padding: 8, gap: 4 },
  options: { gap: 8 },
  textOption: { flexDirection: 'row', justifyContent: 'flex-start', gap: 12, paddingHorizontal: 12, paddingVertical: 10 },
  chars: { flexDirection: 'row', gap: 6, maxWidth: 384 },
  char: { flex: 1, aspectRatio: 1 },
  writer: { gap: 12 },
  bold: { fontWeight: '700' },
  input: { borderWidth: 1, borderRadius: 12, minHeight: 80, padding: 12, fontFamily: Fonts.hanzi, fontSize: 20, textAlignVertical: 'top' },
  sample: { gap: 4, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  sampleNote: { lineHeight: 20 },
  board: { gap: 12 },
  boardRow: { flexDirection: 'row', gap: 12 },
  boardCell: { flex: 1, alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 16, padding: 8 },
  boardOptions: { gap: 8 },
  boardOptionRow: { flexDirection: 'row', gap: 8 },
  boardOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  boardLetter: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
});
