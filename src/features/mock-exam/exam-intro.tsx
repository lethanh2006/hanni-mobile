import * as Speech from 'expo-speech';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Button, Icon } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import type { MockPaper } from '@/lib/types';

import { ExamBackBar } from './exam-chrome';
import { SECTION_VI } from './labels';
import { playListening } from './listening';
import type { SavedExam } from './saved-exam';

/** Máy có giọng đọc tiếng Trung không (phần nghe đọc bằng giọng máy). */
async function hasChineseVoice() {
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    return voices.length === 0 || voices.some((v) => v.language.toLowerCase().startsWith('zh'));
  } catch {
    return true;
  }
}

/**
 * Màn giới thiệu đề (`Intro` của phòng thi web): nhãn "Đề thi thử · đúng cấu trúc đề thật", 4 ô số liệu, cấu trúc
 * từng phần, kiểm tra âm thanh, nút bắt đầu / làm tiếp bài dở.
 */
export function ExamIntro({
  paper,
  saved,
  onStart,
  isGuest,
}: {
  paper: MockPaper;
  saved: SavedExam | null;
  onStart: (resume: SavedExam | null) => void;
  isGuest: boolean;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [voice, setVoice] = useState<'unknown' | 'checking' | 'ok' | 'missing'>('unknown');
  const savedCount = saved?.answers.filter((a) => a !== null).length ?? 0;

  async function testAudio() {
    setVoice('checking');
    if (!(await hasChineseVoice())) {
      setVoice('missing');
      return;
    }
    setVoice('ok');
    await playListening({ lines: [{ s: 'F', zh: '你好，欢迎参加汉语水平考试。' }] }, () => undefined);
  }

  return (
    <View style={[styles.fill, { backgroundColor: theme.background }]}>
      <ExamBackBar />
      <ScrollView contentContainerStyle={[styles.main, { paddingBottom: insets.bottom + 32 }]}>
        <View style={[styles.card, { borderColor: theme.border, backgroundColor: theme.surface }]}>
          <AppText variant="caption" weight="700" color="primary" style={styles.eyebrow}>
            ĐỀ THI THỬ · ĐÚNG CẤU TRÚC ĐỀ THẬT
          </AppText>
          <AppText weight="800" style={styles.title}>
            {paper.title}
          </AppText>
          <View style={styles.stats}>
            {[
              [
                { k: 'Số câu', v: `${paper.questionCount} câu` },
                { k: 'Thời gian', v: `${paper.durationMin} phút` },
              ],
              [
                { k: 'Tổng điểm', v: `${paper.maxScore}` },
                { k: 'Điểm đạt', v: `${paper.passScore}` },
              ],
            ].map((row) => (
              <View key={row[0].k} style={styles.statRow}>
                {row.map((s) => (
                  <View key={s.k} style={[styles.stat, { backgroundColor: theme.surface2 }]}>
                    <AppText variant="caption" color="muted">
                      {s.k}
                    </AppText>
                    <AppText weight="700" style={styles.statValue}>
                      {s.v}
                    </AppText>
                  </View>
                ))}
              </View>
            ))}
          </View>
          <View style={styles.list}>
            {paper.sections.map((s) => (
              <View key={s.kind} style={styles.listRow}>
                <Icon name={SECTION_VI[s.kind].icon} size={18} color="primary" />
                <AppText style={styles.listText}>
                  <AppText weight="700">
                    {SECTION_VI[s.kind].vi} ({SECTION_VI[s.kind].zh})
                  </AppText>{' '}
                  — {s.parts.filter((p) => !p.continues).length} phần, {s.parts.reduce((n, p) => n + p.items.length, 0)}{' '}
                  câu, tối đa 100 điểm.
                </AppText>
              </View>
            ))}
            <View style={styles.listRow}>
              <Icon name="sound" size={18} color="primary" />
              <AppText style={styles.listText}>
                Phần nghe: bấm <AppText weight="700">Nghe</AppText> ở từng câu, mỗi câu đọc 2 lần như đề thật (giọng đọc
                tiếng Trung của máy; từ đơn dùng bản ghi âm thật).
              </AppText>
            </View>
            <View style={styles.listRow}>
              <Icon name="flag" size={18} color="primary" />
              <AppText style={styles.listText}>
                Làm câu nào trước cũng được, đánh dấu câu cần xem lại. Hết giờ hệ thống tự nộp bài.
              </AppText>
            </View>
          </View>

          <View style={[styles.audio, { borderColor: theme.border }]}>
            <Button
              title="Kiểm tra âm thanh"
              leftIcon="sound"
              variant="secondary"
              disabled={voice === 'checking'}
              onPress={() => void testAudio()}
              style={styles.audioButton}
            />
            <AppText variant="caption" color="muted">
              {voice === 'ok'
                ? 'Nghe rõ là ổn. Nên dùng tai nghe như phòng thi thật.'
                : voice === 'missing'
                  ? 'Máy chưa có giọng đọc tiếng Trung — cài thêm giọng tiếng Trung trong cài đặt chuyển văn bản thành giọng nói của máy.'
                  : 'Bật loa/tai nghe rồi bấm thử trước khi vào thi.'}
            </AppText>
          </View>

          {isGuest && (
            <AppText variant="caption" color="muted" style={styles.guest}>
              Bạn chưa đăng nhập — vẫn làm và xem điểm, chữa bài bình thường.{' '}
              <AppText
                variant="caption"
                weight="600"
                color="primary"
                onPress={() => router.push({ pathname: '/login', params: { next: `/thi-thu-hsk/${paper.slug}` } })}>
                Đăng nhập
              </AppText>{' '}
              để lưu điểm và theo dõi tiến bộ.
            </AppText>
          )}

          <View style={styles.actions}>
            {saved ? (
              <>
                <Button
                  title={`Làm tiếp bài đang dở (${savedCount}/${paper.questionCount} câu)`}
                  icon="arrow"
                  onPress={() => onStart(saved)}
                />
                <Button title="Làm lại từ đầu" variant="ghost" onPress={() => onStart(null)} />
              </>
            ) : (
              <Button title="Bắt đầu làm bài" icon="arrow" onPress={() => onStart(null)} />
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  main: { paddingHorizontal: 16, paddingTop: 32 },
  card: { borderWidth: 1, borderRadius: 16, padding: 24 },
  eyebrow: { letterSpacing: 0.6 },
  title: { marginTop: 6, fontSize: 24, lineHeight: 32, letterSpacing: -0.6 },
  stats: { marginTop: 20, gap: 12 },
  statRow: { flexDirection: 'row', gap: 12 },
  stat: { flex: 1, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 12 },
  statValue: { marginTop: 2, fontSize: 18, lineHeight: 28 },
  list: { marginTop: 20, gap: 8 },
  listRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  listText: { flex: 1, lineHeight: 24 },
  audio: { marginTop: 20, gap: 8, borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12 },
  audioButton: { alignSelf: 'flex-start', minHeight: 36, paddingHorizontal: 12, paddingVertical: 6 },
  guest: { marginTop: 16, lineHeight: 20 },
  actions: { marginTop: 24, gap: 8 },
});
