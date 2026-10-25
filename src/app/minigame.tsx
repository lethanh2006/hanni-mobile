import { Stack } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { mutate } from 'swr';

import { AppText, Button, Card, ErrorNote, Icon, Screen } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { GameLeaderboard } from '@/features/minigame/game-leaderboard';
import { GAMES, type GameDef } from '@/features/minigame/games';
import { MatchGame } from '@/features/minigame/match-game';
import { SoloGame } from '@/features/minigame/solo-game';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { MinigameStartResponse } from '@/lib/types';

/** Trò chơi luyện từ: chọn trò → xem luật → chơi → điểm + bảng điểm. Khách chơi được. */
export default function MinigameScreen() {
  const theme = useTheme();
  const { user } = useAuth();
  const [game, setGame] = useState<GameDef | null>(null);
  const [session, setSession] = useState<MinigameStartResponse | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start(def: GameDef) {
    setStarting(true);
    setError(null);
    try {
      setSession(await api.post<MinigameStartResponse>('/minigame/start', { mode: def.mode }));
    } catch {
      setError('Chưa bắt đầu được, thử lại nhé.');
    } finally {
      setStarting(false);
    }
  }

  const refreshBoard = () => void mutate((key) => typeof key === 'string' && key.startsWith('/minigame/leaderboard'));

  if (!game) {
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Trò chơi luyện từ' }} />
        {GAMES.map((g) => (
          <Card key={g.mode} onPress={() => setGame(g)}>
            <View style={styles.row}>
              <View style={[styles.icon, { backgroundColor: theme.primarySoft }]}>
                <Icon name={g.icon} size={22} color="primary" />
              </View>
              <View style={styles.flex}>
                <AppText bold>{g.title}</AppText>
                <AppText variant="small" color="muted">
                  {g.tagline}
                </AppText>
              </View>
              <Icon name="chevron" size={16} color="muted" />
            </View>
          </Card>
        ))}
      </Screen>
    );
  }

  const replay = () => void start(game);
  return (
    <Screen>
      <Stack.Screen options={{ title: game.title }} />
      {session?.mode === game.mode ? (
        session.cards ? (
          <MatchGame
            key={session.sessionId}
            sessionId={session.sessionId}
            cards={session.cards}
            isGuest={!user}
            onReplay={replay}
            onFinished={refreshBoard}
          />
        ) : (
          <SoloGame
            key={session.sessionId}
            mode={game.mode}
            sessionId={session.sessionId}
            questions={session.questions ?? []}
            isGuest={!user}
            onReplay={replay}
            onFinished={refreshBoard}
          />
        )
      ) : (
        <Card>
          <AppText variant="heading">{game.title}</AppText>
          <AppText color="muted">{game.tagline}</AppText>
          {game.rules.map((r) => (
            <AppText key={r} variant="small">
              • {r}
            </AppText>
          ))}
          {error && <ErrorNote>{error}</ErrorNote>}
          <Button title="Bắt đầu chơi" icon="play" loading={starting} onPress={replay} />
        </Card>
      )}
      <Button
        title="Chọn trò khác"
        variant="ghost"
        onPress={() => {
          setGame(null);
          setSession(null);
        }}
      />
      <GameLeaderboard mode={game.mode} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  flex: { flex: 1, gap: 2 },
  icon: { width: 44, height: 44, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
});
