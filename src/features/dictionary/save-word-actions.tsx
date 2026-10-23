import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Button } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { addPendingWord } from '@/lib/guest-progress';
import { addWordToSrs, suspendWord } from '@/lib/hooks';

type State = 'idle' | 'saving' | 'saved' | 'hiding' | 'hidden' | 'error';

/**
 * NỐI tra cứu vào việc học: tra xong đưa thẳng từ vào hàng đợi ôn, hoặc đánh dấu "đã biết"
 * (người Việt hay gặp từ biết sẵn nhờ âm Hán Việt). Khách bấm lưu thì từ được giữ lại, tạo
 * tài khoản xong tự vào hàng đợi.
 */
export function SaveWordActions({ wordId, simplified }: { wordId: string; simplified: string }) {
  const { user } = useAuth();
  const [state, setState] = useState<State>('idle');

  if (!user) {
    return (
      <Button
        title="Tạo tài khoản để lưu từ này"
        variant="secondary"
        icon="plus"
        onPress={() => {
          addPendingWord(wordId);
          router.push('/register');
        }}
      />
    );
  }
  if (state === 'saved' || state === 'hidden') {
    return (
      <AppText variant="small" bold color="good">
        {state === 'saved'
          ? '✓ Đã thêm vào danh sách ôn tập'
          : '✓ Đã ẩn khỏi lượt ôn — bỏ ẩn được ở trang Tiến độ'}
      </AppText>
    );
  }

  function run(action: Promise<unknown>, busy: State, done: State) {
    setState(busy);
    action.then(() => setState(done)).catch(() => setState('error'));
  }

  return (
    <View style={styles.wrap}>
      <Button
        title={state === 'saving' ? 'Đang lưu…' : 'Lưu để ôn tập'}
        icon="cards"
        loading={state === 'saving'}
        onPress={() => run(addWordToSrs(wordId), 'saving', 'saved')}
      />
      <Button
        title={state === 'hiding' ? 'Đang ẩn…' : 'Tôi đã biết từ này'}
        variant="ghost"
        loading={state === 'hiding'}
        onPress={() => run(suspendWord(wordId, true), 'hiding', 'hidden')}
      />
      {state === 'error' && (
        <AppText variant="small" color="danger">
          Chưa lưu được {simplified}. Thử lại sau nhé.
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.xs },
});
