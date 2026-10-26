import { StyleSheet, View, type HostInstance } from 'react-native';

import { AppText, Hanzi } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import type { MockAnswer, MockPaper, MockReviewItem } from '@/lib/types';

import { ExamItem, SharedBoard } from './exam-item';
import { instruction, officialIndexes, PART_ZH, SECTION_VI } from './labels';

/** Đầu phần thi: vạch đỏ bên trái, "听力" to + "Nghe hiểu". */
export function SectionHeading({ kind }: { kind: MockPaper['sections'][number]['kind'] }) {
  const theme = useTheme();
  return (
    <View style={[styles.sectionTitle, { borderColor: theme.primary }]}>
      <Hanzi size={24} style={styles.bold}>
        {SECTION_VI[kind].zh}
      </Hanzi>
      <AppText weight="600" color="muted">
        {SECTION_VI[kind].vi}
      </AppText>
    </View>
  );
}

/**
 * Toàn bộ đề theo phần Nghe/Đọc/Viết (`main` của phòng thi web). Dùng chung cho lúc làm bài (`onAnswer`, đánh dấu)
 * và lúc chữa bài (`review`). `only` = chỉ hiện các câu này (chữa bài: lọc câu sai). `itemRef` để cuộn tới câu.
 */
export function PaperView({
  paper,
  answers,
  pinyin,
  onAnswer,
  review,
  only,
  flags,
  onFlag,
  itemRef,
  onAsk,
  compactHead = false,
}: {
  paper: MockPaper;
  answers: (MockAnswer | null)[];
  pinyin: boolean;
  onAnswer?: (no: number, v: MockAnswer | null) => void;
  review?: Map<number, MockReviewItem>;
  only?: Set<number>;
  flags?: number[];
  onFlag?: (no: number) => void;
  itemRef?: (no: number) => (view: HostInstance | null) => void;
  /** Chữa bài: nút hỏi trợ lý AI dưới mỗi câu. */
  onAsk?: (no: number) => void;
  /** Chữa bài: đầu mỗi phần chỉ 1 dòng "Nghe hiểu · 第一部分", không có khung hướng dẫn. */
  compactHead?: boolean;
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
        const shared = (type: string) => type === 'match-picture' || type === 'match-text' || type === 'fill-blank';
        return (
          <View key={section.kind} style={compactHead ? styles.reviewSection : styles.section}>
            {!compactHead && <SectionHeading kind={section.kind} />}
            {parts.map(({ part, pi, items }) => (
              <View key={part.no} style={styles.part}>
                {compactHead ? (
                  <AppText weight="700">
                    {SECTION_VI[section.kind].vi} · <Hanzi size={14}>{PART_ZH[official[pi]]}</Hanzi>
                  </AppText>
                ) : (
                  <View style={[styles.partHead, { backgroundColor: theme.surface2 }]}>
                    <AppText weight="700">
                      <Hanzi size={14}>{PART_ZH[official[pi]]}</Hanzi>
                      {'  '}Câu {part.no}–{part.no + part.items.length - 1}
                    </AppText>
                    <AppText color="muted" style={styles.instruction}>
                      {instruction(section.kind, part)}
                    </AppText>
                  </View>
                )}
                {(!compactHead || shared(part.type)) && (
                  <SharedBoard
                    part={part}
                    pinyin={pinyin}
                    labels={part.type === 'match-picture' ? review?.get(part.items[0].no)?.pictureLabels : undefined}
                  />
                )}
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
                    flagged={flags?.includes(item.no)}
                    onFlag={onFlag && (() => onFlag(item.no))}
                    itemRef={itemRef?.(item.no)}
                    onAsk={onAsk && (() => onAsk(item.no))}
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
  section: { gap: 24 },
  reviewSection: { gap: 16 },
  part: { gap: 12 },
  sectionTitle: { flexDirection: 'row', alignItems: 'baseline', gap: 12, borderLeftWidth: 4, paddingLeft: 12 },
  bold: { fontWeight: '700' },
  partHead: { borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12 },
  instruction: { marginTop: 2 },
});
