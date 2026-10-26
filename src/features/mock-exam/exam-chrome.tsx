import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Icon } from '@/components/ui';
import { alpha } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { MockAnswer, MockPaper } from '@/lib/types';

import { SECTION_VI } from './labels';
import { stopListening } from './listening';

/** Thanh "← Danh sách đề" trên màn giới thiệu và màn kết quả (khung phòng thi không dùng thanh chung của app). */
export function ExamBackBar() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.backBar, { paddingTop: insets.top + 12, borderColor: theme.border, backgroundColor: theme.surface }]}>
      <Pressable
        onPress={() => {
          stopListening();
          router.navigate('/thi-thu-hsk');
        }}
        style={styles.backLink}
        hitSlop={6}>
        <Icon name="back" size={18} color="muted" />
        <AppText color="muted">Danh sách đề</AppText>
      </Pressable>
    </View>
  );
}

/** Hộp hỏi lại (nộp bài / thoát) — điện thoại nằm sát đáy như `Overlay` của web. */
export function ExamDialog({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.backdrop, { paddingBottom: insets.bottom + 16 }]}>
        <View style={[styles.dialog, { backgroundColor: theme.surface }]}>{children}</View>
      </View>
    </Modal>
  );
}

/** Bảng số câu (`Navigator` của web): đã làm tô đậm, câu đánh dấu có viền vàng; bấm số để tới câu đó. */
export function ExamNavigator({
  paper,
  answers,
  flags,
  onJump,
}: {
  paper: MockPaper;
  answers: (MockAnswer | null)[];
  flags: number[];
  onJump: (no: number) => void;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.navPanel, { borderColor: theme.border, backgroundColor: theme.surface }]}>
      <AppText weight="700">Danh sách câu</AppText>
      {paper.sections.map((s) => {
        const nos = s.parts.flatMap((p) => p.items.map((i) => i.no));
        const rows: number[][] = [];
        for (let i = 0; i < nos.length; i += 5) rows.push(nos.slice(i, i + 5));
        return (
          <View key={s.kind} style={styles.navSection}>
            <AppText variant="caption" weight="600" color="muted">
              {SECTION_VI[s.kind].vi}
            </AppText>
            <View style={styles.navGrid}>
              {rows.map((row) => (
                <View key={row[0]} style={styles.navRow}>
                  {row.map((no) => {
                    const done = answers[no - 1] !== null && answers[no - 1] !== undefined;
                    const flagged = flags.includes(no);
                    return (
                      <Pressable
                        key={no}
                        onPress={() => onJump(no)}
                        style={[
                          styles.navCell,
                          { backgroundColor: done ? theme.text : theme.surface2 },
                          flagged && { borderWidth: 2, borderColor: theme.warn },
                        ]}>
                        <AppText variant="caption" weight="700" style={{ color: done ? theme.background : theme.text }}>
                          {no}
                        </AppText>
                      </Pressable>
                    );
                  })}
                  {Array.from({ length: 5 - row.length }, (_, k) => (
                    <View key={`gap-${k}`} style={styles.navGap} />
                  ))}
                </View>
              ))}
            </View>
          </View>
        );
      })}
      <View style={styles.legend}>
        <Legend swatch={{ backgroundColor: theme.text }} label="Đã làm" />
        <Legend swatch={{ backgroundColor: theme.surface2 }} label="Chưa làm" />
        <Legend swatch={{ borderWidth: 2, borderColor: theme.warn }} label="Đánh dấu xem lại" />
      </View>
    </View>
  );
}

function Legend({ swatch, label }: { swatch: object; label: string }) {
  return (
    <View style={styles.legendRow}>
      <View style={[styles.swatch, swatch]} />
      <AppText variant="caption" color="muted">
        {label}
      </AppText>
    </View>
  );
}

/** Tấm dưới đáy chứa bảng số câu (điện thoại). */
export function NavigatorSheet({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={[styles.sheetBackdrop, { backgroundColor: alpha('#000000', 0.4) }]} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: theme.surface, paddingBottom: insets.bottom + 20 }]}>
          <ScrollView>{children}</ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backBar: { borderBottomWidth: 1, paddingHorizontal: 16, paddingBottom: 12 },
  backLink: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' },
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)', padding: 16 },
  dialog: { borderRadius: 16, padding: 24, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' },
  navPanel: { borderWidth: 1, borderRadius: 16, padding: 16 },
  navSection: { marginTop: 12 },
  navGrid: { marginTop: 8, gap: 6 },
  navRow: { flexDirection: 'row', gap: 6 },
  navCell: { flex: 1, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  navGap: { flex: 1 },
  legend: { marginTop: 16, gap: 6 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  swatch: { width: 12, height: 12, borderRadius: 3 },
  sheetBackdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: { maxHeight: '75%', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
});
