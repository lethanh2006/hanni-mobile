import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, AudioButton, Button, Card, SectionTitle, TextLink } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { suspendWord, useLeeches, useSuspendedWords } from '@/lib/hooks';

function WordRow({
  hanzi,
  pinyin,
  meaning,
  audioUrl,
  right,
}: {
  hanzi: string;
  pinyin: string;
  meaning: string | null;
  audioUrl: string | null;
  right: ReactNode;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.row, { borderColor: theme.border }]}>
      <AudioButton src={audioUrl} />
      <View style={styles.flex}>
        <AppText variant="heading">
          {hanzi}{' '}
          <AppText variant="caption" color="muted">
            {pinyin}
          </AppText>
        </AppText>
        <AppText variant="small" color="muted" numberOfLines={1}>
          {meaning}
        </AppText>
      </View>
      {right}
    </View>
  );
}

/** Từ hay quên nhất + nút ôn riêng — trước đó mục này chỉ liệt kê, xem xong là cụt đường. */
export function LeechList() {
  const leeches = useLeeches();
  if (!leeches.data?.length) return null;
  return (
    <Card>
      <SectionTitle title="Từ khó nhớ" />
      <AppText variant="small" color="muted">
        Ôn riêng vài phút thường hiệu quả hơn là đợi tới lượt ôn thường.
      </AppText>
      <Button
        title={`Ôn riêng ${leeches.data.length} từ này`}
        variant="secondary"
        onPress={() => router.push({ pathname: '/review', params: { leeches: '1' } })}
      />
      {leeches.data.map((l) => (
        <WordRow
          key={l.word.id}
          hanzi={l.word.simplified}
          pinyin={l.word.pinyin}
          meaning={l.word.meaningVi}
          audioUrl={l.word.audioUrl}
          right={
            <AppText variant="caption" bold color="danger">
              Sai {l.lapses} lần
            </AppText>
          }
        />
      ))}
    </Card>
  );
}

/** Từ đã đánh dấu "đã biết" — bỏ ẩn được thì người dùng mới dám ẩn. */
export function SuspendedList({ onChange }: { onChange: () => void }) {
  const suspended = useSuspendedWords();
  const [unhiding, setUnhiding] = useState<string | null>(null);
  if (!suspended.data?.length) return null;

  async function unhide(wordId: string) {
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
    <Card>
      <SectionTitle title="Từ đã ẩn" />
      <AppText variant="small" color="muted">
        Những từ bạn đánh dấu là đã biết — không xuất hiện trong lượt ôn nữa. Đổi ý thì cho học lại bất cứ lúc nào.
      </AppText>
      {suspended.data.map((item) => (
        <WordRow
          key={item.word.id}
          hanzi={item.word.simplified}
          pinyin={item.word.pinyin}
          meaning={item.word.meaningVi}
          audioUrl={item.word.audioUrl}
          right={
            <TextLink
              title={unhiding === item.word.id ? 'Đang mở…' : 'Học lại'}
              onPress={() => void unhide(item.word.id)}
            />
          }
        />
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderTopWidth: 1, paddingTop: Spacing.sm },
  flex: { flex: 1 },
});
