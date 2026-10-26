import Storage from 'expo-sqlite/kv-store';
import { router, useFocusEffect, type Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import useSWR from 'swr';

import { AppText, Card, Icon, ProgressBar, type IconName } from '@/components/ui';
import { alpha } from '@/constants/theme';
import { readHistory } from '@/features/dictionary/history';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth';
import { useStudyStats } from '@/lib/hooks';
import type { MockAttempt } from '@/lib/types';

const HIDDEN_KEY = 'hanni:getting-started-hidden';

function readHidden() {
  try {
    return Storage.getItemSync(HIDDEN_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * "Bắt đầu với Hanni" (`GettingStarted` của web): việc nên thử ở tuần đầu, mỗi việc 1 nút vào thẳng và tự đánh dấu
 * khi đã làm. Web có 5 việc; app chỉ đưa 3 việc đã có trong app (chưa có chấm phát âm, giờ nhắc học).
 * Ẩn khi xong hết hoặc bấm "Ẩn".
 */
export function GettingStarted({ lessonHref }: { lessonHref: Href }) {
  const theme = useTheme();
  const { user } = useAuth();
  const [hidden, setHidden] = useState(readHidden);
  const [dictUsed, setDictUsed] = useState(() => readHistory().length > 0);
  const stats = useStudyStats();
  const exams = useSWR<MockAttempt[]>(user ? '/mock-exams/attempts/me' : null);
  // Quay lại Trang chủ sau khi tra từ thì tự tick.
  useFocusEffect(useCallback(() => setDictUsed(readHistory().length > 0), []));

  if (!user || hidden || !stats.data || !exams.data) return null;

  const steps: { icon: IconName; title: string; description: string; cta: string; href: Href; done: boolean }[] = [
    {
      icon: 'route',
      title: 'Học bài đầu tiên',
      description: '5 phút: từ mới có âm Hán Việt, mẹo đoán thanh điệu',
      cta: 'Vào bài',
      href: lessonHref,
      done: stats.data.inProgress + stats.data.learnedTotal > 0,
    },
    {
      icon: 'target',
      title: 'Làm thử 1 đề HSK',
      description: 'Chấm điểm, chữa từng câu bằng tiếng Việt',
      cta: 'Chọn đề',
      href: '/thi-thu-hsk',
      done: exams.data.length > 0,
    },
    {
      icon: 'search',
      title: 'Tra một từ',
      description: 'Gõ tiếng Việt, pinyin hay chữ Hán đều ra',
      cta: 'Tra thử',
      href: '/tu-dien',
      done: dictUsed,
    },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  if (doneCount === steps.length) return null;

  function hide() {
    try {
      Storage.setItemSync(HIDDEN_KEY, '1');
    } catch {
      // Chỉ là tuỳ chọn hiển thị.
    }
    setHidden(true);
  }

  return (
    <Card style={styles.card}>
      <View style={styles.head}>
        <View style={styles.flex}>
          <AppText weight="700" style={styles.title}>
            Bắt đầu với Hanni
          </AppText>
          <AppText color="muted" style={styles.subtitle}>
            {steps.length} việc nên thử trong tuần đầu — mỗi việc vài phút.
          </AppText>
        </View>
        <AppText weight="700" color="primary">
          {doneCount}/{steps.length}
        </AppText>
        <Pressable onPress={hide} hitSlop={8}>
          <AppText variant="caption" color="muted">
            Ẩn
          </AppText>
        </Pressable>
      </View>
      <View style={styles.progress}>
        <ProgressBar value={(doneCount / steps.length) * 100} />
      </View>
      <View style={styles.list}>
        {/* Điện thoại: việc đã xong ẩn đi (như `max-sm:hidden` của web), chỉ còn việc cần làm. */}
        {steps
          .filter((s) => !s.done)
          .map((s) => (
            <Pressable
              key={s.title}
              onPress={() => router.navigate(s.href)}
              style={({ pressed }) => [
                styles.step,
                { borderColor: pressed ? alpha(theme.primary, 0.4) : theme.border },
              ]}>
              <View style={[styles.stepIcon, { backgroundColor: alpha(theme.primary, 0.1) }]}>
                <Icon name={s.icon} size={16} color="primary" />
              </View>
              <View style={styles.flex}>
                <AppText weight="600">{s.title}</AppText>
                <AppText variant="caption" color="muted" style={styles.stepText}>
                  {s.description}
                </AppText>
                <View style={styles.cta}>
                  <AppText variant="caption" weight="700" color="primary">
                    {s.cta}
                  </AppText>
                  <Icon name="arrow" size={13} color="primary" />
                </View>
              </View>
            </Pressable>
          ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 0 },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  flex: { flex: 1, minWidth: 0 },
  title: { fontSize: 16, lineHeight: 24 },
  subtitle: { marginTop: 4 },
  progress: { marginTop: 12 },
  list: { marginTop: 16, gap: 8 },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderWidth: 1, borderRadius: 12, padding: 12 },
  stepIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  stepText: { marginTop: 2, lineHeight: 20 },
  cta: { marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 4 },
});
