import { Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText, Card, IconTile, PageHeader, Screen, type IconName } from '@/components/ui';
import { Radius } from '@/constants/theme';
import { ScanTool } from '@/features/scan/scan-tool';

const STEPS: { icon: IconName; title: string; text: string }[] = [
  {
    icon: 'camera',
    title: 'Chụp hoặc chọn ảnh',
    text: 'Thực đơn, biển hiệu, bao bì, sách, tin nhắn, chữ viết tay. Không có chữ thì chụp món ăn, đồ vật.',
  },
  {
    icon: 'search',
    title: 'Bấm vào từng từ',
    text: 'Mỗi từ có pinyin, âm Hán Việt, nghĩa tiếng Việt từ từ điển Hanni và audio phát âm chuẩn.',
  },
  {
    icon: 'cards',
    title: 'Lưu vào ôn tập',
    text: 'Một chạm là từ vào danh sách ôn tập ngắt quãng — gặp lại đúng lúc sắp quên.',
  },
];

/**
 * Quét ảnh học từ (`/tu-dien/quet` của web ở khổ mobile):
 * Tiêu đề trang · Công cụ chụp/quét ảnh · 3 bước hướng dẫn.
 */
export default function ScanScreen() {
  return (
    <Screen contentStyle={styles.page}>
      <Stack.Screen options={{ title: 'Quét ảnh học từ' }} />
      <PageHeader
        icon="camera"
        title="Chụp là hiểu chữ Hán"
        description="Hanni đọc từng dòng chữ trong ảnh, dịch sang tiếng Việt rồi tách ra từng từ kèm pinyin, âm Hán Việt và nghĩa — chụp món ăn, đồ vật thì cho biết tên tiếng Trung của chúng."
      />

      <ScanTool />

      <View style={styles.stepsSection}>
        <AppText weight="700" color="muted" style={styles.stepsHeading}>
          Cách dùng
        </AppText>
        <View style={styles.stepsList}>
          {STEPS.map((s, i) => (
            <Card key={s.title} style={styles.stepCard}>
              <IconTile icon={s.icon} size={40} iconSize={20} />
              <View style={styles.stepBody}>
                <AppText weight="700" style={styles.stepTitle}>
                  {i + 1}. {s.title}
                </AppText>
                <AppText variant="caption" color="muted" style={styles.stepText}>
                  {s.text}
                </AppText>
              </View>
            </Card>
          ))}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { gap: 24, paddingBottom: 36 },
  stepsSection: { gap: 12, marginTop: 8 },
  stepsHeading: { fontSize: 13, letterSpacing: 0.5, textTransform: 'uppercase' },
  stepsList: { gap: 10 },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    padding: 16,
    borderRadius: Radius.lg,
  },
  stepBody: { flex: 1, gap: 4 },
  stepTitle: { fontSize: 15 },
  stepText: { lineHeight: 18 },
});

