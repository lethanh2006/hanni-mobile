import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText, Button, Chip, ErrorNote, Icon, TextField } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { ApiError } from '@/lib/api';
import { REPORT_REASONS, sendReport, type ReportFeature, type ReportKind, type ReportReason } from '@/lib/reports';

/**
 * Nút "Báo cáo" nhỏ dưới nội dung AI (hoặc ở hồ sơ người dùng): mở hộp chọn lý do rồi gửi `POST /reports`, không rời app.
 * CH Play bắt buộc với app có AI tạo nội dung (chính sách "AI-Generated Content") và app có ảnh, tên người dùng hiện
 * cho người khác (chính sách "User Generated Content").
 */
export function ReportButton({
  kind,
  content,
  feature,
  targetId,
  label = 'Báo cáo',
  style,
}: {
  kind: ReportKind;
  content: string;
  feature?: ReportFeature;
  targetId?: string;
  label?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  function close() {
    setOpen(false);
    setReason(null);
    setNote('');
    setSent(false);
    setError('');
  }

  async function submit() {
    if (!reason || busy) return;
    setBusy(true);
    setError('');
    try {
      await sendReport({ kind, reason, content, feature, targetId, note: note.trim() || undefined });
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Chưa gửi được, kiểm tra kết nối rồi thử lại nhé.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={kind === 'ai' ? 'Báo cáo nội dung AI này' : label}
        style={[styles.link, style]}>
        <Icon name="flag" size={12} color="muted" />
        <AppText variant="caption" weight="500" color="muted">
          {label}
        </AppText>
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
        <Pressable style={styles.backdrop} onPress={close}>
          <Pressable style={[styles.sheet, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {sent ? (
              <>
                <AppText weight="700">Đã gửi báo cáo</AppText>
                <AppText color="muted" style={styles.lead}>
                  Cảm ơn bạn. Hanni sẽ xem lại nội dung này và chỉnh bộ lọc để không lặp lại.
                </AppText>
                <Button title="Đóng" variant="secondary" onPress={close} />
              </>
            ) : (
              <>
                <AppText weight="700">{kind === 'ai' ? 'Báo cáo câu trả lời của AI' : 'Báo cáo người dùng'}</AppText>
                <AppText color="muted" style={styles.lead}>
                  Chọn lý do. Nội dung bị báo cáo được gửi kèm để Hanni xem lại.
                </AppText>
                <View style={styles.reasons}>
                  {REPORT_REASONS[kind].map((r) => (
                    <Chip key={r.value} label={r.label} active={reason === r.value} onPress={() => setReason(r.value)} />
                  ))}
                </View>
                <TextField
                  label="Ghi chú (không bắt buộc)"
                  value={note}
                  onChangeText={setNote}
                  maxLength={500}
                  multiline
                  placeholder="Nói thêm điều chưa ổn"
                />
                {error ? <ErrorNote>{error}</ErrorNote> : null}
                <View style={styles.actions}>
                  <Button title="Huỷ" variant="ghost" onPress={close} style={styles.flex} />
                  <Button
                    title="Gửi báo cáo"
                    leftIcon="flag"
                    onPress={submit}
                    loading={busy}
                    disabled={!reason}
                    style={styles.flex}
                  />
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  link: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingTop: 2 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 24 },
  sheet: { borderWidth: 1, borderRadius: 16, padding: 20, gap: 12 },
  lead: { lineHeight: 22 },
  reasons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actions: { flexDirection: 'row', gap: 8 },
  flex: { flex: 1 },
});
