import { Fragment } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { alpha, Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** **in đậm** và `code` trong 1 dòng — đủ cho văn phong trả lời của trợ lý AI. */
function Inline({ text, code }: { text: string; code: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**'))
      return (
        <AppText key={i} style={styles.text} weight="700">
          {part.slice(2, -2)}
        </AppText>
      );
    if (part.startsWith('`') && part.endsWith('`'))
      return (
        <AppText key={i} style={[styles.code, { backgroundColor: code }]}>
          {part.slice(1, -1)}
        </AppText>
      );
    return <Fragment key={i}>{part}</Fragment>;
  });
}

/**
 * Markdown tối giản cho trả lời của trợ lý AI (`MarkdownLite` của web): **in đậm**, `code`, gạch đầu dòng (-, *) và
 * danh sách số (1.) theo từng dòng — đúng những kiểu prompt hệ thống yêu cầu model dùng.
 */
export function MarkdownLite({ text }: { text: string }) {
  const theme = useTheme();
  const code = alpha(theme.text, 0.08);
  const blocks: { type: 'ul' | 'ol' | 'p'; items: string[] }[] = [];

  for (const line of text.split('\n')) {
    const bullet = /^\s*[-*]\s+(.*)$/.exec(line);
    const numbered = /^\s*\d+[.)]\s+(.*)$/.exec(line);
    const last = blocks[blocks.length - 1];
    if (bullet) {
      if (last?.type === 'ul') last.items.push(bullet[1]);
      else blocks.push({ type: 'ul', items: [bullet[1]] });
    } else if (numbered) {
      if (last?.type === 'ol') last.items.push(numbered[1]);
      else blocks.push({ type: 'ol', items: [numbered[1]] });
    } else if (line.trim() !== '') {
      if (last?.type === 'p') last.items.push(line);
      else blocks.push({ type: 'p', items: [line] });
    }
  }

  return (
    <View style={styles.wrap}>
      {blocks.map((block, bi) =>
        block.type === 'p' ? (
          <AppText key={bi} style={styles.text}>
            {block.items.map((line, li) => (
              <Fragment key={li}>
                {li > 0 && '\n'}
                <Inline text={line} code={code} />
              </Fragment>
            ))}
          </AppText>
        ) : (
          <View key={bi} style={styles.list}>
            {block.items.map((item, ii) => (
              <View key={ii} style={styles.item}>
                <AppText style={[styles.text, styles.marker]}>{block.type === 'ul' ? '•' : `${ii + 1}.`}</AppText>
                <AppText style={[styles.text, styles.flex]}>
                  <Inline text={item} code={code} />
                </AppText>
              </View>
            ))}
          </View>
        ),
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  text: { fontSize: 14, lineHeight: 24 },
  code: { fontFamily: Fonts.mono, fontSize: 12, borderRadius: 4 },
  list: { gap: 4 },
  item: { flexDirection: 'row', gap: 6 },
  marker: { minWidth: 10 },
  flex: { flex: 1, minWidth: 0 },
});
