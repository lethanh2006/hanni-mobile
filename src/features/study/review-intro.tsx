import { StyleSheet, View } from 'react-native';

import { AppText, Button, Hanzi, Icon, type IconName } from '@/components/ui';
import { alpha, mix, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Word } from '@/lib/types';

const STEPS: { title: string; text: string; icon: IconName; color: ThemeColor; tint: number }[] = [
  { title: 'Nhìn và nhớ', text: 'Nhìn Hán tự, thử nghĩ đến nghĩa trước khi mở đáp án.', icon: 'eye', color: 'primary', tint: 0.07 },
  { title: 'Lật và khám phá', text: 'Chạm vào thẻ để xem nghĩa và ví dụ.', icon: 'cards', color: 'accent', tint: 0.09 },
  { title: 'Chọn mức độ nhớ', text: 'Chọn mức 1–4. Hanni sẽ hẹn bạn ôn lại vào lúc phù hợp.', icon: 'target', color: 'good', tint: 0.08 },
];

/**
 * Màn mở đầu buổi ôn (`phase === "intro"` của `/study` web, khổ điện thoại): khung hero có nhãn "Một chút mỗi ngày",
 * số thẻ ôn lại / từ mới, nút bắt đầu, chồng thẻ minh hoạ; dưới là "Một vòng ôn, ba bước nhỏ".
 */
export function ReviewIntro({
  title,
  leech,
  reviewCount,
  newCount,
  previewWord,
  newFrom,
  onStart,
  onPickLesson,
}: {
  title: string;
  leech: boolean;
  reviewCount: number;
  newCount: number;
  previewWord?: Word;
  /** Bài lấy từ mới (ôn tự do có từ mới). */
  newFrom?: { orderIndex: number; title: string } | null;
  onStart: () => void;
  onPickLesson: () => void;
}) {
  const theme = useTheme();
  return (
    <View>
      <View
        style={[
          styles.hero,
          {
            borderColor: mix(theme.primary, theme.border, 0.12),
            backgroundColor: theme.surface,
            backgroundImage: `radial-gradient(ellipse at 95% 100%, ${alpha(theme.primary, 0.09)}, transparent 65%), linear-gradient(120deg, ${theme.surface}, ${theme.heroFrom})`,
          },
        ]}>
        <View style={styles.eyebrow}>
          <View style={[styles.dot, { backgroundColor: theme.good }]} />
          <AppText weight="600" color="primary" style={styles.eyebrowText}>
            MỘT CHÚT MỖI NGÀY
          </AppText>
        </View>
        <AppText weight="700" style={styles.title}>
          {title}
        </AppText>
        <AppText color="muted" style={styles.description}>
          {leech
            ? 'Đây là những từ bạn sai nhiều nhất. Gặp lại thêm vài lần là nhớ được thôi.'
            : 'Lật một tấm thẻ, nhớ thêm một từ. Cùng dành vài phút cho những điều bạn đã học nhé.'}
        </AppText>
        <View style={styles.stats}>
          <AppText variant="caption" color="muted">
            <AppText weight="600" style={styles.statValue}>
              {reviewCount}
            </AppText>{' '}
            thẻ ôn lại
          </AppText>
          <AppText variant="caption" color="muted">
            <AppText weight="600" style={styles.statValue}>
              {newCount}
            </AppText>{' '}
            từ mới
          </AppText>
        </View>
        {newFrom && newCount > 0 && (
          <AppText variant="caption" color="muted" center style={styles.newFrom}>
            Từ mới lấy từ bài{' '}
            <AppText variant="caption" weight="700">
              {newFrom.orderIndex}. {newFrom.title}
            </AppText>
          </AppText>
        )}
        <Button
          title={reviewCount > 0 ? 'Bắt đầu ôn tập' : 'Bắt đầu học từ mới'}
          icon="arrow"
          onPress={onStart}
          style={[styles.start, { boxShadow: `0 5px 0 ${mix(theme.primary, '#57261d', 0.65)}, 0 9px 20px ${alpha(theme.primary, 0.14)}` }]}
        />
        <AppText variant="caption" color="muted" center style={styles.note}>
          {reviewCount + newCount} thẻ sẵn sàng ·{' '}
          <AppText variant="caption" weight="600" color="primary" style={styles.underline} onPress={onPickLesson}>
            Chọn bài khác
          </AppText>
        </AppText>
        <Deck word={previewWord} />
      </View>

      <View style={styles.guideHeading}>
        <AppText weight="600" style={styles.guideTitle}>
          Một vòng ôn, ba bước nhỏ
        </AppText>
        <AppText variant="caption" color="muted">
          Không cần vội. Cứ thử nhớ trước.
        </AppText>
      </View>
      <View style={styles.steps}>
        {STEPS.map((s, i) => (
          <View
            key={s.title}
            style={[styles.step, { borderColor: theme.border, backgroundColor: alpha(theme.surface, 0.85) }]}>
            <View style={[styles.stepIcon, { backgroundColor: mix(theme[s.color], theme.surface, s.tint) }]}>
              <Icon name={s.icon} size={21} color={s.color} />
            </View>
            <View style={styles.flex}>
              <AppText weight="600" style={styles.stepTitle}>
                {s.title}
              </AppText>
              <AppText variant="caption" color="muted" style={styles.stepText}>
                {s.text}
              </AppText>
            </View>
            <AppText style={[styles.stepNumber, { color: mix(theme.muted, theme.surface, 0.45) }]}>0{i + 1}</AppText>
          </View>
        ))}
      </View>
    </View>
  );
}

