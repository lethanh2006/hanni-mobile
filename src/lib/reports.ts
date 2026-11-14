import { api } from './api';

/**
 * Báo cáo nội dung (POST /reports của hanni-server). CH Play bắt app có AI tạo nội dung phải cho người dùng báo cáo nội
 * dung xúc phạm ngay trong app; app có ảnh, tên người dùng hiện cho người khác thì phải báo cáo được người dùng đó.
 */
export type ReportKind = 'ai' | 'user';

/** Tính năng AI nơi nội dung bị báo cáo, để biết cần chỉnh bộ lọc ở đâu. */
export type ReportFeature = 'assistant' | 'roleplay' | 'analyze' | 'sentence-check' | 'mnemonic' | 'coach';

export type ReportReason = 'offensive' | 'sexual' | 'dangerous' | 'wrong' | 'other';

export const REPORT_REASONS: Record<ReportKind, { value: ReportReason; label: string }[]> = {
  ai: [
    { value: 'offensive', label: 'Xúc phạm, thù ghét' },
    { value: 'sexual', label: 'Tình dục, không phù hợp' },
    { value: 'dangerous', label: 'Nguy hiểm, bạo lực' },
    { value: 'wrong', label: 'Sai kiến thức' },
    { value: 'other', label: 'Khác' },
  ],
  user: [
    { value: 'offensive', label: 'Tên hoặc ảnh xúc phạm' },
    { value: 'sexual', label: 'Ảnh không phù hợp' },
    { value: 'other', label: 'Khác' },
  ],
};

export interface ReportInput {
  kind: ReportKind;
  reason: ReportReason;
  /** Nội dung bị báo cáo, gửi kèm để xem lại (server cắt còn 4.000 ký tự). */
  content: string;
  feature?: ReportFeature;
  /** Mã phiên trò chuyện, mã người dùng bị báo cáo… */
  targetId?: string;
  note?: string;
}

export function sendReport(input: ReportInput) {
  return api.post<{ ok: true }>('/reports', input);
}
