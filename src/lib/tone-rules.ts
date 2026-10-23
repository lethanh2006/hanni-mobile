/** Lời giải thích ngắn cho từng quy luật thanh điệu Hán Việt → tiếng Trung
 * (khoá trùng `ToneRuleKey` phía server, `src/modules/hanviet/tone-rule.util.ts`).
 * Đo trên chính bộ từ Hanni: đúng ~87% (HSK1-4 ~90%). */
export const TONE_RULE_TEXT: Record<string, string> = {
  ngang: "Không dấu → thường là thanh 1",
  ngang_vang: "Không dấu, mở đầu bằng m/n/l/v/d → thường là thanh 2",
  huyen: "Dấu huyền → thường là thanh 2",
  hoi_nga: "Dấu hỏi, ngã → thường là thanh 3",
  sac_nang: "Dấu sắc, nặng → thường là thanh 4",
  nhap_nang: "Dấu nặng, tận cùng -p/-t/-c/-ch → thường là thanh 2",
  nhap_nang_vang: "Dấu nặng, tận cùng -p/-t/-c/-ch, mở đầu m/n/l/v/d → thường là thanh 4",
  nhap_sac: "Dấu sắc, tận cùng -p/-t/-c/-ch → rải đều 4 thanh, phải nhớ riêng",
};
