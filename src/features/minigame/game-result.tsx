import { StyleSheet } from 'react-native';

import { AppText, Button, Card, ErrorNote, Loading } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import type { MinigameResult } from '@/lib/types';

/** Điểm cuối ván + nút chơi lại. `result = null` khi đang chờ server chấm. */
export function GameResult({
  result,
  error,
  unit,
  onReplay,
  isGuest,
}: {
  result: MinigameResult | null;
  error: string | null;
  unit: string;
  onReplay: () => void;
  isGuest: boolean;
}) {
  return (
    <Card style={styles.center}>
      {error ? (
        <ErrorNote>{error}</ErrorNote>
      ) : !result ? (
        <Loading label="Đang chấm điểm…" />
      ) : (
        <>
          <AppText variant="label" color="primary">
            Hết ván
          </AppText>
          <AppText style={styles.score}>{result.score}</AppText>
          <AppText color="muted">
            điểm · {result.totalAsked} {unit}
          </AppText>
          {isGuest && (
            <AppText variant="small" color="muted" center>
              Tạo tài khoản để có tên trên bảng xếp hạng trò chơi.
            </AppText>
          )}
        </>
      )}
      <Button title="Chơi lại" icon="refresh" onPress={onReplay} style={styles.button} />
    </Card>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center' },
  score: { fontSize: 56, lineHeight: 66, fontWeight: '800' },
  button: { alignSelf: 'stretch', marginTop: Spacing.sm },
});
