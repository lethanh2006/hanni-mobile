import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Button, Card, Chip, EmptyState, ErrorNote, Icon, IconTile, Loading, PageHeader, type IconName } from '@/components/ui';
import { alpha, mix } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth';
import { HSK_LEVELS, hskLabel } from '@/lib/hsk';
import type { Word } from '@/lib/types';

import type { WordScope } from './practice-words';

/** Nhãn "HSK N" viền đỏ nhạt có bóng đáy (`.levelBadge`). */
export function LevelBadge({ label }: { label: string }) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.badge,
        {
          borderColor: mix(theme.primary, theme.border, 0.16),
          backgroundColor: mix(theme.primary, theme.surface, 0.07),
          boxShadow: `0 3px 0 ${mix(theme.primary, theme.border, 0.07)}`,
        },
      ]}>
      <AppText variant="caption" weight="700" color="primary">
        {label}
      </AppText>
    </View>
  );
}

/**
 * Khung luyện kỹ năng (`PracticeLibrary` của web): đầu trang + "Lộ trình của bạn"; chưa bắt đầu thì thẻ "Bài luyện của
 * bạn" (bài đang học hoặc chọn cấp HSK) + khối "Một chút chuẩn bị"; bắt đầu rồi thì thanh bài đang luyện + bài luyện.
 */
