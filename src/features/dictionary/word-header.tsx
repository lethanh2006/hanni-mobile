import { StyleSheet, View } from 'react-native';

import { AppText, AudioButton, Card } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
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

function Tag({ label, tone = 'muted' }: { label: string; tone?: 'muted' | 'primary' | 'good' }) {
  const theme = useTheme();
  const background = tone === 'primary' ? theme.primarySoft : tone === 'good' ? theme.goodSoft : theme.surface2;
  return (
    <View style={[styles.tag, { backgroundColor: background }]}>
      <AppText variant="caption" bold color={tone === 'muted' ? 'muted' : tone}>
        {label}
      </AppText>
    </View>
  );
}

/** Đầu mục từ: chữ (+ phồn thể), pinyin + ÂM HÁN VIỆT, nghe, cấp HSK, từ loại, chủ đề, lưu để ôn. */
export function WordHeader({ word, topic }: { word: Word; topic: Topic | null }) {
  return (
    <Card>
      <View style={styles.row}>
        <View style={styles.flex}>
          <AppText style={styles.hanzi} color="primary">
            {word.simplified}
            {word.traditional && word.traditional !== word.simplified ? (
              <AppText variant="heading" color="muted">
                {' '}【{word.traditional}】
              </AppText>
            ) : null}
          </AppText>
          <AppText variant="heading">
            [{word.pinyin}]
            {word.hanViet ? (
              <AppText variant="heading" color="hanviet">
                {'  '}[{word.hanViet.toUpperCase()}]
              </AppText>
            ) : null}
          </AppText>
        </View>
        <AudioButton src={word.audioUrl} big />
      </View>
      <View style={styles.tags}>
        <Tag label={hskLabel(word.hskLevel)} tone="primary" />
        {word.pos.map((p) => (
          <Tag key={p} label={POS_VI[p] ?? p} />
        ))}
        {topic && <Tag label={topic.title.replace(/\s*\(\d+\/\d+\)$/, '')} />}
        {familiar(word) && <Tag label="Trùng nghĩa tiếng Việt — bạn đã biết sẵn" tone="good" />}
      </View>
      <SaveWordActions wordId={word.id} simplified={word.simplified} />
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  flex: { flex: 1 },
  hanzi: { fontSize: 48, lineHeight: 60 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { borderRadius: Radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
});
