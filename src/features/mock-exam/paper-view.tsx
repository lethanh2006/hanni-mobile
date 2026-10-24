import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { MockAnswer, MockPaper, MockReviewItem } from '@/lib/types';

import { ExamItem, SharedBoard } from './exam-item';
import { instruction, officialIndexes, PART_ZH, SECTION_VI } from './labels';

/**
 * Toàn bộ đề theo phần Nghe/Đọc/Viết. Dùng chung cho lúc làm bài (`onAnswer`) và lúc chữa bài (`review`).
 * `only` = chỉ hiện các câu này (chữa bài: lọc câu sai).
 */
export function PaperView({
  paper,
  answers,
  pinyin,
  onAnswer,
  review,
  only,
}: {
  paper: MockPaper;
  answers: (MockAnswer | null)[];
  pinyin: boolean;
  onAnswer?: (no: number, v: MockAnswer | null) => void;
  review?: Map<number, MockReviewItem>;
  only?: Set<number>;
}) {
  const theme = useTheme();
  return (
    <>
      {paper.sections.map((section) => {
        const official = officialIndexes(section.parts);
        const parts = section.parts
          .map((part, pi) => ({ part, pi, items: part.items.filter((it) => !only || only.has(it.no)) }))
          .filter((p) => p.items.length > 0);
        if (parts.length === 0) return null;
        return (
          <View key={section.kind} style={styles.section}>
            <View style={[styles.sectionTitle, { borderColor: theme.primary }]}>
              <AppText variant="title">{SECTION_VI[section.kind].zh}</AppText>
              <AppText bold color="muted">
                {SECTION_VI[section.kind].vi}
              </AppText>
            </View>
            {parts.map(({ part, pi, items }) => (
              <View key={part.no} style={styles.section}>
                <View style={[styles.partHead, { backgroundColor: theme.surface2 }]}>
                  <AppText variant="small" bold>
                    {PART_ZH[official[pi]]} · Câu {part.no}–{part.no + part.items.length - 1}
                  </AppText>
                  <AppText variant="small" color="muted">
                    {instruction(section.kind, part)}
                  </AppText>
                </View>
                <SharedBoard part={part} pinyin={pinyin} />
                {items.map((item) => (
                  <ExamItem
                    key={item.no}
                    part={part}
                    item={item}
                    section={section.kind}
                    given={answers[item.no - 1] ?? null}
                    onChange={onAnswer && ((v) => onAnswer(item.no, v))}
                    review={review?.get(item.no)}
                    pinyin={pinyin}
                  />
                ))}
              </View>
            ))}
          </View>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing.md },
  sectionTitle: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.md, borderLeftWidth: 4, paddingLeft: Spacing.md },
  partHead: { borderRadius: Radius.lg, padding: Spacing.md, gap: 2 },
});
