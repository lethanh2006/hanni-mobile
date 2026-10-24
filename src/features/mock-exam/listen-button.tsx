import { useEffect, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { AppText, Icon } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { MockItem } from '@/lib/types';

import { playListening, stopListening } from './listening';

/** Nút nghe 1 câu: đọc 2 lần như đề thật, bấm lại để nghe lại. */
export function ListenButton({ audio }: { audio: NonNullable<MockItem['audio']> }) {
  const theme = useTheme();
  const [round, setRound] = useState(0);
  const [played, setPlayed] = useState(false);
  const playing = round > 0;

  // Rời câu (cuộn mất, thoát đề) thì dừng, khỏi đọc chồng lên câu khác.
  useEffect(() => () => stopListening(), []);

  async function play() {
    if (playing) {
      stopListening();
      setRound(0);
      return;
    }
    await playListening(audio, setRound);
    setRound(0);
    setPlayed(true);
  }

  return (
    <Pressable
      onPress={play}
      accessibilityRole="button"
      accessibilityLabel="Nghe câu này"
      style={[styles.button, { backgroundColor: playing ? theme.primary : theme.primarySoft }]}>
      <Icon name="sound" size={16} color={playing ? 'primaryText' : 'primary'} />
      <AppText variant="small" bold color={playing ? 'primaryText' : 'primary'}>
        {playing ? `Đang phát · lần ${round}/2` : played ? 'Nghe lại' : 'Nghe'}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.sm,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
});
