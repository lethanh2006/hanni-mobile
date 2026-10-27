import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Button, Card, ErrorNote, Hanzi, Icon, Screen, SectionHeading } from '@/components/ui';
import { alpha } from '@/constants/theme';
import { PracticeLibrary, PracticeTips } from '@/features/practice/practice-library';
import { usePracticeWords } from '@/features/practice/practice-words';
import { useWordAudio } from '@/features/practice/use-word-audio';
import { saveRecording } from '@/features/tone/save-recording';
import { ToneAnalysis } from '@/features/tone/tone-check';
import { RecorderError, useVoiceRecorder, type VoiceRecording } from '@/features/tone/voice-recorder';
import { useTheme } from '@/hooks/use-theme';
import { playRecording, stopAudio } from '@/lib/audio';
import { useAuth } from '@/lib/auth';
import { recordPracticeAttempt, usePracticeStats } from '@/lib/hooks';
import type { Word } from '@/lib/types';

/** Ghi tối đa 45 giây mỗi lần (như web). */
const LIMIT_SECONDS = 45;

/**
 * Luyện phát âm (`/pronunciation` của web): chọn bài đang học / cấp HSK, rồi phòng luyện từng từ — nghe mẫu, ghi âm,
 * nghe lại, Hanni chấm thanh điệu bằng đường cao độ (chạy trên máy). Khách luyện được, chỉ không lưu lượt luyện.
 */
export default function PronunciationScreen() {
  const { user } = useAuth();
  const { lesson } = useLocalSearchParams<{ lesson?: string }>();
  const { words, loading, error, retry, scope } = usePracticeWords(lesson);

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Luyện phát âm' }} />
      <PracticeLibrary
        icon="mic"
        tone="primary"
        title="Luyện phát âm"
        description="Nghe mẫu, đọc to — Hanni vẽ đường giọng bạn chồng lên giọng chuẩn để chấm thanh điệu."
        startLabel="Bắt đầu luyện phát âm"
        guideTitle="Nghe mẫu. Cất tiếng. Tự tin hơn."
        guideNote="Chuẩn bị micro và một góc yên tĩnh để nghe rõ giọng mình."
        steps={[
          'Nhấn "Nghe phát âm mẫu" để nghe cách đọc chuẩn của từ.',
          'Nhấn "Bắt đầu ghi âm", đọc theo rồi nhấn dừng khi xong.',
          'Nghe lại giọng của bạn, so sánh với mẫu rồi chuyển từ tiếp theo.',
        ]}
        words={words}
        loading={loading}
        error={error}
        scope={scope}
        onRetry={retry}>
        {(list) => <PronunciationSession key={list.map((w) => w.id).join()} words={list} loggedIn={Boolean(user)} />}
      </PracticeLibrary>
    </Screen>
  );
}

function PronunciationSession({ words, loggedIn }: { words: Word[]; loggedIn: boolean }) {
  const theme = useTheme();
  const [index, setIndex] = useState(0);
  const stats = usePracticeStats('PRONUNCIATION');
  const word = words[index];

  return (
    <View style={styles.session}>
      <Card style={styles.card}>
        <SectionHeading
          icon="mic"
          eyebrow="Nghe · Đọc · So sánh"
          title="Phòng luyện phát âm"
          right={
            <View style={[styles.counter, { backgroundColor: alpha(theme.primary, 0.08) }]}>
              <AppText variant="caption" weight="600" color="primary">
                {index + 1} / {words.length}
              </AppText>
            </View>
          }
        />
        <PronunciationWord
          key={word.id}
          word={word}
          onRecorded={() => {
            // Khách luyện thử — không có tài khoản để lưu lượt luyện.
            if (loggedIn) void recordPracticeAttempt(word.id, 'PRONUNCIATION').then(() => stats.mutate());
          }}
        />
      </Card>
      <View style={styles.nav}>
        <Button title="Từ trước" leftIcon="back" variant="secondary" disabled={index === 0} onPress={() => setIndex(index - 1)} />
        <Button title="Từ tiếp theo" icon="arrow" disabled={index === words.length - 1} onPress={() => setIndex(index + 1)} />
      </View>

      <PracticeTips
        title="Một chút tập trung, nhiều tiến bộ"
        tips={[
          'Chọn nơi yên tĩnh và nghe kỹ bản mẫu trước khi ghi âm.',
          'Đọc chậm, rõ âm đầu và giữ đúng cao độ của từng thanh.',
          'Nghe lại giọng của bạn, so sánh với mẫu rồi thử thêm lần nữa.',
        ]}>
        <Card style={styles.card}>
          <SectionHeading icon="sound" title="Lắng nghe chính mình" tone="good" />
          {/* Web còn dùng nhận diện giọng nói của trình duyệt để xem đọc đúng từ chưa — app chưa có. */}
          <AppText color="muted" style={styles.line24}>
            So sánh bản thu với âm mẫu để tự điều chỉnh. Ứng dụng chưa hỗ trợ nhận diện giọng nói nên chưa chấm điểm phát âm
            tự động được.
          </AppText>
          <View style={[styles.cheer, { backgroundColor: alpha(theme.primary, 0.05) }]}>
            <AppText variant="caption" color="primary" style={styles.cheerText}>
              Mỗi lần luyện là một cơ hội nói tự nhiên hơn.
            </AppText>
          </View>
        </Card>
        {stats.data && stats.data.totalAttempts > 0 && (
          <Card style={styles.card}>
            <SectionHeading icon="chart" eyebrow="Từ trước đến nay" title="Luyện phát âm" tone="lavender" />
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <AppText weight="600" style={styles.statValue}>
                  {stats.data.totalAttempts.toLocaleString('vi-VN')}
                </AppText>
                <AppText variant="caption" color="muted">
                  lượt ghi âm
                </AppText>
              </View>
              <View style={styles.stat}>
                <AppText weight="600" color="primary" style={styles.statValue}>
                  {stats.data.accuracyPct ?? '—'}
                  {stats.data.accuracyPct !== null && '%'}
                </AppText>
                <AppText variant="caption" color="muted">
                  nhận diện đúng
                </AppText>
              </View>
            </View>
            <AppText variant="caption" color="muted" style={styles.statNote}>
              {stats.data.distinctWordsCount.toLocaleString('vi-VN')} từ khác nhau đã được luyện.
            </AppText>
          </Card>
        )}
      </PracticeTips>
    </View>
  );
}

