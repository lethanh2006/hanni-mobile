import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Card, Icon, SectionTitle } from '@/components/ui';
import { Radius, Spacing, ToneColors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { playWord } from '@/lib/audio';
import { TONE_RULE_TEXT } from '@/lib/tone-rules';
import type { PinyinOverview } from '@/lib/types';

import { firstSound, TONES, type PinyinItem } from './pinyin-data';

/** 4 thanh điệu: cách đọc, so với dấu tiếng Việt, bấm nghe mā má mǎ mà. */
export function ToneSection({ data }: { data: PinyinOverview | null }) {
  const theme = useTheme();
  const ma = data?.syllables.find((s) => s.base === 'ma');
  return (
    <Card>
      <SectionTitle title="4 thanh điệu" />
      {TONES.map((t) => {
        const sound = ma?.tones[t.t];
        return (
          <Pressable
            key={t.t}
            disabled={!sound}
            onPress={() => sound && playWord(sound.url)}
            style={[styles.row, { borderColor: theme.border }]}>
            <AppText variant="title" style={{ color: ToneColors[t.t] }}>
              {sound?.mark ?? t.t}
            </AppText>
            <View style={styles.flex}>
              <AppText bold style={{ color: ToneColors[t.t] }}>
                {t.name}
              </AppText>
              <AppText variant="small">{t.desc}</AppText>
              <AppText variant="caption" color="muted">
                {t.vi}
              </AppText>
            </View>
            {sound && <Icon name="sound" size={18} color="primary" />}
          </Pressable>
        );
      })}
      <AppText variant="caption" color="muted">
        Thanh nhẹ: đọc ngắn, nhẹ, không dấu (như 吗 ma, 的 de).
      </AppText>
    </Card>
  );
}

/** Mẹo riêng cho người Việt: đoán thanh từ dấu của âm Hán Việt, kèm tỉ lệ đúng đo thật. */
export function ToneRuleSection({ data }: { data: PinyinOverview | null }) {
  const theme = useTheme();
  if (!data?.toneRules.length) return null;
  return (
    <Card>
      <SectionTitle title="Đoán thanh từ âm Hán Việt" />
      {data.toneRules.map((r) => (
        <View key={r.key} style={[styles.rule, { borderColor: theme.border }]}>
          <AppText variant="small" bold>
            {TONE_RULE_TEXT[r.key] ?? r.key}
          </AppText>
          {r.total > 0 && (
            <AppText variant="caption" color="muted">
              Đúng {Math.round((r.follows / r.total) * 100)}% trên {r.total.toLocaleString('vi-VN')} chữ HSK 1–4
            </AppText>
          )}
          <View style={styles.examples}>
            {r.examples.map((e) => (
              <Pressable
                key={e.char}
                disabled={!e.url}
                onPress={() => e.url && playWord(e.url)}
                style={[styles.example, { backgroundColor: theme.surface2 }]}>
                <AppText variant="small">
                  {e.char}{' '}
                  <AppText variant="small" bold color="hanviet">
                    {e.hanViet}
                  </AppText>{' '}
                  → {e.mark}
                </AppText>
              </Pressable>
            ))}
          </View>
        </View>
      ))}
    </Card>
  );
}

/** Nhóm thanh mẫu / vận mẫu: mỗi âm kèm cách đọc "gần âm Việt nào", bấm để nghe âm tiết ví dụ. */
export function SoundGroupSection({
  title,
  groups,
  data,
}: {
  title: string;
  groups: { name: string; note?: string; items: PinyinItem[] }[];
  data: PinyinOverview | null;
}) {
  const theme = useTheme();
  return (
    <Card>
      <SectionTitle title={title} />
      {groups.map((g) => (
        <View key={g.name} style={styles.group}>
          <AppText variant="small" bold color="muted">
            {g.name}
            {g.note ? ` — ${g.note}` : ''}
          </AppText>
          {g.items.map((item) => {
            const sound = firstSound(data, item.ex);
            return (
              <Pressable
                key={item.l}
                disabled={!sound}
                onPress={() => sound && playWord(sound.url)}
                style={[styles.sound, { borderColor: theme.border }]}>
                <AppText variant="heading" color="primary" style={styles.letter}>
                  {item.l}
                </AppText>
                <AppText variant="small" style={styles.flex}>
                  {item.tip}
                </AppText>
                {sound && (
                  <AppText variant="caption" color="muted">
                    {sound.char} {sound.mark}
                  </AppText>
                )}
              </Pressable>
            );
          })}
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, borderTopWidth: 1, paddingVertical: Spacing.sm },
  flex: { flex: 1, gap: 2 },
  rule: { borderTopWidth: 1, paddingTop: Spacing.sm, gap: 4 },
  examples: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  example: { borderRadius: Radius.md, paddingHorizontal: 8, paddingVertical: 4 },
  group: { gap: 4, marginTop: Spacing.sm },
  sound: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, borderTopWidth: 1, paddingVertical: Spacing.sm },
  letter: { width: 48 },
});
