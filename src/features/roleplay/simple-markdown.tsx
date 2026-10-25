import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { Spacing } from '@/constants/theme';

/** 1 dòng có **in đậm**. */
function Line({ text }: { text: string }) {
  const parts = text.split('**');
  return (
    <AppText variant="small">
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <AppText key={i} variant="small" bold>
            {p}
          </AppText>
        ) : (
          p
        ),
      )}
    </AppText>
  );
}

/** Hiện nhận xét của AI: chỉ hỗ trợ **in đậm** và gạch đầu dòng "- " (đúng thứ server yêu cầu model dùng). */
export function SimpleMarkdown({ text }: { text: string }) {
  return (
    <View style={styles.wrap}>
      {text
        .split('\n')
        .filter((l) => l.trim())
        .map((line, i) => {
          const bullet = /^\s*[-*•]\s+/.exec(line);
          return bullet ? (
            <View key={i} style={styles.bullet}>
              <AppText variant="small">•</AppText>
              <View style={styles.flex}>
                <Line text={line.slice(bullet[0].length)} />
              </View>
            </View>
          ) : (
            <Line key={i} text={line} />
          );
        })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.sm },
  bullet: { flexDirection: 'row', gap: Spacing.sm },
  flex: { flex: 1 },
});
