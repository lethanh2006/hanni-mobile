import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, AudioButton, Button, Card, Hanzi, SectionHeading } from '@/components/ui';
import { alpha } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { suspendWord, useLeeches, useRecentQuizzes, useSuspendedWords } from '@/lib/hooks';

/** 1 dòng từ trong thẻ có vạch ngăn (`divide-y` của web): loa · chữ Hán · pinyin · nghĩa · phần bên phải. */
function WordLine({
  hanzi,
  pinyin,
  meaning,
  audioUrl,
  right,
  first,
}: {
  hanzi: string;
  pinyin: string;
  meaning: string | null;
  audioUrl: string | null;
  right: ReactNode;
  first: boolean;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.line, !first && { borderTopWidth: 1, borderColor: theme.border }]}>
      <View style={styles.word}>
        <AudioButton src={audioUrl} size={16} />
        <Hanzi size={18}>{hanzi}</Hanzi>
        <AppText variant="caption" color="muted">
          {pinyin}
        </AppText>
        <AppText color="muted" numberOfLines={1} style={styles.flex}>
          {meaning}
        </AppText>
      </View>
      {right}
    </View>
  );
}

/** "Từ khó nhớ" + nút ôn riêng — trước đó mục này chỉ liệt kê, xem xong là cụt đường. */
export function LeechList() {
  const theme = useTheme();
  const leeches = useLeeches();
  if (!leeches.data?.length) return null;
  return (
    <View style={styles.wrap}>
      <SectionHeading
        icon="target"
        tone="accent"
        title="Từ khó nhớ"
        description="Những từ bạn hay quên nhất. Ôn riêng vài phút thường hiệu quả hơn là đợi tới lượt ôn thường."
      />
      <Button
        title={`Ôn riêng ${leeches.data.length} từ này`}
        leftIcon="cards"
        onPress={() => router.push({ pathname: '/review', params: { leeches: '1' } })}
        style={styles.self}
      />
      <Card style={styles.list}>
        {leeches.data.map((l, i) => (
          <WordLine
            key={l.word.id}
            first={i === 0}
            hanzi={l.word.simplified}
            pinyin={l.word.pinyin}
            meaning={l.word.meaningVi}
            audioUrl={l.word.audioUrl}
            right={
              <View style={[styles.badge, { backgroundColor: alpha(theme.danger, 0.1) }]}>
                <AppText variant="caption" weight="600" color="danger">
                  Sai {l.lapses} lần
                </AppText>
              </View>
            }
          />
        ))}
      </Card>
    </View>
  );
}

/** "Từ đã ẩn" — bỏ ẩn được thì người dùng mới dám ẩn. Chỉ hiện khi thật sự có từ đang ẩn. */
export function SuspendedList({ onChange }: { onChange: () => void }) {
  const suspended = useSuspendedWords();
  const [unhiding, setUnhiding] = useState<string | null>(null);
  if (!suspended.data?.length) return null;

  async function unhide(wordId: string) {
    if (unhiding) return;
    setUnhiding(wordId);
    try {
      await suspendWord(wordId, false);
      await suspended.mutate();
      onChange();
    } finally {
      setUnhiding(null);
    }
  }

  return (
    <View style={styles.wrap}>
      <SectionHeading
        icon="eye"
        tone="lavender"
        title="Từ đã ẩn"
        description="Những từ bạn đánh dấu là đã biết — không xuất hiện trong lượt ôn nữa. Đổi ý thì cho học lại bất cứ lúc nào."
      />
      <Card style={styles.list}>
        {suspended.data.map((item, i) => (
          <WordLine
            key={item.word.id}
            first={i === 0}
            hanzi={item.word.simplified}
            pinyin={item.word.pinyin}
            meaning={item.word.meaningVi}
            audioUrl={item.word.audioUrl}
            right={
              <Button
                title={unhiding === item.word.id ? 'Đang mở…' : 'Học lại'}
                variant="ghost"
                disabled={unhiding === item.word.id}
                onPress={() => void unhide(item.word.id)}
              />
            }
          />
        ))}
      </Card>
    </View>
  );
}

/** "Quiz gần đây": kết quả các bài quiz cuối buổi ôn tập. */
export function RecentQuizzes() {
  const theme = useTheme();
  const quizzes = useRecentQuizzes();
  if (!quizzes.data?.length) return null;
  return (
    <View style={styles.wrap}>
      <SectionHeading icon="check" tone="lavender" title="Quiz gần đây" description="Kết quả các bài quiz cuối buổi ôn tập." />
      <Card style={styles.list}>
        {quizzes.data.map((q, i) => (
          <View key={q.id} style={[styles.line, i > 0 && { borderTopWidth: 1, borderColor: theme.border }]}>
            <AppText color="muted">
              {q.completedAt
                ? new Date(q.completedAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
                : '—'}
            </AppText>
            <AppText>
              {q.correctCount}/{q.totalQuestions} câu
            </AppText>
            <AppText weight="600" color={q.scorePct >= 80 ? 'good' : q.scorePct >= 50 ? 'warn' : 'danger'}>
              {Math.round(q.scorePct)}%
            </AppText>
          </View>
        ))}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 20 },
  self: { alignSelf: 'flex-start' },
  list: { padding: 0, gap: 0 },
  line: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingHorizontal: 20, paddingVertical: 14 },
  word: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 8 },
  flex: { flex: 1, minWidth: 0 },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
});
