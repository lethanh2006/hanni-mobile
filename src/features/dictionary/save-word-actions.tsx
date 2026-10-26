import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, Icon } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { addPendingWord } from '@/lib/guest-progress';
import { addWordToSrs, suspendWord } from '@/lib/hooks';

type State = 'idle' | 'saving' | 'saved' | 'hiding' | 'hidden' | 'error';

/**
 * Nút "Lưu để ôn tập" + "Tôi đã biết từ này" (`SaveWordButton` của web): NỐI tra cứu vào việc học. Khách bấm lưu thì
 * từ được giữ lại, tạo tài khoản xong tự vào hàng đợi.
 */
export function SaveWordActions({ wordId, simplified }: { wordId: string; simplified: string }) {
  const { user } = useAuth();
  const [state, setState] = useState<State>('idle');

  if (!user) {
    return (
      <Button
        title="Lưu để ôn tập"
        leftIcon="cards"
        onPress={() => {
          addPendingWord(wordId);
          router.push('/register');
        }}
        style={styles.self}
      />
    );
  }
  if (state === 'saved' || state === 'hidden') {
    return (
      <View style={styles.done}>
        <Icon name="check" size={16} color="good" />
        <AppText weight="500" color="good">
          {state === 'saved' ? 'Đã thêm vào danh sách ôn tập' : 'Đã ẩn khỏi lượt ôn — bỏ ẩn được ở trang Tiến độ'}
        </AppText>
      </View>
    );
  }

  function run(action: Promise<unknown>, busy: State, done: State) {
    setState(busy);
    action.then(() => setState(done)).catch(() => setState('error'));
  }

  return (
    <View style={styles.row}>
      <Button
        title={state === 'saving' ? 'Đang lưu…' : 'Lưu để ôn tập'}
        leftIcon="cards"
        disabled={state === 'saving'}
        onPress={() => run(addWordToSrs(wordId), 'saving', 'saved')}
      />
      {/* Tra từ điển là lúc hay gặp từ mình đã biết sẵn (nhờ âm Hán Việt) — cho ẩn ngay tại đây. */}
      <Button
        title={state === 'hiding' ? 'Đang ẩn…' : 'Tôi đã biết từ này'}
        variant="ghost"
        leftIcon="check"
        disabled={state === 'hiding'}
        onPress={() => run(suspendWord(wordId, true), 'hiding', 'hidden')}
      />
      {state === 'error' && <AppText color="muted">Chưa lưu được {simplified}. Thử lại sau nhé.</AppText>}
    </View>
  );
}

const styles = StyleSheet.create({
  self: { alignSelf: 'flex-start' },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12 },
  done: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