export function PracticeLibrary({
  icon,
  tone,
  title,
  description,
  startLabel,
  guideTitle,
  guideNote,
  steps,
  words,
  loading,
  error,
  scope,
  onRetry,
  children,
}: {
  icon: IconName;
  tone: 'primary' | 'accent';
  title: string;
  description: string;
  startLabel: string;
  guideTitle: string;
  guideNote: string;
  steps: string[];
  words: Word[];
  loading: boolean;
  error: boolean;
  scope: WordScope;
  onRetry: () => void;
  children: (words: Word[]) => ReactNode;
}) {
  const theme = useTheme();
  const { user } = useAuth();
  const [started, setStarted] = useState(false);
  const inLesson = Boolean(scope.lessonTitle);
  const levelLabel = `HSK ${scope.lessonLevel ?? scope.level}`;

  const pagination = !inLesson && scope.totalPages > 1 && !error && (
    <View style={styles.pagination}>
      <Button
        title="Nhóm trước"
        leftIcon="back"
        variant="ghost"
        disabled={scope.page === 1 || loading}
        onPress={() => scope.choosePage(scope.page - 1)}
        style={styles.pageButton}
      />
      <AppText variant="caption" color="muted">
        Nhóm {scope.page} / {scope.totalPages}
      </AppText>
      <Button
        title="Nhóm tiếp"
        icon="arrow"
        variant="ghost"
        disabled={scope.page >= scope.totalPages || loading}
        onPress={() => scope.choosePage(scope.page + 1)}
        style={styles.pageButton}
      />
    </View>
  );

  return (
    <View style={styles.page}>
      {!user && (
        <View style={[styles.guest, { borderColor: alpha(theme.primary, 0.2), backgroundColor: alpha(theme.primary, 0.05) }]}>
          <AppText>
            Bạn đang luyện thử — kết quả chưa được lưu. Tạo tài khoản miễn phí để Hanni ghi lại từ bạn hay sai và nhắc ôn đúng
            lúc.
          </AppText>
          <AppText weight="600" color="primary" onPress={() => router.push('/register')}>
            Tạo tài khoản
          </AppText>
        </View>
      )}
      <View style={styles.head}>
        <PageHeader icon={icon} tone={tone} title={title} description={description} />
        <Pressable onPress={() => router.navigate('/')} style={styles.pathLink} hitSlop={6}>
          <AppText weight="500" color="muted">
            Lộ trình của bạn
          </AppText>
          <Icon name="arrow" size={16} color="muted" />
        </Pressable>
      </View>

      {started ? (
        <>
          <View
            style={[
              styles.sessionBar,
              { borderColor: theme.border, backgroundColor: theme.surface, boxShadow: `0 8px 22px -22px ${alpha(theme.primary, 0.35)}` },
            ]}>
            <View style={styles.sessionInfo}>
              <LevelBadge label={levelLabel} />
              <AppText variant="caption" color="muted" style={styles.flex}>
                {inLesson ? `Bài: ${scope.lessonTitle}` : `Nhóm ${scope.page}`} · {words.length} từ
              </AppText>
            </View>
            <Button title="Đổi bài luyện" leftIcon="settings" variant="ghost" onPress={() => setStarted(false)} />
          </View>
          {error ? (
            <ErrorNote>Chưa tải được bài luyện. Kéo xuống để thử lại.</ErrorNote>
          ) : loading ? (
            <Loading />
          ) : words.length ? (
            children(words)
          ) : (
            <EmptyState title="Chưa có từ trong nhóm này" description="Chọn nhóm khác để tiếp tục luyện tập." />
          )}
          {pagination}
        </>
      ) : (
        <>
          <Card style={styles.setup}>
            <View style={styles.setupHead}>
              <IconTile
                icon={icon}
                iconSize={22}
                style={{
                  transform: [{ rotate: '-6deg' }],
                  boxShadow: `0 4px 0 ${mix(theme.primary, theme.border, 0.12)}, 0 10px 18px -14px ${alpha(theme.primary, 0.4)}`,
                }}
              />
              <View style={styles.flex}>
                <AppText weight="600" style={styles.setupTitle}>
                  Bài luyện của bạn
                </AppText>
                <AppText variant="caption" color="muted" style={styles.setupText}>
                  {inLesson
                    ? `Luyện đúng từ vựng của bài "${scope.lessonTitle}".`
                    : 'Chọn mức vừa sức, tiến bộ từng chút một.'}
                </AppText>
              </View>
            </View>
            {!inLesson && (
              <View>
                <AppText weight="500" style={styles.pickerTitle}>
                  Chọn cấp độ HSK
                </AppText>
                <View style={styles.levels}>
                  {HSK_LEVELS.map((l) => (
                    <Chip key={l} label={hskLabel(l)} active={scope.level === l} onPress={() => scope.chooseLevel(l)} />
                  ))}
                </View>
              </View>
            )}
            <View style={[styles.summary, { borderColor: theme.border }]}>
              <LevelBadge label={levelLabel} />
              <View style={styles.flex}>
                <AppText weight="600">
                  {loading ? 'Đang chuẩn bị từ vựng…' : error ? 'Chưa tải được từ vựng' : `${words.length} từ trong bài luyện`}
                </AppText>
                <AppText variant="caption" color="muted" style={styles.setupText}>
                  {!error && !loading
                    ? `${scope.total.toLocaleString('vi-VN')} từ trong thư viện · Nhóm ${scope.page}`
                    : 'Nghe kỹ, luyện từng từ theo nhịp của bạn.'}
                </AppText>
              </View>
            </View>
            {error && (
              <ErrorNote>
                Chưa tải được nội dung.{' '}
                <AppText weight="600" color="danger" style={styles.underline} onPress={onRetry}>
                  Thử lại
                </AppText>
              </ErrorNote>
            )}
            {!error && !loading && !words.length && (
              <AppText color="muted">Cấp độ này đang được cập nhật. Chọn một cấp khác để bắt đầu nhé.</AppText>
            )}
            <Button
              title={startLabel}
              icon="arrow"
              disabled={loading || error || !words.length}
              onPress={() => setStarted(true)}
              style={[styles.start, { boxShadow: `0 7px 16px -9px ${alpha(theme.primary, 0.65)}` }]}
            />
            {inLesson && (
              <Pressable onPress={() => scope.chooseLevel(scope.level)} style={styles.free} hitSlop={6}>
                <AppText variant="caption" weight="500" color="muted">
                  Hoặc luyện tự do theo cấp độ
                </AppText>
                <Icon name="arrow" size={13} color="muted" />
              </Pressable>
            )}
            {!inLesson && scope.canUseLesson && (
              <Pressable onPress={scope.backToLesson} style={styles.free} hitSlop={6}>
                <AppText variant="caption" weight="500" color="muted">
                  Quay về từ của bài đang học
                </AppText>
                <Icon name="arrow" size={13} color="muted" />
              </Pressable>
            )}
            {pagination}
          </Card>

          <View
            style={[
              styles.guide,
              {
                borderColor: theme.border,
                backgroundColor: theme.surface,
                backgroundImage: `radial-gradient(ellipse at 100% 0%, ${alpha(theme.primary, 0.1)}, transparent 65%), linear-gradient(155deg, ${mix(theme.primary, theme.surface, 0.03)}, ${mix(theme.accent, theme.surface, 0.07)})`,
              },
            ]}>
            <View style={[styles.ring, styles.ringBig, { borderColor: alpha(theme.primary, 0.12) }]} pointerEvents="none" />
            <View style={[styles.ring, styles.ringSmall, { borderColor: alpha(theme.primary, 0.12) }]} pointerEvents="none" />
            <View style={styles.guideLabel}>
              <Icon name="spark" size={16} color="primary" />
              <AppText variant="caption" weight="500" color="primary">
                Một chút chuẩn bị
              </AppText>
            </View>
            <AppText weight="600" style={styles.guideTitle}>
              {guideTitle}
            </AppText>
            <View style={styles.steps}>
              {steps.map((step, i) => (
                <View key={step} style={styles.step}>
                  <View
                    style={[
                      styles.stepNo,
                      {
                        borderColor: mix(theme.primary, theme.border, 0.18),
                        backgroundColor: theme.surface,
                        boxShadow: `0 3px 0 ${mix(theme.primary, theme.border, 0.09)}`,
                      },
                    ]}>
                    <AppText variant="caption" weight="600" color="primary">
                      {i + 1}
                    </AppText>
                  </View>
                  <AppText color="muted" style={styles.stepText}>
                    {step}
                  </AppText>
                </View>
              ))}
            </View>
            <View style={[styles.note, { borderColor: theme.border }]}>
              <Icon name={icon} size={18} color="muted" />
              <AppText variant="caption" color="muted" style={styles.noteText}>
                {guideNote}
              </AppText>
            </View>
          </View>
        </>
      )}
    </View>
  );
}

