import { StyleSheet, TextInput, View } from 'react-native';

import { AppText, Card } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { MockAnswer, MockItem, MockPart, MockReviewItem, MockSectionKind, Ruby } from '@/lib/types';

import { JudgeButtons, LetterRow, OptionBox, optionState, PictureTile } from './answer-controls';
import { LETTERS } from './labels';
import { ListenButton } from './listen-button';
import { OrderBuilder } from './order-builder';
import { ReviewNotes } from './review-notes';
import { RubyText } from './ruby-text';

/** Câu có dấu ★ in trên đề: câu cần xét đúng/sai hoặc câu hỏi phần đọc. */
function StarLine({ ruby, pinyin }: { ruby: Ruby; pinyin: boolean }) {
  const theme = useTheme();
  return (
    <View style={[styles.star, { backgroundColor: theme.surface2 }]}>
      <AppText bold color="primary">
        ★
      </AppText>
      <RubyText ruby={ruby} pinyin={pinyin} size={18} />
    </View>
  );
}

/** Câu có chỗ trống ở giữa; ô trống hiện chữ đã chọn (chữa bài: đáp án đúng màu xanh). */
function BlankSentence({
  before,
  after,
  filled,
  pinyinAbove,
  pinyin,
  review,
}: {
  before: Ruby;
  after: Ruby;
  filled: string | null;
  /** Dạng `pinyin-char`: pinyin in trên chỗ trống. */
  pinyinAbove?: string;
  pinyin: boolean;
  review?: MockReviewItem;
}) {
  const theme = useTheme();
  const color = review ? (review.correct ? theme.good : theme.danger) : theme.text;
  return (
    <View style={styles.blankRow}>
      <RubyText ruby={before} pinyin={pinyin} />
      <View style={[styles.blank, { borderColor: color }]}>
        {pinyinAbove && (
          <AppText variant="caption" bold color="primary">
            {pinyinAbove}
          </AppText>
        )}
        <AppText variant="heading" style={{ color }}>
          {filled ?? ' '}
        </AppText>
      </View>
      <RubyText ruby={after} pinyin={pinyin} />
    </View>
  );
}

/** Bảng phương án A–F dùng chung cả phần (tranh hoặc chữ). */
export function SharedBoard({ part, pinyin }: { part: MockPart; pinyin: boolean }) {
  const theme = useTheme();
  if (part.pictures) {
    return (
      <View style={styles.board}>
        {part.pictures.map((emoji, i) => (
          <View key={i} style={[styles.boardCell, { borderColor: theme.border, backgroundColor: theme.surface }]}>
            <AppText variant="caption" bold color="muted">
              {LETTERS[i]}
            </AppText>
            <PictureTile emoji={emoji} />
          </View>
        ))}
      </View>
    );
  }
  if (part.options) {
    return (
      <View style={styles.board}>
        {part.options.map((o, i) => (
          <View key={i} style={[styles.boardOption, { borderColor: theme.border, backgroundColor: theme.surface }]}>
            <AppText bold color="muted">
              {LETTERS[i]}
            </AppText>
            <RubyText ruby={o} pinyin={pinyin} size={18} />
          </View>
        ))}
      </View>
    );
  }
  return null;
}

/** Chữ của phương án số `i` trong câu điền từ (từ bảng dùng chung hoặc 6 chữ đồng âm). */
function choiceText(part: MockPart, item: MockItem, i: MockAnswer | null | undefined) {
  if (typeof i !== 'number') return null;
  return item.choices?.[i] ?? part.options?.[i]?.zh ?? null;
}