function PronunciationWord({ word, onRecorded }: { word: Word; onRecorded: () => void }) {
  const theme = useTheme();
  const model = useWordAudio(word.simplified, word.audioUrl);
  const recorder = useVoiceRecorder();
  const [phase, setPhase] = useState<'idle' | 'requesting' | 'recording'>('idle');
  const [seconds, setSeconds] = useState(0);
  const [recording, setRecording] = useState<VoiceRecording | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef(recorder);
  const limitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    recorderRef.current = recorder;
  });
  useEffect(
    () => () => {
      if (limitTimer.current) clearTimeout(limitTimer.current);
      recorderRef.current.cancel();
    },
    [],
  );

  useEffect(() => {
    if (phase !== 'recording') return;
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [phase]);

  async function stopRecording() {
    if (limitTimer.current) clearTimeout(limitTimer.current);
    limitTimer.current = null;
    setPhase('idle');
    const voice = await recorder.stop();
    if (!voice) {
      setError('Chưa thu được âm thanh. Kiểm tra micro và thử ghi lại.');
      return;
    }
    setRecording(voice);
    onRecorded();
  }

  async function startRecording() {
    model.stop();
    stopAudio();
    setError(null);
    setPhase('requesting');
    try {
      await recorder.start(() => undefined);
    } catch (err) {
      setPhase('idle');
      setError(err instanceof RecorderError ? err.message : 'Không kết nối được micro. Kiểm tra thiết bị ghi âm và thử lại.');
      return;
    }
    setSeconds(0);
    setPhase('recording');
    // Hết 45 giây thì tự dừng.
    limitTimer.current = setTimeout(() => void stopRecording(), LIMIT_SECONDS * 1000);
  }

  return (
    <View style={styles.word}>
      <View style={[styles.stage, { borderColor: theme.border, backgroundColor: alpha(theme.surface2, 0.6) }]}>
        <View style={[styles.level, { backgroundColor: theme.surface }]}>
          <AppText variant="caption" weight="600" color="muted">
            HSK {word.hskLevel}
          </AppText>
        </View>
        <Hanzi size={60} style={styles.hanzi}>
          {word.simplified}
        </Hanzi>
        <AppText weight="500" color="primary" style={styles.pinyin}>
          {word.pinyin}
        </AppText>
        <AppText color="muted" center style={styles.meaning}>
          {word.meaningVi ?? word.meaningEn ?? 'Nghĩa của từ đang được cập nhật.'}
        </AppText>
        <Button
          title={model.playing ? 'Nghe lại từ đầu' : 'Nghe phát âm mẫu'}
          leftIcon="sound"
          variant="secondary"
          disabled={phase !== 'idle'}
          onPress={() => model.play(0.85)}
          style={styles.listen}
        />
        <AppText variant="caption" color="muted" style={styles.source}>
          {model.synthetic ? 'Giọng đọc tiếng Trung của thiết bị' : 'Bản thu phát âm từ thư viện'}
        </AppText>
      </View>

      <View style={[styles.box, { borderColor: theme.border }]}>
        <View style={styles.boxHead}>
          <AppText weight="600">Bản ghi âm của bạn</AppText>
          <AppText variant="caption" color={phase === 'recording' ? 'primary' : 'muted'}>
            {phase === 'recording'
              ? `Đang ghi · 00:${String(seconds).padStart(2, '0')}`
              : phase === 'requesting'
                ? 'Đang chờ quyền micro…'
                : 'Tối đa 45 giây'}
          </AppText>
        </View>
        {recording && phase === 'idle' ? (
          <View style={styles.recorded}>
            {recording.uri && (
              <View style={styles.recordedActions}>
                <Pressable
                  onPress={() => {
                    model.stop();
                    playRecording(recording.uri!);
                  }}
                  style={[styles.play, { backgroundColor: theme.surface2 }]}>
                  <Icon name="play" size={16} color="primary" />
                  <AppText weight="600">Nghe lại bản ghi của bạn</AppText>
                </Pressable>
                <AppText
                  variant="caption"
                  weight="500"
                  color="primary"
                  style={styles.download}
                  onPress={() => void saveRecording(recording.uri!, `hanni-phat-am-${word.id}.wav`)}>
                  Tải bản ghi về máy
                </AppText>
              </View>
            )}
            <ToneAnalysis
              voice={recording}
              hanzi={word.simplified}
              pinyin={word.pinyin}
              pinyinNumeric={word.pinyinNumeric}
              audioUrl={word.audioUrl}
            />
          </View>
        ) : (
          <AppText color="muted" style={styles.boxText}>
            {phase === 'recording'
              ? 'Hãy đọc từ phía trên. Nhấn dừng khi bạn đã đọc xong.'
              : 'Nhấn bắt đầu và cho phép sử dụng micro để luyện nói.'}
          </AppText>
        )}
        <Pressable
          onPress={() => (phase === 'recording' ? void stopRecording() : void startRecording())}
          disabled={phase === 'requesting'}
          style={({ pressed }) => [
            styles.record,
            phase === 'recording'
              ? { backgroundColor: alpha(theme.danger, pressed ? 0.2 : 0.1), borderColor: alpha(theme.danger, 0.3) }
              : {
                  backgroundColor: theme.primary,
                  borderColor: theme.primary,
                  boxShadow: pressed ? undefined : `0 3px 0 rgba(0,0,0,0.25)`,
                },
            phase === 'requesting' && styles.faded,
          ]}>
          <View
            style={[
              styles.dot,
              phase === 'recording' ? styles.square : styles.round,
              { backgroundColor: phase === 'recording' ? theme.danger : theme.primaryText },
            ]}
          />
          <AppText weight="700" color={phase === 'recording' ? 'danger' : 'primaryText'}>
            {phase === 'recording'
              ? 'Dừng ghi âm'
              : phase === 'requesting'
                ? 'Đang kết nối micro…'
                : recording
                  ? 'Ghi âm lại'
                  : 'Bắt đầu ghi âm'}
          </AppText>
        </Pressable>
      </View>
      {error && <ErrorNote>{error}</ErrorNote>}
      <View style={styles.privacy}>
        <Icon name="lock" size={14} color="muted" />
        <AppText variant="caption" color="muted" style={styles.privacyText}>
          Bản ghi chỉ có trên máy này, không được gửi lên máy chủ. Tải về nếu muốn giữ lại trước khi chuyển từ.
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  session: { gap: 20 },
  card: { gap: 20 },
  counter: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  nav: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  line24: { lineHeight: 24 },
  cheer: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12 },
  cheerText: { lineHeight: 20 },
  statsRow: { flexDirection: 'row', gap: 12 },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 24, lineHeight: 32 },
  statNote: { lineHeight: 20 },
  word: { gap: 20 },
  stage: { alignItems: 'center', borderWidth: 1, borderRadius: 16, paddingHorizontal: 20, paddingVertical: 40 },
  level: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 },
  hanzi: { marginTop: 24, lineHeight: 75 },
  pinyin: { marginTop: 16, fontSize: 20, lineHeight: 28 },
  meaning: { marginTop: 8, lineHeight: 24, maxWidth: 512 },
  listen: { marginTop: 24 },
  source: { marginTop: 12 },
  box: { borderWidth: 1, borderRadius: 16, padding: 20 },
  boxHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  boxText: { marginTop: 16, lineHeight: 24 },
  recorded: { marginTop: 16, gap: 12 },
  recordedActions: { gap: 4 },
  play: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, paddingHorizontal: 14 },
  download: { minHeight: 36, textAlignVertical: 'center', paddingVertical: 10 },
  record: {
    marginTop: 20,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
  },
  faded: { opacity: 0.5 },
  dot: { width: 10, height: 10 },
  round: { borderRadius: 5 },
  square: { borderRadius: 2 },
  privacy: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  privacyText: { flex: 1, lineHeight: 20 },
});
