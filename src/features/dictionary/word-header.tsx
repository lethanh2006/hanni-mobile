import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import { AppText, Card, Hanzi, Icon, type IconName } from '@/components/ui';
import { alpha, mix } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { playWord } from '@/lib/audio';
import { hskLabel, POS_VI } from '@/lib/hsk';
import type { Word } from '@/lib/types';

import { SaveWordActions } from './save-word-actions';
import type { Topic } from './types';

/** Tách nghĩa thành từng nét theo dấu ";" ngoài ngoặc ("đánh; gọi (điện); chơi (bóng)"). */
export function senses(meaning: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = '';
  for (const ch of meaning) {
    if (ch === '(' || ch === '（') depth += 1;
    if (ch === ')' || ch === '）') depth = Math.max(0, depth - 1);
    if (ch === ';' && depth === 0) {
      out.push(cur.trim());
      cur = '';
    } else cur += ch;
  }
  out.push(cur.trim());
  return out.filter(Boolean);
}

/** Âm Hán Việt trùng luôn một nét nghĩa tiếng Việt (时间 = thời gian) — người Việt đã biết sẵn. */
function familiar(w: Word) {
  if (!w.hanViet || !w.meaningVi) return false;
  const hv = w.hanViet.toLowerCase().trim();
  return senses(w.meaningVi).some((m) => m.replace(/\([^)]*\)/g, '').toLowerCase().trim() === hv);
}

/**
 * 1 mục của trang từ (`Section` ở trang từ của web): thẻ `.panel`, tiêu đề đậm có ô biểu tượng đỏ nhạt 28px,
 * `aside` (link nhỏ) bên phải. `onLayout` để mục lục cuộn tới đúng mục.
 */
export function WordSection({
  icon,
  title,
  aside,
  onLayout,
  children,
}: {
  icon: IconName;
  title: ReactNode;
  aside?: ReactNode;
  onLayout?: (e: LayoutChangeEvent) => void;
  children: ReactNode;
}) {
  const theme = useTheme();
  return (
    <View onLayout={onLayout}>
      <Card style={styles.section}>
        <View style={styles.sectionHead}>
          <View style={styles.sectionTitle}>
            <View style={[styles.sectionIcon, { backgroundColor: alpha(theme.primary, 0.1) }]}>
              <Icon name={icon} size={15} color="primary" />
            </View>
            {typeof title === 'string' ? (
              <AppText weight="700" style={styles.sectionText}>
                {title}
              </AppText>
            ) : (
              title
            )}
          </View>
          {aside}
        </View>
        {children}
      </Card>
    </View>
  );
}

function Tag({ label, icon, tone = 'muted', onPress }: { label: string; icon?: IconName; tone?: 'muted' | 'primary' | 'good'; onPress?: () => void }) {
  const theme = useTheme();
  const bg = tone === 'primary' ? alpha(theme.primary, 0.1) : tone === 'good' ? alpha(theme.good, 0.12) : theme.surface2;
  const color = tone === 'primary' ? 'primary' : tone === 'good' ? 'good' : 'muted';
  return (
    <Pressable disabled={!onPress} onPress={onPress} style={[styles.tag, { backgroundColor: bg }]}>
      {icon && <Icon name={icon} size={13} color={color} />}
      <AppText variant="caption" weight="600" color={color}>
        {label}
      </AppText>
    </Pressable>
  );
}

/**
 * Đầu mục từ (khối đầu trang từ của web): chữ Hán đỏ rất to + phồn thể【】, [pinyin] [ÂM HÁN VIỆT], nút nghe tròn đỏ
 * nổi khối; nhãn cấp, từ loại, chủ đề, "Trùng nghĩa tiếng Việt"; nút Lưu để ôn tập / Tôi đã biết từ này.
 */
export function WordHeader({ word, topic }: { word: Word; topic: Topic | null }) {
  const theme = useTheme();
  return (
    <Card style={styles.header}>
      <View style={styles.top}>
        <View style={styles.flex}>
          <View style={styles.hanziRow}>
            <Hanzi size={48} color="primary" style={styles.hanzi}>
              {word.simplified}
            </Hanzi>
            {word.traditional && word.traditional !== word.simplified && (
              <Hanzi size={24} color="muted">
                【{word.traditional}】
              </Hanzi>
            )}
          </View>
          <View style={styles.readings}>
            <AppText style={[styles.reading, { color: alpha(theme.text, 0.9) }]}>[{word.pinyin}]</AppText>
            {word.hanViet && (
              <AppText weight="700" color="hanviet" style={[styles.reading, styles.hanViet]}>
                [{word.hanViet.toUpperCase()}]
              </AppText>
            )}
          </View>
        </View>
        {word.audioUrl && (
          <Pressable
            onPress={() => playWord(word.audioUrl)}
            accessibilityLabel="Nghe phát âm"
            style={({ pressed }) => [
              styles.listen,
              {
                backgroundColor: theme.primary,
                boxShadow: pressed ? undefined : `0 3px 0 ${mix(theme.primary, '#000000', 0.62)}`,
                transform: pressed ? [{ translateY: 2 }] : undefined,
              },
            ]}>
            <Icon name="sound" size={22} color="primaryText" />
          </Pressable>
        )}
      </View>
      <View style={styles.tags}>
        <Tag label={hskLabel(word.hskLevel)} tone="primary" />
        {word.pos.map((p) => (
          <Tag key={p} label={POS_VI[p] ?? p} />
        ))}
        {topic && (
          <Tag
            label={topic.title.replace(/\s*\(\d+\/\d+\)$/, '')}
            icon="route"
            onPress={() => router.push(`/learn/${topic.id}`)}
          />
        )}
        {familiar(word) && <Tag label="Trùng nghĩa tiếng Việt — bạn đã biết sẵn" icon="heart" tone="good" />}
      </View>
      <View style={styles.save}>
        <SaveWordActions wordId={word.id} simplified={word.simplified} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  section: { gap: 0 },
  sectionHead: { marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  sectionTitle: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionIcon: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  sectionText: { flex: 1, fontSize: 16, lineHeight: 24 },
  header: { gap: 0 },
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
  flex: { flex: 1, minWidth: 0 },
  hanziRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', columnGap: 8 },
  hanzi: { lineHeight: 60 },
  readings: { marginTop: 8, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 12, rowGap: 4 },
  reading: { fontSize: 18, lineHeight: 28 },
  hanViet: { letterSpacing: 0.45 },
  listen: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  tags: { marginTop: 16, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 },
  save: { marginTop: 16 },
});