/** 1 câu hỏi. `onChange` vắng mặt = chế độ chữa bài (chỉ xem). */
export function ExamItem({
  part,
  item,
  section,
  given,
  onChange,
  review,
  pinyin,
}: {
  part: MockPart;
  item: MockItem;
  section: MockSectionKind;
  given: MockAnswer | null;
  /** `null` = bỏ chọn (câu sắp xếp chưa đủ mảnh, ô đặt câu bị xoá trắng). */
  onChange?: (v: MockAnswer | null) => void;
  review?: MockReviewItem;
  pinyin: boolean;
}) {
  const theme = useTheme();
  const labels = review?.pictureLabels;
  const badge = review
    ? review.correct
      ? theme.good
      : review.given === null
        ? theme.muted
        : theme.danger
    : given !== null
      ? theme.text
      : theme.surface2;
  const pick = onChange && ((v: MockAnswer) => onChange(v));
  // Chữa bài thì ô trống hiện đáp án đúng; đang làm thì hiện chữ đã chọn.
  const filled = choiceText(part, item, review ? review.answer : given);

  return (
    <Card>
      <View style={styles.head}>
        <View style={[styles.badge, { backgroundColor: badge }]}>
          <AppText variant="small" bold color={given !== null || review ? 'surface' : 'text'}>
            {item.no}
          </AppText>
        </View>
        {section === 'listening' && item.audio && <ListenButton audio={item.audio} />}
      </View>

      {part.type === 'judge' && item.picture && (
        <View style={styles.row}>
          <PictureTile emoji={item.picture} label={labels?.[0]} big />
          {item.text && <RubyText ruby={item.text} pinyin={pinyin} size={24} />}
        </View>
      )}
      {part.type === 'judge-text' && item.text && <RubyText ruby={item.text} pinyin={pinyin} />}
      {item.statement && <StarLine ruby={item.statement} pinyin={pinyin} />}
      {(part.type === 'judge' || part.type === 'judge-text') && (
        <JudgeButtons given={given} review={review} onChange={pick} />
      )}

      {part.type === 'choose-picture' && item.pictures && (
        <View style={styles.row}>
          {item.pictures.map((emoji, i) => (
            <OptionBox key={i} state={optionState(i, given, review)} onPress={pick && (() => pick(i))} style={styles.pictureOption}>
              <AppText variant="caption" bold>
                {LETTERS[i]}
              </AppText>
              <PictureTile emoji={emoji} label={labels?.[i]} />
            </OptionBox>
          ))}
        </View>
      )}

      {part.type === 'choose-text' && item.text && <RubyText ruby={item.text} pinyin={pinyin} />}
      {item.question && <StarLine ruby={item.question} pinyin={pinyin} />}
      {part.type === 'choose-text' &&
        item.options?.map((o, i) => (
          <OptionBox key={i} state={optionState(i, given, review)} onPress={pick && (() => pick(i))} style={styles.textOption}>
            <AppText bold color="muted">
              {LETTERS[i]}
            </AppText>
            <RubyText ruby={o} pinyin={pinyin} size={18} />
          </OptionBox>
        ))}

      {(part.type === 'match-picture' || part.type === 'match-text') && (
        <>
          {item.text && <RubyText ruby={item.text} pinyin={pinyin} />}
          <LetterRow count={(part.pictures ?? part.options ?? []).length} given={given} review={review} onChange={pick} />
        </>
      )}

      {part.type === 'fill-blank' && item.blank && (
        <>
          <BlankSentence before={item.blank.before} after={item.blank.after} filled={filled} pinyin={pinyin} review={review} />
          <LetterRow count={part.options?.length ?? 0} given={given} review={review} onChange={pick} />
        </>
      )}

      {part.type === 'pinyin-char' && item.blank && item.choices && (
        <>
          <BlankSentence
            before={item.blank.before}
            after={item.blank.after}
            filled={filled}
            pinyinAbove={item.pinyin}
            pinyin={pinyin}
            review={review}
          />
          <View style={styles.row}>
            {item.choices.map((c, i) => (
              <OptionBox key={c} state={optionState(i, given, review)} onPress={pick && (() => pick(i))} style={styles.charOption}>
                <AppText variant="title">{c}</AppText>
              </OptionBox>
            ))}
          </View>
        </>
      )}

      {part.type === 'order' && item.pieces && (
        <OrderBuilder pieces={item.pieces} given={given} review={review} onChange={onChange} pinyin={pinyin} />
      )}

      {part.type === 'write-sentence' && item.picture && item.word && (
        <>
          <View style={styles.row}>
            <PictureTile emoji={item.picture} label={labels?.[0]} big />
            <View>
              <AppText variant="caption" color="muted">
                Dùng từ
              </AppText>
              <RubyText ruby={item.word} pinyin={pinyin} size={26} />
            </View>
          </View>
          {onChange ? (
            <TextInput
              value={typeof given === 'string' ? given : ''}
              onChangeText={(v) => onChange(v.trim() ? v : null)}
              placeholder={`Đặt một câu có từ “${item.word.zh}”…`}
              placeholderTextColor={theme.muted}
              multiline
              style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.surface }]}
            />
          ) : (
            <AppText variant="heading" color={review?.correct ? 'good' : 'danger'}>
              {typeof given === 'string' ? given : '(bỏ trống)'}
            </AppText>
          )}
          {review && typeof review.answer === 'string' && (
            <AppText variant="small" color="good">
              Câu mẫu: {[review.answer, ...(review.alternatives ?? [])].join(' / ')}
            </AppText>
          )}
        </>
      )}

      {review && <ReviewNotes review={review} pinyin={pinyin} />}
    </Card>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  badge: { minWidth: 32, height: 32, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Spacing.sm },
  star: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm, borderRadius: Radius.md, padding: Spacing.sm },
  blankRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end', gap: 4 },
  blank: { minWidth: 56, borderBottomWidth: 2, alignItems: 'center', paddingHorizontal: 4 },
  pictureOption: { padding: Spacing.sm, gap: 4 },
  textOption: { flexDirection: 'row', justifyContent: 'flex-start', gap: Spacing.md, padding: Spacing.md },
  charOption: { width: 48, height: 48 },
  input: { borderWidth: 1, borderRadius: Radius.md, minHeight: 72, padding: Spacing.md, fontSize: 18 },
  board: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  boardCell: { alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.sm },
  boardOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
});
