import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, Card, ChipRow, Icon, Loading, PageHeader, Screen, SectionTitle } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { SignInPrompt } from '@/features/auth/auth-parts';
import { TopicExplorer } from '@/features/home/topic-explorer';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth';
import { useLearnPath, useStudyStats } from '@/lib/hooks';
import { hskLabel } from '@/lib/hsk';

/**
 * Tab Ôn tập — người học TỰ CHỌN bộ thẻ: từ đến hạn, từ hay quên, hoặc flashcard theo bài.
 * Chỉ ôn từ đã học (không nhét từ mới của cấp khác vào như bản cũ).
 */
export default function StudyTab() {
  const { user, loading } = useAuth();

  return (
    <Screen safeTop>
      <PageHeader
        icon="cards"
        title="Ôn tập"
        description="Từ đã học quay lại đúng lúc sắp quên — hoặc chọn một bài để ôn bằng flashcard."
      />
      {loading ? (
        <Loading />
      ) : user ? (
        <StudyHub />
      ) : (
        <SignInPrompt
          title="Ôn tập cần tài khoản"
          description="Hanni nhớ bạn đã học từ nào để hẹn ôn lại đúng lúc sắp quên. Tạo tài khoản miễn phí để bắt đầu."
        />
      )}
    </Screen>
  );
}

function StudyHub() {
  const theme = useTheme();
  const [level, setLevel] = useState<number | undefined>();
  const stats = useStudyStats();
  const path = useLearnPath(level);
  const s = stats.data;
  const due = s?.dueNow ?? 0;

  return (
    <>
      <Card style={{ backgroundColor: theme.primarySoft, borderColor: theme.primarySoft }}>
        <View style={styles.row}>
          <View style={[styles.icon, { backgroundColor: theme.surface }]}>
            <Icon name="cards" size={28} color="primary" />
          </View>
          <View style={styles.flex}>
            <AppText variant="title">
              {due}{' '}
              <AppText variant="small" color="muted">
                từ cần ôn hôm nay
              </AppText>
            </AppText>
            <AppText variant="caption" color="muted">
              {s ? `Đã học ${s.learnedTotal + s.inProgress} từ · ${s.learnedTotal} từ đã thuộc lâu` : 'Đang tải…'}
            </AppText>
          </View>
        </View>
        {due > 0 ? (
          <Button
            title="Bắt đầu ôn"
            icon="play"
            onPress={() => router.push({ pathname: '/review', params: { review: '1' } })}
          />
        ) : (
          // Trạng thái trống luôn kèm 1 việc tiếp theo.
          <>
            <AppText variant="small" color="muted">
              Chưa có từ đến hạn. Học bài mới, từ sẽ tự quay lại đây đúng lúc.
            </AppText>
            <Button title="Học bài mới" variant="secondary" icon="play" onPress={() => router.navigate('/')} />
          </>
        )}
        {!!s?.leechCount && (
          <Button
            title={`Ôn ${s.leechCount} từ hay quên`}
            variant="secondary"
            onPress={() => router.push({ pathname: '/review', params: { leeches: '1' } })}
          />
        )}
      </Card>

      <SectionTitle title="Flashcard theo bài" />
      {!path.data ? (
        <Loading />
      ) : (
        <>
          <ChipRow
            options={path.data.levels.map((l) => ({ value: l, label: hskLabel(l) }))}
            value={path.data.level}
            onChange={setLevel}
          />
          <TopicExplorer
            key={path.data.level}
            lessons={path.data.lessons}
            currentLessonId={path.data.currentLessonId}
            variant="review"
          />
        </>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  flex: { flex: 1 },
  icon: { width: 56, height: 56, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center' },
});