/** Cột phụ dưới bài luyện (`PracticeTips` của web): các mẹo đánh số + lối "Ôn lại để nhớ lâu hơn". */
export function PracticeTips({ title, tips, children }: { title: string; tips: string[]; children?: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={styles.tips}>
      {children}
      <Card>
        <View style={styles.tipsHead}>
          <Icon name="spark" size={18} color="primary" />
          <AppText weight="600">{title}</AppText>
        </View>
        <View style={styles.tipList}>
          {tips.map((tip, i) => (
            <View key={tip} style={styles.tip}>
              <View style={[styles.tipNo, { backgroundColor: alpha(theme.primary, 0.08) }]}>
                <AppText variant="caption" weight="600" color="primary">
                  {i + 1}
                </AppText>
              </View>
              <AppText color="muted" style={styles.tipText}>
                {tip}
              </AppText>
            </View>
          ))}
        </View>
      </Card>
      <Card onPress={() => router.navigate('/study')} style={styles.review}>
        <View style={styles.flex}>
          <AppText weight="600">Ôn lại để nhớ lâu hơn</AppText>
          <AppText variant="caption" color="muted" style={styles.reviewText}>
            Tiếp tục với thẻ ghi nhớ của bạn
          </AppText>
        </View>
        <Icon name="arrow" size={18} color="primary" />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { gap: 28 },
  flex: { flex: 1, minWidth: 0 },
  guest: { gap: 8, borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12 },
  head: { gap: 12 },
  pathLink: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start' },
  badge: { minHeight: 36, borderWidth: 1, borderRadius: 9, paddingHorizontal: 11, paddingVertical: 6, justifyContent: 'center' },
  setup: { gap: 24, padding: 20 },
  setupHead: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  setupTitle: { fontSize: 19, lineHeight: 26, letterSpacing: -0.5 },
  setupText: { marginTop: 5, lineHeight: 20 },
  pickerTitle: { marginBottom: 12, fontSize: 13 },
  levels: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  summary: { flexDirection: 'row', alignItems: 'center', gap: 14, borderTopWidth: 1, paddingTop: 22 },
  underline: { textDecorationLine: 'underline' },
  start: { minHeight: 48 },
  free: { marginTop: -12, minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' },
  pagination: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 3 },
  pageButton: { minHeight: 36, paddingHorizontal: 10 },
  guide: { overflow: 'hidden', borderWidth: 1, borderRadius: 16, padding: 20 },
  ring: { position: 'absolute', borderWidth: 1, borderRadius: 999 },
  ringBig: { right: -64, bottom: -85, width: 230, height: 230 },
  ringSmall: { right: -24, bottom: -45, width: 150, height: 150 },
  guideLabel: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  guideTitle: { marginTop: 14, fontSize: 20, lineHeight: 28, letterSpacing: -0.5 },
  steps: { marginTop: 20, gap: 16 },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  stepNo: {
    width: 26,
    height: 26,
    borderWidth: 1,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-5deg' }],
  },
  stepText: { flex: 1, fontSize: 13, lineHeight: 23 },
  note: { marginTop: 28, paddingTop: 20, borderTopWidth: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  noteText: { flex: 1, lineHeight: 22 },
  sessionBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 15,
  },
  sessionInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 1 },
  tips: { gap: 16 },
  tipsHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  tipList: { gap: 16 },
  tip: { flexDirection: 'row', gap: 12 },
  tipNo: { marginTop: 2, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tipText: { flex: 1, lineHeight: 24 },
  review: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  reviewText: { marginTop: 4 },
});
