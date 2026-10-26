import { Stack } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Button, Card, Icon, NextStep, PageHeader, Screen, TourButton, type TourStep } from '@/components/ui';
import { alpha } from '@/constants/theme';
import { GAMES, type GameDef } from '@/features/minigame/games';
import { MatchGame } from '@/features/minigame/match-game';
import { SoloGame } from '@/features/minigame/solo-game';
import { useTheme } from '@/hooks/use-theme';

const TOUR: TourStep[] = [
  {
    icon: 'spark',
    title: 'Bốn trò chơi một mình',
    description:
      'Dịch tốc độ, Nghe đoán từ, Ghép cặp và Chọn pinyin đúng — mỗi ván 60 giây. Bấm vào một trò sẽ xem luật trước rồi mới bắt đầu.',
  },
  {
    icon: 'trophy',
    title: 'Bảng xếp hạng ngày, tuần',
    description: 'Mỗi trò có bảng xếp hạng riêng theo điểm — chơi lại để vượt điểm cao nhất của chính mình.',
  },
];

type Stage = { stage: 'hub' } | { stage: 'intro'; game: GameDef } | { stage: 'play'; game: GameDef };

/** Ô biểu tượng của trò (`icon-tile` pha màu nhóm). */
function GameTile({ game, size, iconSize }: { game: GameDef; size: number; iconSize: number }) {
  const theme = useTheme();
  const color = theme[game.tone];
  return (
    <View
      style={[
        styles.tile,
        {
          width: size,
          height: size,
          borderColor: theme.border,
          backgroundColor: alpha(color, game.tone === 'lavender' ? 0.12 : 0.1),
          boxShadow: `0 1px 2px ${alpha(theme.text, 0.05)}`,
        },
      ]}>
      <Icon name={game.icon} size={iconSize} rawColor={color} />
    </View>
  );
}

/** Trò chơi luyện từ (`/minigame` của web): sảnh chọn trò → xem luật → chơi + bảng xếp hạng. Khách chơi được. */
export default function MinigameScreen() {
  const [view, setView] = useState<Stage>({ stage: 'hub' });

  return (
    <Screen contentStyle={styles.page}>
      <Stack.Screen options={{ title: 'Trò chơi luyện từ' }} />
      <PageHeader
        icon="spark"
        tone="accent"
        title="Trò chơi luyện từ"
        description="Ôn từ vựng bằng trò chơi — mỗi ván 60 giây."
        right={<TourButton steps={TOUR} />}
      />

      {view.stage === 'hub' && (
        <>
          <View style={styles.hub}>
            {GAMES.map((g) => (
              <Card key={g.mode} onPress={() => setView({ stage: 'intro', game: g })} style={styles.gameCard}>
                <GameTile game={g} size={44} iconSize={22} />
                <AppText weight="700" style={styles.gameTitle}>
                  {g.title}
                </AppText>
                <AppText variant="caption" color="muted" style={styles.tagline}>
                  {g.tagline}
                </AppText>
                <View style={styles.cta}>
                  <AppText variant="caption" weight="700" color="primary">
                    Xem luật & chơi
                  </AppText>
                  <Icon name="arrow" size={15} color="primary" />
                </View>
              </Card>
            ))}
          </View>
          {/* Minigame chỉ luyện phản xạ trên vốn từ ĐÃ có — bước tiếp theo tự nhiên là mở rộng vốn từ đó ra. */}
          <NextStep
            title="Chơi để phản xạ nhanh hơn — nhưng vốn từ mới là gốc"
            description="Trò chơi luyện tốc độ trên những từ bạn đã gặp. Học thêm từ mới rồi quay lại sẽ thấy khác hẳn."
            actions={[
              { href: '/study', label: 'Ôn tập flashcard', icon: 'cards' },
              { href: '/', label: 'Lộ trình HSK', icon: 'route' },
            ]}
          />
        </>
      )}

      {view.stage === 'intro' && (
        <Card style={styles.intro}>
          <GameTile game={view.game} size={44} iconSize={26} />
          <AppText weight="700" center style={styles.introTitle}>
            {view.game.title}
          </AppText>
          <AppText color="muted" center style={styles.introText}>
            {view.game.tagline}
          </AppText>
          <View style={styles.rules}>
            {view.game.rules.map((r) => (
              <View key={r} style={styles.rule}>
                <Icon name="check" size={16} color="good" />
                <AppText color="muted" style={styles.ruleText}>
                  {r}
                </AppText>
              </View>
            ))}
          </View>
          <View style={styles.introActions}>
            <Button title="Quay lại" leftIcon="back" variant="ghost" onPress={() => setView({ stage: 'hub' })} />
            <Button title="Bắt đầu chơi" onPress={() => setView({ stage: 'play', game: view.game })} />
          </View>
        </Card>
      )}

      {view.stage === 'play' && (
        <View style={styles.play}>
          <Pressable onPress={() => setView({ stage: 'hub' })} style={styles.back} hitSlop={6}>
            <Icon name="back" size={15} color="muted" />
            <AppText weight="500" color="muted">
              Chọn minigame khác
            </AppText>
          </Pressable>
          <View>{view.game.mode === 'MATCH' ? <MatchGame /> : <SoloGame key={view.game.mode} game={view.game} />}</View>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { gap: 24 },
  hub: { gap: 18 },
  tile: { borderWidth: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  gameCard: { gap: 0, padding: 24, alignItems: 'flex-start' },
  gameTitle: { marginTop: 16, fontSize: 16, lineHeight: 24 },
  tagline: { marginTop: 8, lineHeight: 20 },
  cta: { marginTop: 20, flexDirection: 'row', alignItems: 'center', gap: 6 },
  intro: { gap: 0, paddingVertical: 32, alignItems: 'center' },
  introTitle: { marginTop: 16, fontSize: 20, lineHeight: 28 },
  introText: { marginTop: 8, lineHeight: 24 },
  rules: { marginTop: 24, alignSelf: 'stretch', gap: 10 },
  rule: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  ruleText: { flex: 1, lineHeight: 20 },
  introActions: { marginTop: 28, flexDirection: 'row', justifyContent: 'center', gap: 12 },
  play: { gap: 24 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
});
