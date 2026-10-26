import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppText, Button, Hanzi, Icon } from '@/components/ui';
import { alpha, Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Word } from '@/lib/types';

import { checkPinyin, type ListenVerdict } from './pinyin-answer';
import { firstMeaning } from './practice-words';
import { useWordAudio } from './use-word-audio';

const normalize = (s: string) => s.normalize('NFKC').replace(/[\s。！？.!?,，、]/g, '');

const VERDICT_TEXT: Record<ListenVerdict, string> = {
  right: 'Chính xác, bạn nghe rất tốt!',
  tones: 'Đúng âm rồi — chỉ thiếu hoặc lệch thanh điệu, nghe lại để ý giọng lên xuống nhé',
  wrong: 'Cùng nghe lại và ghi nhớ từ này',
};

const BARS = [12, 23, 16, 32, 24, 38, 17, 27, 36, 18, 29, 13, 24];
const SPEEDS = [0.75, 1, 1.25];

/**
 * 1 từ luyện nghe (`ListeningWord` của web): khung tối có sóng âm + nút phát tròn, chọn tốc độ, gợi ý (số âm tiết +
 * nghĩa — không đưa pinyin vì lộ đáp án), gõ lại bằng pinyin hoặc chữ Hán rồi chấm.
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
  const [rate, setRate] = useState(1);
  const [hint, setHint] = useState(false);
  const [focused, setFocused] = useState(false);
  const audio = useWordAudio(word.simplified, word.audioUrl);
  const checked = saved !== undefined;

  function check() {
    if (!value.trim() || checked || !audio.hasPlayed) return;
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
      <View style={styles.player}>
        <View style={styles.bars} accessibilityElementsHidden>
          {BARS.map((h, i) => (
            <View
              key={i}
              style={[styles.bar, { height: h, backgroundColor: audio.playing ? '#ff8679' : 'rgba(255,255,255,0.25)' }]}
            />
          ))}
        </View>
        <Pressable
          onPress={() => (audio.playing ? audio.stop() : audio.play(rate))}
          accessibilityLabel={audio.playing ? 'Dừng âm thanh' : 'Nghe từ cần luyện'}
          style={({ pressed }) => [
            styles.play,
            { backgroundColor: theme.primary, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' },
            pressed && { transform: [{ scale: 1.05 }] },
          ]}>
          <Icon name={audio.playing ? 'close' : 'play'} size={27} color="primaryText" />
        </Pressable>
        <AppText weight="500" style={styles.playText}>
          {audio.playing ? 'Đang phát âm thanh…' : 'Nhấn để nghe từ vựng'}
        </AppText>
        <AppText variant="caption" style={styles.source}>
          {audio.synthetic ? 'Giọng đọc tiếng Trung của thiết bị' : 'Bản thu phát âm từ thư viện'}
        </AppText>
      </View>

      <View style={styles.controls}>
        <View style={styles.speeds} accessibilityLabel="Tốc độ phát">
          <AppText variant="caption" color="muted" style={styles.speedLabel}>
            Tốc độ
          </AppText>
          {SPEEDS.map((speed) => (
            <Pressable
              key={speed}
              onPress={() => {
                audio.stop();
                setRate(speed);
              }}
              accessibilityState={{ selected: rate === speed }}
              style={[styles.speed, { backgroundColor: rate === speed ? alpha(theme.primary, 0.1) : theme.surface2 }]}>
              <AppText variant="caption" weight="500" color={rate === speed ? 'primary' : 'muted'}>
                {speed}×
              </AppText>
            </Pressable>
          ))}
        </View>
        <Pressable onPress={() => setHint(!hint)} accessibilityState={{ expanded: hint }} style={styles.hintToggle}>
          <AppText variant="caption" weight="500" color="muted">
            {hint ? 'Ẩn gợi ý' : 'Xem gợi ý'}
          </AppText>
        </Pressable>
      </View>
      {hint && (
        <View style={[styles.hint, { backgroundColor: alpha(theme.primary, 0.05) }]}>
          <AppText weight="500" color="primary" center>
            {word.pinyinNumeric.trim().split(/\s+/).length} âm tiết · nghĩa: {firstMeaning(word)}
          </AppText>
        </View>
      )}

      <View style={styles.form}>
        <AppText weight="600">Gõ pinyin hoặc chữ Hán bạn nghe được</AppText>
        <TextInput
          value={value}
          onChangeText={setValue}
          editable={!checked}
          placeholder="Vd: ni3hao3 · nǐ hǎo · 你好"
          placeholderTextColor={theme.muted}
          autoCapitalize="none"
          autoCorrect={false}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onSubmitEditing={check}
          style={[
            styles.input,
            {
              color: theme.text,
              borderColor: focused ? theme.primary : alpha(theme.border, 0.8),
              backgroundColor: theme.surface,
              boxShadow: focused ? `0 0 0 4px ${alpha(theme.primary, 0.1)}` : undefined,
            },
            checked && styles.disabled,
          ]}
        />
        {!audio.hasPlayed && !checked && (
          <AppText variant="caption" color="muted">
            Nhấn nghe trước khi kiểm tra đáp án.
          </AppText>
        )}
        {!checked && (
          <Button
            title="Kiểm tra đáp án"
            leftIcon="check"
            disabled={!value.trim() || !audio.hasPlayed}
            onPress={check}
            style={styles.checkButton}
          />
        )}
      </View>

      {saved && (
        <View
          style={[
            styles.result,
            saved.verdict === 'right'
              ? { borderColor: alpha(theme.good, 0.2), backgroundColor: alpha(theme.good, 0.05) }
              : { borderColor: alpha(theme.primary, 0.2), backgroundColor: alpha(theme.primary, 0.05) },
          ]}>
          <View style={styles.verdict}>
            <Icon name={saved.verdict === 'right' ? 'check' : 'info'} size={18} color={saved.verdict === 'right' ? 'good' : 'primary'} />
            <AppText weight="600" color={saved.verdict === 'right' ? 'good' : 'primary'} style={styles.flex}>
              {VERDICT_TEXT[saved.verdict]}
            </AppText>
          </View>
          <Hanzi size={30} style={styles.answer}>
            {word.simplified}
          </Hanzi>
          <AppText color="primary" style={styles.answerLine}>
            {word.pinyin}
          </AppText>
          <AppText color="muted" style={styles.answerLine}>
            {word.meaningVi ?? word.meaningEn ?? 'Nghĩa của từ đang được cập nhật.'}
          </AppText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 24 },
  flex: { flex: 1, minWidth: 0 },
  player: { overflow: 'hidden', alignItems: 'center', borderRadius: 16, padding: 24, backgroundColor: '#161d2c' },
  bars: { height: 40, marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 6 },
  bar: { width: 4, borderRadius: 999 },
  play: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  playText: { marginTop: 16, color: '#ffffff' },
  source: { marginTop: 8, color: 'rgba(255,255,255,0.55)' },
  controls: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  speeds: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  speedLabel: { marginRight: 4 },
  speed: { minHeight: 36, justifyContent: 'center', borderRadius: 8, paddingHorizontal: 12 },
  hintToggle: { minHeight: 36, justifyContent: 'center' },
  hint: { marginTop: -8, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12 },
  form: { gap: 16 },
  input: { minHeight: 46, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, fontFamily: Fonts.sans, fontSize: 14 },
  disabled: { opacity: 0.6 },
  checkButton: { alignSelf: 'flex-start' },
  result: { borderWidth: 1, borderRadius: 12, padding: 20 },
  verdict: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  answer: { marginTop: 16 },
  answerLine: { marginTop: 8 },
});
