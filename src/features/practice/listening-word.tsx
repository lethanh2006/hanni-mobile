import * as Speech from 'expo-speech';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Button, Icon, TextField, TextLink } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { playWord, speakChinese } from '@/lib/audio';
import type { Word } from '@/lib/types';

import { checkPinyin, type ListenVerdict } from './pinyin-answer';
import { firstMeaning } from './practice-words';

const normalize = (s: string) => s.normalize('NFKC').replace(/[\s。！？.!?,，、]/g, '');

const VERDICT_TEXT: Record<ListenVerdict, string> = {
  right: 'Chính xác, bạn nghe rất tốt!',
  tones: 'Đúng âm rồi — chỉ thiếu hoặc lệch thanh điệu, nghe lại để ý giọng lên xuống nhé',
  wrong: 'Cùng nghe lại và ghi nhớ từ này',
};

/**
 * 1 từ luyện nghe: nghe (thường / chậm) → gõ lại bằng pinyin hoặc chữ Hán → chấm.
 * Gợi ý không đưa pinyin (lộ đáp án) mà đưa số âm tiết + nghĩa.
 */
export function ListeningWord({
  word,
  saved,
  onCheck,
}: {
  word: Word;
  saved?: { value: string; verdict: ListenVerdict };
  onCheck: (value: string, verdict: ListenVerdict) => void;
}) {
  const theme = useTheme();
  const [value, setValue] = useState(saved?.value ?? '');
  const [played, setPlayed] = useState(false);
  const [hint, setHint] = useState(false);
  const checked = saved !== undefined;

  function play(slow: boolean) {
    setPlayed(true);
    if (slow) Speech.speak(word.simplified, { language: 'zh-CN', rate: 0.6 });
    else if (word.audioUrl) playWord(word.audioUrl);
    else speakChinese(word.simplified);
  }

  function check() {
    // Có chữ Hán thì so mặt chữ; không thì chấm như pinyin (người chưa cài bàn phím tiếng Trung).
    if (/\p{Script=Han}/u.test(value)) {
      const answer = normalize(value);
      const same = answer === normalize(word.simplified) || (!!word.traditional && answer === normalize(word.traditional));
      onCheck(value, same ? 'right' : 'wrong');
    } else {
      onCheck(value, checkPinyin(value, word.simplified, word.pinyinNumeric, word.pinyin));
    }
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.players}>
        <Pressable onPress={() => play(false)} style={[styles.play, { backgroundColor: theme.primary }]} accessibilityLabel="Nghe">
          <Icon name="sound" size={32} color="primaryText" />
        </Pressable>
        <Pressable
          onPress={() => play(true)}
          style={[styles.slow, { borderColor: theme.border }]}
          accessibilityLabel="Nghe chậm">
          <AppText variant="small" bold>
            Nghe chậm
          </AppText>
        </Pressable>
      </View>

      <TextLink title={hint ? 'Ẩn gợi ý' : 'Xem gợi ý'} color="muted" onPress={() => setHint(!hint)} />
      {hint && (
        <AppText variant="small" color="muted">
          {word.pinyinNumeric.trim().split(/\s+/).length} âm tiết · nghĩa: {firstMeaning(word)}
        </AppText>
      )}

      <TextField
        label="Gõ pinyin hoặc chữ Hán bạn nghe được"
        value={value}
        onChangeText={setValue}
        editable={!checked}
        placeholder="Vd: ni3hao3 · nǐ hǎo · 你好"
        autoCapitalize="none"
        autoCorrect={false}
        onSubmitEditing={() => played && value.trim() && !checked && check()}
      />
      {!checked && (
        <>
          {!played && (
            <AppText variant="caption" color="muted">
              Nhấn nghe trước khi kiểm tra đáp án.
            </AppText>
          )}
          <Button title="Kiểm tra đáp án" icon="check" disabled={!played || !value.trim()} onPress={check} />
        </>
      )}

      {saved && (
        <View
          style={[
            styles.result,
            { backgroundColor: saved.verdict === 'right' ? theme.goodSoft : theme.surface2 },
          ]}>
          <AppText bold color={saved.verdict === 'right' ? 'good' : 'text'}>
            {VERDICT_TEXT[saved.verdict]}
          </AppText>
          <AppText variant="title">{word.simplified}</AppText>
          <AppText color="primary">{word.pinyin}</AppText>
          <AppText variant="small">{word.meaningVi ?? word.meaningEn}</AppText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.md },
  players: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.lg },
  play: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  slow: { borderWidth: 1, borderRadius: Radius.pill, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
  result: { borderRadius: Radius.lg, padding: Spacing.lg, gap: 4, alignItems: 'center' },
});