/** Chồng thẻ minh hoạ (`deckScene` của web, thu 75% ở khổ điện thoại). */
function Deck({ word }: { word?: Word }) {
  const theme = useTheme();
  const edge = mix(theme.primary, theme.border, 0.15);
  return (
    <View style={styles.deckScene} pointerEvents="none">
      <View style={styles.deckInner}>
        <View style={[styles.orbit, { borderColor: alpha(theme.primary, 0.19) }]} />
        <View
          style={[
            styles.card,
            { borderColor: edge, backgroundColor: mix(theme.primary, theme.surface, 0.13) },
            { transform: [{ translateX: 25 }, { translateY: 8 }, { rotate: '13deg' }] },
          ]}
        />
        <View
          style={[
            styles.card,
            { borderColor: edge, backgroundColor: mix(theme.accent, theme.surface, 0.09) },
            { transform: [{ translateX: -24 }, { translateY: 4 }, { rotate: '-12deg' }] },
          ]}
        />
        <View
          style={[
            styles.card,
            styles.front,
            {
              borderColor: edge,
              backgroundImage: `linear-gradient(135deg, ${theme.surface} 68%, ${theme.heroFrom})`,
              boxShadow: `0 18px 34px ${alpha(theme.text, 0.1)}`,
              transform: [{ rotate: '-3deg' }],
            },
          ]}>
          <View style={styles.deckLabel}>
            <AppText color="muted" style={styles.deckLabelText}>
              THẺ GHI NHỚ
            </AppText>
            <Icon name="cards" size={17} color="muted" />
          </View>
          <View style={styles.deckCharacter}>
            <Hanzi size={49} numberOfLines={1} adjustsFontSizeToFit>
              {word?.simplified ?? '学'}
            </Hanzi>
          </View>
          <AppText color="primary" style={styles.deckPinyin}>
            {word?.pinyin ?? 'xué'}
          </AppText>
          <View style={[styles.divider, { backgroundColor: alpha(theme.primary, 0.35) }]} />
          <View style={styles.deckHint}>
            <Icon name="refresh" size={13} color="muted" />
            <AppText color="muted" style={styles.deckHintText}>
              Lật thẻ để khám phá
            </AppText>
          </View>
        </View>
        <View
          style={[
            styles.badge,
            {
              borderColor: mix(theme.good, theme.border, 0.17),
              backgroundColor: theme.surface,
              boxShadow: `0 7px 14px ${alpha(theme.text, 0.05)}`,
            },
          ]}>
          <Icon name="spark" size={16} color="good" />
          <AppText variant="caption" color="good">
            Từng từ, từng bước
          </AppText>
        </View>
        <View style={styles.spark}>
          <Icon name="spark" size={25} color="accent" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    overflow: 'hidden',
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 24,
    paddingTop: 26,
    paddingBottom: 18,
  },
  eyebrow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  eyebrowText: { fontSize: 12, lineHeight: 16, letterSpacing: 1 },
  title: { marginTop: 14, maxWidth: 260, fontSize: 32, lineHeight: 37, letterSpacing: -1.4 },
  description: { marginTop: 16, fontSize: 13, lineHeight: 23 },
  stats: { marginTop: 18, marginBottom: 22, flexDirection: 'row', flexWrap: 'wrap', gap: 15 },
  statValue: { fontSize: 19, lineHeight: 24 },
  newFrom: { marginBottom: 10 },
  start: { minHeight: 48 },
  note: { marginTop: 15 },
  underline: { textDecorationLine: 'underline' },
  deckScene: { height: 230, marginTop: -12, marginBottom: -24, alignItems: 'center', justifyContent: 'center' },
  deckInner: {
    width: 300,
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ scale: 0.75 }],
  },
  orbit: {
    position: 'absolute',
    width: 295,
    height: 295,
    borderRadius: 148,
    borderWidth: 1,
    borderStyle: 'dashed',
    transform: [{ rotate: '-20deg' }],
  },
  card: { position: 'absolute', width: 210, height: 258, borderRadius: 22, borderWidth: 1 },
  front: { alignItems: 'center', padding: 20 },
  deckLabel: { alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  deckLabelText: { fontSize: 8, lineHeight: 12, letterSpacing: 1.3 },
  deckCharacter: { flex: 1, justifyContent: 'center', maxWidth: '100%' },
  deckPinyin: { fontSize: 16, lineHeight: 22 },
  divider: { width: 28, height: 2, borderRadius: 2, marginTop: 17, marginBottom: 12 },
  deckHint: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  deckHintText: { fontSize: 11, lineHeight: 14 },
  badge: {
    position: 'absolute',
    bottom: 10,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderWidth: 1,
    borderRadius: 13,
    paddingHorizontal: 15,
    paddingVertical: 11,
    transform: [{ rotate: '-5deg' }],
  },
  spark: { position: 'absolute', left: 12, top: 7, transform: [{ rotate: '-12deg' }] },
  guideHeading: { marginTop: 24, marginBottom: 13, marginHorizontal: 2, gap: 8 },
  guideTitle: { fontSize: 15, lineHeight: 22, letterSpacing: -0.3 },
  steps: { gap: 10 },
  step: { flexDirection: 'row', gap: 12, borderWidth: 1, borderRadius: 18, padding: 16 },
  stepIcon: { width: 37, height: 37, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1, minWidth: 0 },
  stepTitle: { paddingRight: 25, fontSize: 13, lineHeight: 18 },
  stepText: { marginTop: 4, lineHeight: 21 },
  stepNumber: { position: 'absolute', right: 16, top: 12, fontSize: 20, lineHeight: 24, fontWeight: '500', letterSpacing: -1.6 },
});
