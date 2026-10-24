import { router } from 'expo-router';

import { PageHeader, Screen, TextLink } from '@/components/ui';
import { ExamList } from '@/features/mock-exam/exam-list';

/** Tab Luyện thi HSK: đề thi thử đúng cấu trúc đề thật, khách cũng làm được. */
export default function MockExamTab() {
  return (
    <Screen safeTop>
      <PageHeader
        icon="target"
        title="Luyện thi HSK"
        description="Đề thi thử đúng cấu trúc đề thật — đồng hồ, chấm điểm và chữa từng câu."
      />
      <TextLink title="Chưa biết nên thi cấp nào? Kiểm tra trình độ →" onPress={() => router.push('/kiem-tra-trinh-do')} />
      <ExamList />
    </Screen>
  );
}
