import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppText, Button, ChipRow, Icon, Loading, PageHeader, Screen, Skeleton } from '@/components/ui';
import { alpha, Radius, tintPanel } from '@/constants/theme';
import { SignInPrompt } from '@/features/auth/auth-parts';
import { TopicExplorer } from '@/features/home/topic-explorer';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth';
import { useLearnPath, useStudyStats } from '@/lib/hooks';
import { hskLabel } from '@/lib/hsk';

/**
 * Tab Ôn tập (`StudyHub` của web) — người học TỰ CHỌN bộ thẻ: từ đến hạn, từ hay quên, hoặc flashcard theo bài.
 * Chỉ ôn từ đã học.
 */
export default function StudyTab() {
  const { user, loading } = useAuth();

  return (
    <Screen>
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
      <View style={[styles.hero, tintPanel(theme)]}>
        <View style={styles.row}>
          <View style={[styles.icon, { backgroundColor: alpha(theme.primary, 0.12) }]}>
            <Icon name="cards" size={30} color="primary" />
          </View>
          <View style={styles.flex}>
            <AppText weight="800" style={styles.count}>
              {due}
              <Text style={[styles.countUnit, { color: theme.muted }]}>  từ cần ôn hôm nay</Text>
            </AppText>
            <AppText color="muted" style={styles.sub}>
              {s ? `Đã học ${s.learnedTotal + s.inProgress} từ · ${s.learnedTotal} từ đã thuộc lâu` : 'Đang tải…'}
            </AppText>
          </View>
        </View>
        <View style={styles.actions}>
          {due > 0 ? (
            <Button
              title="Bắt đầu ôn"
              leftIcon="play"
              onPress={() => router.push({ pathname: '/review', params: { review: '1' } })}
              style={styles.start}
            />
          ) : (
            // Trạng thái trống luôn kèm 1 việc tiếp theo.
            <>
              <AppText color="muted" style={styles.emptyText}>
                Chưa có từ đến hạn. Học bài mới, từ sẽ tự quay lại đây đúng lúc.
              </AppText>
              <Button title="Học bài mới" variant="secondary" leftIcon="play" onPress={() => router.navigate('/')} />
            </>
          )}
          {!!s?.leechCount && (
            <Button
              title={`Ôn ${s.leechCount} từ hay quên`}
              variant="secondary"
              onPress={() => router.push({ pathname: '/review', params: { leeches: '1' } })}
            />
          )}
        </View>
      </View>

      <View>
        <AppText weight="700" style={styles.decksTitle}>
          Flashcard theo bài
        </AppText>
        <AppText color="muted">Chọn cấp, chọn chủ đề rồi chọn bài.</AppText>
        {path.data && (
          <View style={styles.levels}>
            <ChipRow
              options={path.data.levels.map((l) => ({ value: l, label: hskLabel(l) }))}
              value={path.data.level}
              onChange={setLevel}
            />
          </View>
        )}
        <View style={styles.decks}>
          {!path.data ? (
            [0, 1, 2].map((i) => <Skeleton key={i} height={112} radius={Radius.lg} />)
          ) : (
            // Cùng khung chọn chủ đề → bài với lộ trình ở Trang chủ: bài đã học ôn bằng flashcard, chưa học thì mời học trước.
            <TopicExplorer
              key={path.data.level}
              lessons={path.data.lessons}
              currentLessonId={path.data.currentLessonId}
              variant="review"
            />
          )}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  hero: { borderWidth: 1, borderRadius: Radius.lg, padding: 20, gap: 20 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  icon: { width: 64, height: 64, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1, minWidth: 0 },
  count: { fontSize: 30, lineHeight: 32 },
  countUnit: { fontSize: 16, fontWeight: '600' },
  sub: { marginTop: 8 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  start: { minWidth: 176 },
  emptyText: { maxWidth: 256 },
  decksTitle: { fontSize: 18, lineHeight: 28 },
  levels: { marginTop: 12 },
  decks: { marginTop: 16, gap: 12 },
});
