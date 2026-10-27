import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { AppText, Button, ErrorNote, Hanzi, Icon } from '@/components/ui';
import { alpha, Fonts, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';

const MAX = 120;

interface SentenceCheckResult {
  score: number;
  usesWord: boolean;
  corrected: string;
  pinyin: string;
  translationVi: string;
  explanationVi: string;
  tipVi: string | null;
  sentence: string;
  cached: boolean;
}

function verdict(score: number): { label: string; color: ThemeColor } {
  if (score >= 90) return { label: 'Câu đúng và tự nhiên', color: 'good' };
  if (score >= 60) return { label: 'Gần đúng — còn lỗi nhỏ', color: 'accent' };
  return { label: 'Cần sửa', color: 'danger' };
}

/**
 * "Đặt câu với từ này" (`SentencePractice` của web): tự viết 1 câu, AI chấm — điểm, câu đã sửa giữ ý, nghĩa, nhận xét
 * tiếng Việt. (Web có thêm nút micro nói câu bằng nhận dạng giọng nói của trình duyệt — app chưa có.)
 */
export function SentencePractice({ word }: { word: { id: string; simplified: string; meaningVi: string | null } }) {
  const theme = useTheme();
  const { user, loading } = useAuth();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<SentenceCheckResult | null>(null);

  async function submit() {
    const s = text.trim();
    if (!s || busy) return;
    if (!/\p{Script=Han}/u.test(s)) {
      setError('Viết câu bằng chữ Hán nhé (bật bộ gõ tiếng Trung).');
      return;
    }
    setBusy(true);
    setError('');
    try {
      setResult(await api.post<SentenceCheckResult>('/ai/sentence-check', { wordId: word.id, sentence: s }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Chưa chấm được câu này, thử lại nhé.');
    } finally {
      setBusy(false);
    }
  }

  if (loading) return null;
  const strip = (s: string) => s.replace(/[。.!！?？\s]/g, '');
  const same = result && strip(result.corrected) === strip(result.sentence);
  const v = result ? verdict(result.score) : null;

  return (
    <View style={[styles.box, { borderColor: theme.border }]}>
      <View style={styles.title}>
        <Icon name="pencil" size={16} color="primary" />
        <AppText weight="600">
          Đặt câu với <Hanzi size={16}>{word.simplified}</Hanzi>
        </AppText>
        <View style={[styles.badge, { backgroundColor: alpha(theme.accent, 0.1) }]}>
          <AppText variant="caption" weight="700" color="accent">
            AI chấm
          </AppText>
        </View>
      </View>
      <AppText variant="caption" color="muted" style={styles.lead}>
        Tự viết 1 câu dùng từ này{word.meaningVi ? ` (${word.meaningVi.split(';')[0]})` : ''} — AI sửa lỗi và giải thích bằng tiếng
        Việt.
      </AppText>
      {user ? (
        <View style={styles.form}>
          <TextInput
            value={text}
            onChangeText={setText}
            maxLength={MAX}
            multiline
            placeholder={`Ví dụ: 我每天用${word.simplified}…`}
            placeholderTextColor={theme.muted}
            style={[styles.input, { borderColor: alpha(theme.border, 0.8), color: theme.text, backgroundColor: theme.surface }]}
          />
          <Button
            title={busy ? 'AI đang chấm…' : 'AI chấm câu'}
            leftIcon="spark"
            disabled={busy || !text.trim()}
            onPress={() => void submit()}
            style={styles.submit}
          />
        </View>
      ) : (
        <Button
          title="Đăng nhập để AI chấm câu của bạn"
          icon="arrow"
          variant="secondary"
          onPress={() => router.push('/login')}
          style={styles.submit}
        />
      )}
      {error ? (
        <View style={styles.error}>
          <ErrorNote>{error}</ErrorNote>
        </View>
      ) : null}
      {result && v && (
        <View style={[styles.result, { backgroundColor: alpha(theme.surface2, 0.6) }]}>
          <View style={[styles.verdict, { backgroundColor: alpha(theme[v.color], 0.1) }]}>
            <AppText weight="600" color={v.color}>
              {v.label}
            </AppText>
            <AppText weight="600" color={v.color}>
              {result.score}/100
            </AppText>
          </View>
          {!result.usesWord && (
            <AppText variant="caption" color="danger">
              Câu của bạn chưa dùng từ {word.simplified} — thử lại với từ này nhé.
            </AppText>
          )}
          <View>
            <AppText variant="label">{same ? 'Câu của bạn' : 'Câu đã sửa'}</AppText>
            <Hanzi size={18} style={styles.corrected}>
              {result.corrected}
            </Hanzi>
            <AppText variant="caption" color="muted">
              {result.pinyin}
            </AppText>
            <AppText style={styles.translation}>{result.translationVi}</AppText>
            {!same && (
              <AppText variant="caption" color="muted" style={styles.wrote}>
                Bạn viết:{' '}
                <Hanzi size={12} style={{ textDecorationLine: 'line-through', textDecorationColor: alpha(theme.danger, 0.6) }}>
                  {result.sentence}
                </Hanzi>
              </AppText>
            )}
          </View>
          <AppText style={styles.line24}>{result.explanationVi}</AppText>
          {result.tipVi && (
            <View style={styles.tip}>
              <Icon name="info" size={14} color="muted" />
              <AppText variant="caption" color="muted" style={styles.tipText}>
                {result.tipVi}
              </AppText>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderWidth: 1, borderRadius: 16, padding: 16 },
  title: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  badge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  lead: { marginTop: 4, lineHeight: 20 },
  form: { marginTop: 12 },
  input: {
    minHeight: 72,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: Fonts.hanzi,
    fontSize: 16,
    lineHeight: 28,
    textAlignVertical: 'top',
  },
  submit: { marginTop: 10, alignSelf: 'flex-start' },
  error: { marginTop: 12 },
  result: { marginTop: 16, gap: 12, borderRadius: 12, padding: 14 },
  verdict: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  corrected: { marginTop: 2 },
  translation: { marginTop: 2 },
  wrote: { marginTop: 4 },
  line24: { lineHeight: 24 },
  tip: { flexDirection: 'row', gap: 8 },
  tipText: { flex: 1, lineHeight: 20 },
});
