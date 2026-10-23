import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Button } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { SessionWord } from '@/lib/types';

import { shortMeaning } from './steps';

/**
 * Thanh dưới đáy sau khi trả lời: báo đúng/sai + nhắc lại từ + nút Tiếp tục.
 * `correct = null`: chưa chấm (thẻ giới thiệu từ) hoặc người học bấm "chưa biết".
 */
export function AnswerFooter({
  correct,
  word,
  skipped = false,
  onNext,
}: {
  correct: boolean | null;
  word?: Pick<SessionWord, 'simplified' | 'pinyin' | 'meaningVi'>;
  skipped?: boolean;
  onNext: () => void;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const background = correct === null ? theme.surface : correct ? theme.goodSoft : theme.dangerSoft;
  const verdict = skipped ? 'Không sao — đáp án là:' : correct ? 'Chính xác!' : 'Chưa đúng';

  return (
    <View
      style={[
        styles.footer,
        { backgroundColor: background, borderColor: theme.border, paddingBottom: insets.bottom + Spacing.md },
      ]}>
      {word && (correct !== null || skipped) && (
        <View>
          <AppText bold color={correct === null ? 'text' : correct ? 'good' : 'danger'}>
            {verdict}
          </AppText>
          <AppText variant="small" numberOfLines={1}>
            {word.simplified} · {word.pinyin} — {shortMeaning(word.meaningVi ?? '')}
          </AppText>
        </View>
      )}
      <Button title={correct === false ? 'Đã hiểu' : 'Tiếp tục'} icon="arrow" onPress={onNext} />
    </View>
  );
}

const styles = StyleSheet.create({
  footer: { borderTopWidth: 1, padding: Spacing.lg, gap: Spacing.md },
});
