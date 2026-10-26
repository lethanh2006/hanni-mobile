import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Card, Details, Icon, IconTile, Screen } from '@/components/ui';
import { alpha, Radius, tintPanel } from '@/constants/theme';
import { ExamInsights } from '@/features/mock-exam/exam-insights';
import { ExamList, ExamProgress } from '@/features/mock-exam/exam-list';
import { ExamStructure } from '@/features/mock-exam/exam-structure';
import { useTheme } from '@/hooks/use-theme';

const TAGS = ['HSK 1 · 2 · 3 · 4', 'Nghe · Đọc · Viết', 'Chữa bài tiếng Việt', 'Miễn phí'];

const TIPS = [
  'Bấm giờ như thi thật để quen áp lực thời gian.',
  'Phần nghe: đọc trước các tranh/đáp án để biết cần nghe gì.',
  'Phần ghép A–F: làm câu chắc chắn trước, loại dần phương án đã dùng.',
  'Sai ở đâu, ôn lại đúng từ vựng đó trong lộ trình rồi làm đề khác.',
];

/** Câu hỏi thường gặp — chép nguyên từ trang `/thi-thu-hsk` của web. */
const FAQ: [string, string][] = [
  [
    'Đề thi thử trên Hanni có giống đề HSK thật không?',
    'Giống về CẤU TRÚC: HSK 1 gồm 40 câu (20 nghe, 20 đọc), HSK 2 gồm 60 câu (35 nghe, 25 đọc), HSK 3 gồm 80 câu (40 nghe, 30 đọc, 10 viết), HSK 4 gồm 100 câu (45 nghe, 40 đọc, 15 viết), đủ các dạng câu y như đề thật. Nội dung do Hanni tự soạn, chỉ dùng từ vựng đúng cấp (HSK 3.0), tranh minh hoạ bằng biểu tượng, phần nghe dùng giọng đọc tiếng Trung của máy chứ không phải băng ghi âm đề thật.',
  ],
  [
    'Thi HSK bao nhiêu điểm thì đạt?',
    'HSK 1 và HSK 2 đều tổng 200 điểm (nghe 100, đọc 100), đạt từ 120 điểm. HSK 3 trở lên có thêm phần viết, tổng 300 điểm, đạt từ 180.',
  ],
  [
    'Đề HSK 1, HSK 2, HSK 3, HSK 4 thi trong bao lâu?',
    'HSK 1 khoảng 40 phút, HSK 2 khoảng 55 phút, HSK 3 khoảng 90 phút, HSK 4 khoảng 105 phút — đã gồm 5 phút điền thông tin cá nhân. Đề thử trên Hanni tính giờ đúng thời gian làm bài: 35 phút với HSK 1, 50 phút với HSK 2, 85 phút với HSK 3, 100 phút với HSK 4.',
  ],
  [
    'Đề thi HSK 2 gồm những phần nào?',
    'Nghe 35 câu: nghe câu đối chiếu tranh (10), nghe hội thoại ghép tranh (10), hội thoại ngắn chọn đáp án (10), hội thoại dài chọn đáp án (5). Đọc 25 câu: ghép câu với tranh (5), điền từ (5), đọc đoạn văn xét câu ★ đúng/sai (5), ghép câu hỏi – câu trả lời (10).',
  ],
  [
    'Đề thi HSK 3 gồm những phần nào?',
    'Nghe 40 câu: nghe hội thoại ghép tranh (10), nghe một đoạn văn xét câu ★ đúng/sai (10), hội thoại ngắn chọn đáp án (10), hội thoại dài chọn đáp án (10). Đọc 30 câu: ghép câu với câu đáp (10), chọn từ điền chỗ trống (10), đọc đoạn văn trả lời câu hỏi (10). Viết 10 câu: sắp xếp từ thành câu (5), nhìn pinyin viết chữ Hán (5). Tổng 300 điểm, đạt từ 180. Trên Hanni, câu viết chữ chọn trong các chữ đồng âm — giống thi trên máy, gõ pinyin rồi chọn chữ.',
  ],
  [
    'Đề thi HSK 4 gồm những phần nào?',
    'Nghe 45 câu: nghe một đoạn xét câu ★ đúng/sai (10), hội thoại ngắn chọn đáp án (15), hội thoại dài hoặc đoạn văn chọn đáp án (20). Đọc 40 câu: chọn từ điền chỗ trống (10), sắp xếp 3 câu thành đoạn văn (10), đọc đoạn văn trả lời câu hỏi (20). Viết 15 câu: sắp xếp từ thành câu (10), nhìn tranh dùng từ cho sẵn đặt câu (5). Tổng 300 điểm, đạt từ 180.',
  ],
  [
    'Có cần tạo tài khoản không?',
    'Không. Ai cũng làm và xem điểm, chữa bài được. Đăng nhập để lưu điểm từng đề và theo dõi tiến bộ qua các lần làm.',
  ],
  [
    'HSK 3.0 thì sao?',
    'Các kỳ thi HSK 1–6 thường kỳ năm 2026 vẫn dùng đề dạng hiện hành; đề theo chuẩn HSK 3.0 mới thi ở một số đợt riêng. Từ vựng trong đề Hanni lấy theo danh sách HSK 3.0 nên ôn theo đề này không bị lệch.',
  ],
];

