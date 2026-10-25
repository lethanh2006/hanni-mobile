import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Card, ChipRow, TextLink } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useCurrentLesson, useWords } from '@/lib/hooks';
import { HSK_LEVELS, hskLabel } from '@/lib/hsk';
import type { Word } from '@/lib/types';

export interface WordScope {
  /** Tên bài đang học khi đang luyện theo bài; `null` = luyện tự do theo cấp. */
  lessonTitle: string | null;
  canUseLesson: boolean;
  level: number;
  page: number;
  totalPages: number;
  backToLesson: () => void;
  chooseLevel: (level: number) => void;
  choosePage: (page: number) => void;
}

/**
 * Bộ từ để luyện: mặc định ĐÚNG BÀI ĐANG HỌC DỞ (khách không có thì theo cấp); người học
 * chủ động chọn cấp thì luyện tự do theo cấp + nhóm 24 từ (như `PracticeLibrary` của web).
 */
export function usePracticeWords(): { words: Word[]; loading: boolean; error: boolean; scope: WordScope } {
  const current = useCurrentLesson();
  const [freeMode, setFreeMode] = useState(false);
  const [level, setLevel] = useState(1);
  const [page, setPage] = useState(1);
  const lesson = !freeMode ? current.data : null;
  const words = useWords(lesson ? { lessonId: lesson.id } : { level, page });

  return {
    words: words.data?.items ?? [],
    loading: !words.data && !words.error,
    error: Boolean(words.error),
    scope: {
      lessonTitle: lesson?.title ?? null,
      canUseLesson: Boolean(current.data),
      level,
      page,
      totalPages: words.data?.totalPages ?? 1,
      backToLesson: () => setFreeMode(false),
      chooseLevel: (l) => {
        setFreeMode(true);
        setLevel(l);
        setPage(1);
      },
      choosePage: setPage,
    },
  };
}

/** Ô chọn nhóm từ: bài đang học, hoặc cấp HSK + nhóm. */
export function ScopePicker({ scope }: { scope: WordScope }) {
  const { page, totalPages } = scope;
  if (scope.lessonTitle) {
    return (
      <Card>
        <AppText variant="small" color="muted">
          Đang luyện từ của bài
        </AppText>
        <AppText bold>{scope.lessonTitle}</AppText>
        <TextLink title="Luyện tự do theo cấp HSK" onPress={() => scope.chooseLevel(scope.level)} />
      </Card>
    );
  }
  return (
    <Card>
      <ChipRow
        options={HSK_LEVELS.map((l) => ({ value: l, label: hskLabel(l) }))}
        value={scope.level}
        onChange={scope.chooseLevel}
      />
      <View style={styles.row}>
        <TextLink
          title="← Nhóm trước"
          color={page > 1 ? 'primary' : 'muted'}
          onPress={() => page > 1 && scope.choosePage(page - 1)}
        />
        <AppText variant="small" color="muted">
          Nhóm {page}/{totalPages}
        </AppText>
        <TextLink
          title="Nhóm tiếp →"
          color={page < totalPages ? 'primary' : 'muted'}
          onPress={() => page < totalPages && scope.choosePage(page + 1)}
        />
      </View>
      {scope.canUseLesson && <TextLink title="Quay về từ của bài đang học" onPress={scope.backToLesson} />}
    </Card>
  );
}

/** Nghĩa ngắn để làm gợi ý / đáp án. */
export const firstMeaning = (w: Pick<Word, 'meaningVi' | 'meaningEn'>) => (w.meaningVi ?? w.meaningEn ?? '').split(';')[0];

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm },
});
