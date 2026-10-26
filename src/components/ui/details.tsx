import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card } from './card';
import { Icon } from './icon';
import { AppText } from './text';

/**
 * Khối hỏi–đáp mở/đóng (`<details class="panel p-5">` của web): câu hỏi đậm + mũi tên xoay khi mở,
 * câu trả lời chữ xám giãn dòng.
 */
export function Details({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <Card style={styles.card}>
      <Pressable
        onPress={() => setOpen(!open)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        style={styles.summary}>
        <AppText weight="700" color={open ? 'primary' : 'text'} style={styles.title}>
          {title}
        </AppText>
        <View style={{ transform: [{ rotate: open ? '-90deg' : '90deg' }] }}>
          <Icon name="chevron" size={16} color={open ? 'primary' : 'text'} />
        </View>
      </Pressable>
      {open &&
        (typeof children === 'string' ? (
          <AppText color="muted" style={styles.body}>
            {children}
          </AppText>
        ) : (
          <View style={styles.bodyBox}>{children}</View>
        ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 0 },
  summary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  title: { flex: 1 },
  body: { marginTop: 12, lineHeight: 28 },
  bodyBox: { marginTop: 12 },
});
