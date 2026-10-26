import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';

import { AppText, AudioButton, Hanzi, Icon } from '@/components/ui';
import { alpha } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { speakChinese } from '@/lib/audio';
import { hskLabel, POS_VI } from '@/lib/hsk';
import type { Word } from '@/lib/types';

import { senses, WordSection } from './word-header';

/** Câu ví dụ có từ đang tra tô đỏ đậm. */
function Highlight({ text, word }: { text: string; word: string }) {
  const theme = useTheme();
  const form = word.replace(/[（(][^）)]*[）)]/g, '');
  if (!form || !text.includes(form)) return <>{text}</>;
  const parts = text.split(form);
  return (
    <>
      {parts.map((p, i) => (
        <Text key={i}>
          {p}
          {i < parts.length - 1 && <Text style={{ color: theme.primary, fontWeight: '600' }}>{form}</Text>}
        </Text>
      ))}
    </>
  );
}

/** Nút nghe cả câu ví dụ (`SpeakButton` của web): tròn 32px nền đỏ nhạt. */
function SpeakButton({ text }: { text: string }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={() => speakChinese(text)}
      accessibilityLabel="Nghe câu ví dụ"
      style={({ pressed }) => [
        styles.speak,
        { backgroundColor: pressed ? theme.primary : alpha(theme.primary, 0.08) },
      ]}>
      {({ pressed }) => <Icon name="sound" size={16} color={pressed ? 'primaryText' : 'primary'} />}
    </Pressable>
  );
}

/**
 * Mục "Nghĩa" (trang từ của web): từ loại chữ nhỏ đỏ, nghĩa đánh số từng nét, câu ví dụ trong khung xám có nút nghe,
 * dòng "Tiếng Anh". Từ có nhiều cách đọc thì liệt kê lần lượt.
 */
export function MeaningSection({ words, onLayout }: { words: Word[]; onLayout?: (e: LayoutChangeEvent) => void }) {
  const theme = useTheme();
  return (
    <WordSection icon="book" title="Nghĩa" onLayout={onLayout}>
      <View style={styles.list}>
        {words.map((w, wi) => {
          const list = senses(w.meaningVi ?? w.meaningEn ?? '');
          return (
            <View key={w.id} style={wi > 0 && [styles.other, { borderColor: theme.border }]}>
              {wi > 0 && (
                <View style={styles.otherHead}>
                  <AppText weight="600">Cách đọc khác:</AppText>
                  <AppText>{w.pinyin}</AppText>
                  {w.hanViet && (
                    <AppText weight="700" color="hanviet">
                      {w.hanViet.toUpperCase()}
                    </AppText>
                  )}
                  <View style={[styles.badge, { backgroundColor: theme.surface2 }]}>
                    <AppText variant="caption" color="muted">
                      {hskLabel(w.hskLevel)}
                    </AppText>
                  </View>
                  <AudioButton src={w.audioUrl} size={15} />
                </View>
              )}
              {w.pos.length > 0 && (
                <AppText variant="caption" weight="700" color="primary" style={styles.pos}>
                  {w.pos.map((p) => (POS_VI[p] ?? p).toUpperCase()).join(' · ')}
                </AppText>
              )}
              <View style={styles.senses}>
                {list.map((m, i) => (
                  <View key={m} style={styles.sense}>
                    {list.length > 1 && (
                      <AppText weight="600" color="muted" style={styles.no}>
                        {i + 1}.
                      </AppText>
                    )}
                    <AppText weight="500" style={styles.senseText}>
                      {m}
                    </AppText>
                  </View>
                ))}
                {list.length === 0 && <AppText color="muted">Đang cập nhật</AppText>}
              </View>
              {(w.examples ?? []).map((ex) => (
                <View key={ex.id} style={[styles.example, { backgroundColor: alpha(theme.surface2, 0.6) }]}>
                  <SpeakButton text={ex.zh} />
                  <View style={styles.flex}>
                    <Hanzi size={18} style={styles.exampleZh}>
                      <Highlight text={ex.zh} word={w.simplified} />
                    </Hanzi>
                    {ex.pinyin && (
                      <AppText variant="caption" color="muted">
                        {ex.pinyin}
                      </AppText>
                    )}
                    {(ex.vi || ex.en) && <AppText style={styles.exampleVi}>{ex.vi ?? ex.en}</AppText>}
                  </View>
                </View>
              ))}
              {w.meaningEn && (
                <AppText variant="caption" color="muted" style={styles.en}>
                  Tiếng Anh: {w.meaningEn}
                </AppText>
              )}
            </View>
          );
        })}
      </View>
    </WordSection>
  );
}

const styles = StyleSheet.create({
  list: { gap: 20 },
  other: { borderTopWidth: 1, paddingTop: 16 },
  otherHead: { marginBottom: 8, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  badge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  pos: { marginBottom: 6, letterSpacing: 0.6 },
  senses: { gap: 4 },
  sense: { flexDirection: 'row', gap: 8 },
  no: { width: 20, textAlign: 'right', fontSize: 15 },
  senseText: { flex: 1, fontSize: 15, lineHeight: 22 },
  example: { marginTop: 12, flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderRadius: 12, padding: 14 },
  speak: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1, minWidth: 0 },
  exampleZh: { lineHeight: 32 },
  exampleVi: { marginTop: 2 },
  en: { marginTop: 12 },
});
