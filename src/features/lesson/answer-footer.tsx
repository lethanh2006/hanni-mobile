import { StyleSheet, View } from 'react-native';
import Reanimated, { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Button, Hanzi, Icon, Mascot } from '@/components/ui';
import { alpha, mix } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { SessionWord } from '@/lib/types';

import { shortMeaning } from './steps';

/**
 * Thanh dưới đáy sau khi trả lời (`footer` của phiên học web): báo đúng/sai + nhắc lại từ + nút Tiếp tục.
 * `correct = null`: chưa chấm (thẻ giới thiệu từ) hoặc người học bấm "chưa biết" (`skipped`, kiểm tra trình độ).
 * `retry`: phiên học — trả lời sai thì nút thành "Đã hiểu" nền đỏ (câu sai sẽ quay lại cuối bài).
 */
export function AnswerFooter({
  correct,
  word,
  skipped = false,
  retry = false,
  onNext,
}: {
  correct: boolean | null;
  word?: Pick<SessionWord, 'simplified' | 'pinyin' | 'meaningVi'>;
  skipped?: boolean;
  retry?: boolean;
  onNext: () => void;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const look =
    correct === null
      ? { borderColor: theme.border, backgroundColor: theme.surface }
      : correct
        ? { borderColor: alpha(theme.good, 0.3), backgroundColor: mix(theme.good, theme.background, 0.1) }
        : { borderColor: alpha(theme.danger, 0.3), backgroundColor: mix(theme.danger, theme.background, 0.1) };
  const wrongButton = retry && correct === false;
  const reduce = useReducedMotion();

  return (
    <Reanimated.View
      style={[
        styles.footer,
        look,
        { paddingBottom: insets.bottom + 16 },
        // `.sheet-up` của web: tấm đúng/sai trượt từ đáy lên.
        correct !== null && !reduce && { animationName: SHEET_UP, animationDuration: '280ms', animationTimingFunction: 'ease-out' },
      ]}>
      {word && (correct !== null || skipped) && (
        <View style={styles.row}>
          {/* Cáo phản ứng theo câu trả lời: vỗ tay khi đúng, nắm tay cổ vũ khi sai. */}
          {correct !== null && (
            <Mascot key={String(correct)} emote={correct ? 'e04-vui-mung' : 'e05-co-len'} size={60} pop style={styles.fox} />
          )}
          <View style={styles.flex}>
            <View style={styles.verdict}>
              {correct !== null && <Icon name={correct ? 'check' : 'close'} size={18} color={correct ? 'good' : 'danger'} />}
              <AppText weight="700" color={correct === null ? 'text' : correct ? 'good' : 'danger'} style={styles.verdictText}>
                {correct === null ? 'Không sao — đáp án là:' : correct ? 'Chính xác!' : 'Chưa đúng'}
              </AppText>
            </View>
            <AppText numberOfLines={1} style={styles.word}>
              <Hanzi size={14}>{word.simplified}</Hanzi> <AppText color="muted">{word.pinyin}</AppText> —{' '}
              {shortMeaning(word.meaningVi ?? '')}
            </AppText>
          </View>
        </View>
      )}
      <Button
        title={wrongButton ? 'Đã hiểu' : 'Tiếp tục'}
        icon="arrow"
        onPress={onNext}
        style={
          wrongButton && {
            backgroundColor: theme.danger,
            borderColor: theme.danger,
            backgroundImage: 'none',
            boxShadow: `0 3px 0 ${mix(theme.danger, theme.text, 0.78)}`,
          }
        }
      />
    </Reanimated.View>
  );
}

const SHEET_UP = { from: { transform: [{ translateY: 160 }] }, to: { transform: [{ translateY: 0 }] } };

const styles = StyleSheet.create({
  footer: { borderTopWidth: 1, paddingHorizontal: 16, paddingTop: 16, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  fox: { marginVertical: -8 },
  flex: { flex: 1, minWidth: 0 },
  verdict: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  verdictText: { fontSize: 16, lineHeight: 24 },
  word: { marginTop: 2 },
});