/**
 * Tab Luyện thi (trang `/thi-thu-hsk` của web ở khổ điện thoại): thẻ giới thiệu · tiến độ luyện đề · chọn đề ·
 * phân tích điểm mạnh/yếu · câu hỏi thường gặp · kiểm tra trình độ · cấu trúc đề · mẹo luyện thi.
 * Khách làm được, đăng nhập để lưu điểm.
 */
export default function MockExamTab() {
  const theme = useTheme();
  return (
    <Screen contentStyle={styles.page}>
      <View style={styles.top}>
        <View style={[styles.hero, tintPanel(theme)]}>
          <AppText weight="800" style={styles.heroTitle}>
            Đề thi thử HSK online
          </AppText>
          <AppText color="muted" style={styles.heroText}>
            Đúng cấu trúc đề thật, nộp bài là có điểm và chữa từng câu bằng tiếng Việt.
          </AppText>
          <View style={styles.tags}>
            {TAGS.map((t) => (
              <View
                key={t}
                style={[styles.tag, { borderColor: alpha(theme.primary, 0.2), backgroundColor: alpha(theme.surface, 0.7) }]}>
                <AppText variant="caption" weight="600">
                  {t}
                </AppText>
              </View>
            ))}
          </View>
        </View>
        <ExamProgress />
      </View>

      <View style={styles.section}>
        <AppText weight="800" style={styles.h2}>
          Chọn đề
        </AppText>
        <ExamList />
        <View style={styles.insights}>
          <ExamInsights />
        </View>
      </View>

      <View style={styles.section}>
        <AppText weight="800" style={styles.h2}>
          Câu hỏi thường gặp
        </AppText>
        {FAQ.map(([q, a]) => (
          <Details key={q} title={q}>
            {a}
          </Details>
        ))}
      </View>

      <View style={styles.aside}>
        {/* Như ô "Đánh giá năng lực — Bạn đang ở đâu?" cạnh danh sách đề của Hanzii. */}
        <Card
          onPress={() => router.push('/kiem-tra-trinh-do')}
          style={styles.placement}>
          <View style={styles.placementRow}>
            <IconTile icon="chart" iconSize={20} />
            <View style={styles.flex}>
              <AppText weight="700">Chưa biết nên thi cấp nào?</AppText>
              <AppText variant="caption" color="muted">
                Kiểm tra trình độ — vài phút, không cần tài khoản
              </AppText>
            </View>
            <Icon name="arrow" size={16} color="muted" />
          </View>
        </Card>
        <ExamStructure />
        <Card style={styles.tips}>
          <View style={styles.tipsHead}>
            <Icon name="spark" size={16} color="primary" />
            <AppText weight="700">Mẹo luyện thi</AppText>
          </View>
          <View style={styles.tipList}>
            {TIPS.map((t, i) => (
              <View key={t} style={styles.tip}>
                <View style={[styles.tipNo, { backgroundColor: alpha(theme.primary, 0.1) }]}>
                  <AppText variant="caption" weight="700" color="primary">
                    {i + 1}
                  </AppText>
                </View>
                <AppText style={[styles.flex, styles.tipText]}>{t}</AppText>
              </View>
            ))}
          </View>
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { gap: 32 },
  top: { gap: 16 },
  hero: { borderWidth: 1, borderRadius: Radius.lg, padding: 20 },
  heroTitle: { fontSize: 24, lineHeight: 32, letterSpacing: -0.6 },
  heroText: { marginTop: 8, lineHeight: 24 },
  tags: { marginTop: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  section: { gap: 12 },
  h2: { fontSize: 18, lineHeight: 28, letterSpacing: -0.45 },
  insights: { paddingTop: 12 },
  aside: { gap: 16 },
  placement: { padding: 16 },
  placementRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flex: { flex: 1, minWidth: 0 },
  tips: { gap: 0 },
  tipsHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tipList: { marginTop: 12, gap: 8 },
  tip: { flexDirection: 'row', gap: 8 },
  tipNo: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  tipText: { lineHeight: 24 },
});
