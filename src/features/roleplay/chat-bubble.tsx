import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Icon } from '@/components/ui';
import { alpha } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { speakChinese } from '@/lib/audio';
import type { RoleplayMessage } from '@/lib/types';

/** 1 tin nhắn (bong bóng của web): của mình nằm phải nền đỏ chữ trắng, của AI nằm trái nền xám kèm pinyin + "Nghe". */
export function ChatBubble({ message }: { message: RoleplayMessage }) {
  const theme = useTheme();
  const mine = message.role === 'USER';
  return (
    <View style={[styles.row, mine && styles.mine]}>
      <View style={[styles.bubble, { backgroundColor: mine ? theme.primary : theme.surface2 }]}>
        <AppText color={mine ? 'primaryText' : 'text'} style={styles.text}>
          {message.text}
        </AppText>
        {message.pinyin && (
          <AppText variant="caption" style={{ color: mine ? alpha(theme.primaryText, 0.75) : theme.muted }}>
            {message.pinyin}
          </AppText>
        )}
        {!mine && (
          <Pressable onPress={() => speakChinese(message.text)} hitSlop={6} style={styles.listen} accessibilityLabel="Nghe">
            <Icon name="sound" size={13} color="muted" />
            <AppText variant="caption" weight="500" color="muted">
              Nghe
            </AppText>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  mine: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '78%', gap: 4, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  text: { lineHeight: 24 },
  listen: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingTop: 2, alignSelf: 'flex-start' },
});
