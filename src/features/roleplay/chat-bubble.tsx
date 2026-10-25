import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Icon } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { speakChinese } from '@/lib/audio';
import type { RoleplayMessage } from '@/lib/types';

/** 1 tin nhắn: của mình nằm phải (nền đỏ nhạt), của AI nằm trái kèm pinyin + nút nghe. */
export function ChatBubble({ message }: { message: RoleplayMessage }) {
  const theme = useTheme();
  const mine = message.role === 'USER';
  return (
    <View style={[styles.row, mine && styles.mine]}>
      <View
        style={[
          styles.bubble,
          mine ? { backgroundColor: theme.primarySoft } : { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 },
        ]}>
        <AppText variant="heading">{message.text}</AppText>
        {message.pinyin && (
          <AppText variant="caption" color="muted">
            {message.pinyin}
          </AppText>
        )}
        {!mine && (
          <Pressable onPress={() => speakChinese(message.text)} hitSlop={8} style={styles.listen} accessibilityLabel="Nghe">
            <Icon name="sound" size={16} color="primary" />
            <AppText variant="caption" color="primary">
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
  bubble: { maxWidth: '85%', borderRadius: Radius.lg, padding: Spacing.md, gap: 4 },
  listen: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
});
