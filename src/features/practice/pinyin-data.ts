import type { PinyinOverview, SyllableSound } from '@/lib/types';

/**
 * Nội dung tĩnh của Bảng phiên âm (`/phien-am`). Cách đọc ghi theo kiểu 'gần
 * với âm tiếng Việt nào' — người Việt học pinyin nhanh nhất qua so sánh này
 * (tài liệu dạy tiếng Trung ở Việt Nam đều dùng), kèm chỗ KHÁC dễ sai.
 * `ex`: âm tiết ví dụ theo thứ tự ưu tiên — trang lấy âm đầu tiên có ghi âm.
 */

export interface PinyinItem {
  l: string;
  tip: string;
  ex: string[];
}

export const INITIAL_GROUPS: { name: string; note: string; items: PinyinItem[] }[] = [
  {
    name: 'Âm môi',
    note: 'Hai môi khép, hoặc môi dưới chạm răng trên',
    items: [
      { l: 'b', tip: 'Gần “p” tiếng Việt — không bật hơi', ex: ['ba', 'bu', 'bai'] },
      { l: 'p', tip: 'Như b nhưng bật hơi mạnh (để tờ giấy trước miệng sẽ thấy rung)', ex: ['pa', 'pao', 'pi'] },
      { l: 'm', tip: 'Như “m”', ex: ['ma', 'mi', 'mai'] },
      { l: 'f', tip: 'Như “ph”', ex: ['fa', 'fan', 'fei'] },
    ],
  },
  {
    name: 'Đầu lưỡi giữa',
    note: 'Đầu lưỡi chạm lợi trên',
    items: [
      { l: 'd', tip: 'Như “t” — không bật hơi', ex: ['da', 'di', 'dou'] },
      { l: 't', tip: 'Như “th” — bật hơi', ex: ['ta', 'tian', 'tou'] },
      { l: 'n', tip: 'Như “n”', ex: ['na', 'ni', 'nan'] },
      { l: 'l', tip: 'Như “l”', ex: ['la', 'li', 'lai'] },
    ],
  },
  {
    name: 'Cuống lưỡi',
    note: 'Cuống lưỡi nâng lên chạm ngạc mềm',
    items: [
      { l: 'g', tip: 'Như “c/k” — không bật hơi', ex: ['ge', 'gao', 'gei'] },
      { l: 'k', tip: 'Như “c/k” nhưng bật hơi mạnh — không phải “kh” tiếng Việt', ex: ['ka', 'kan', 'kou'] },
      { l: 'h', tip: 'Gần “h”, xát nhẹ ở cuống lưỡi như “kh” nhẹ', ex: ['he', 'hao', 'hen'] },
    ],
  },
  {
    name: 'Mặt lưỡi',
    note: 'Mặt lưỡi áp lên ngạc cứng — chỉ đi với i và ü',
    items: [
      { l: 'j', tip: 'Gần “ch” trong “chi” — không bật hơi', ex: ['ji', 'jia', 'jiu'] },
      { l: 'q', tip: 'Như j nhưng bật hơi', ex: ['qi', 'qu', 'qian'] },
      { l: 'x', tip: 'Gần “x” trong “xi”', ex: ['xi', 'xie', 'xiao'] },
    ],
  },
  {
    name: 'Uốn lưỡi',
    note: 'Cong đầu lưỡi lên chạm ngạc — người Việt hay quên uốn',
    items: [
      { l: 'zh', tip: 'Gần “tr” — uốn lưỡi, không bật hơi', ex: ['zhi', 'zhe', 'zhong'] },
      { l: 'ch', tip: 'Như zh nhưng bật hơi', ex: ['chi', 'chu', 'che'] },
      { l: 'sh', tip: 'Gần “s” uốn lưỡi — đừng đọc thành “x”', ex: ['shi', 'shu', 'shan'] },
      { l: 'r', tip: 'Gần “r” nhẹ, uốn lưỡi, không rung lưỡi', ex: ['ri', 're', 'ren'] },
    ],
  },
  {
    name: 'Đầu lưỡi trước',
    note: 'Đầu lưỡi thẳng, chạm sau răng cửa trên',
    items: [
      { l: 'z', tip: '“ts” không bật hơi — gần “ch” nhưng lưỡi thẳng', ex: ['zi', 'zai', 'zuo'] },
      { l: 'c', tip: 'Như z nhưng bật hơi (“ts” bật hơi)', ex: ['ci', 'cai', 'cuo'] },
      { l: 's', tip: 'Như “x” tiếng Việt', ex: ['si', 'san', 'suo'] },
    ],
  },
];

export const FINAL_GROUPS: { name: string; items: PinyinItem[] }[] = [
  {
    name: 'Vận mẫu đơn',
    items: [
      { l: 'a', tip: 'Như “a”', ex: ['ba', 'ma', 'da'] },
      { l: 'o', tip: 'Gần “ô”; sau b/p/m/f nghe như “bua, pua”', ex: ['bo', 'mo', 'po'] },
      { l: 'e', tip: 'Gần “ưa” — miệng dẹt, lưỡi lùi sau', ex: ['e', 'he', 'ke'] },
      { l: 'i', tip: 'Như “i”; sau z/c/s/zh/ch/sh/r lại đọc gần “ư”', ex: ['yi', 'bi', 'mi'] },
      { l: 'u', tip: 'Như “u”', ex: ['wu', 'bu', 'lu'] },
      { l: 'ü', tip: 'Tròn môi đọc “i” (gần “uy”); sau j/q/x/y viết thành u', ex: ['nü', 'lü', 'yu'] },
    ],
  },
  {
    name: 'Vận mẫu kép',
    items: [
      { l: 'ai', tip: 'Như “ai”', ex: ['ai', 'mai', 'lai'] },
      { l: 'ei', tip: 'Như “ây”', ex: ['bei', 'mei', 'gei'] },
      { l: 'ao', tip: 'Như “ao”', ex: ['bao', 'hao', 'gao'] },
      { l: 'ou', tip: 'Như “âu”', ex: ['dou', 'zou', 'kou'] },
    ],
  },
  {
    name: 'Vận mẫu mũi',
    items: [
      { l: 'an', tip: 'Như “an”', ex: ['fan', 'kan', 'san'] },
      { l: 'en', tip: 'Như “ân”', ex: ['men', 'hen', 'ren'] },
      { l: 'ang', tip: 'Như “ang”', ex: ['fang', 'tang', 'bang'] },
      { l: 'eng', tip: 'Như “âng”', ex: ['deng', 'leng', 'feng'] },
      { l: 'ong', tip: 'Như “ung”', ex: ['dong', 'zhong', 'hong'] },
    ],
  },
  {
    name: 'Nhóm i',
    items: [
      { l: 'ia', tip: '“i + a” đọc liền', ex: ['jia', 'xia'] },
      { l: 'ie', tip: 'Như “iê”', ex: ['xie', 'jie', 'bie'] },
      { l: 'iao', tip: '“i + ao” đọc liền', ex: ['xiao', 'jiao', 'piao'] },
      { l: 'iu', tip: 'Viết tắt của iou — gần “iêu”', ex: ['liu', 'jiu', 'qiu'] },
      { l: 'ian', tip: 'Như “iên”', ex: ['tian', 'qian', 'nian'] },
      { l: 'in', tip: 'Như “in”', ex: ['xin', 'jin', 'lin'] },
      { l: 'iang', tip: '“i + ang” đọc liền', ex: ['liang', 'xiang', 'jiang'] },
      { l: 'ing', tip: 'Như “inh”', ex: ['ming', 'qing', 'ting'] },
      { l: 'iong', tip: '“i + ung” đọc liền', ex: ['xiong', 'qiong'] },
    ],
  },
  {
    name: 'Nhóm u',
    items: [
      { l: 'ua', tip: 'Như “oa”', ex: ['hua', 'gua', 'shua'] },
      { l: 'uo', tip: 'Như “ua/uô”', ex: ['guo', 'duo', 'zuo'] },
      { l: 'uai', tip: 'Như “oai”', ex: ['kuai', 'huai', 'shuai'] },
      { l: 'ui', tip: 'Viết tắt của uei — gần “uây”', ex: ['gui', 'hui', 'dui'] },
      { l: 'uan', tip: 'Như “oan”', ex: ['huan', 'duan', 'guan'] },
      { l: 'un', tip: 'Viết tắt của uen — gần “uân”', ex: ['chun', 'lun', 'kun'] },
      { l: 'uang', tip: 'Như “oang”', ex: ['huang', 'guang', 'chuang'] },
      { l: 'ueng', tip: 'Gần “uâng” — chỉ có âm tiết weng', ex: ['weng'] },
    ],
  },
  {
    name: 'Nhóm ü',
    items: [
      { l: 'üe', tip: 'Tròn môi đọc “uê” (sau j/q/x/y viết ue)', ex: ['xue', 'yue', 'jue'] },
      { l: 'üan', tip: 'Tròn môi đọc “uyên” (sau j/q/x/y viết uan)', ex: ['quan', 'yuan', 'xuan'] },
      { l: 'ün', tip: 'Tròn môi đọc “uyn” (sau j/q/x/y viết un)', ex: ['jun', 'qun', 'yun'] },
    ],
  },
  {
    name: 'Âm uốn lưỡi',
    items: [{ l: 'er', tip: 'Đọc “ơ” rồi cong lưỡi lên', ex: ['er'] }],
  },
];

/** Cao độ theo thang 5 bậc (Chao): 1 thấp nhất, 5 cao nhất. */
export const TONES = [
  {
    t: '1' as const,
    name: 'Thanh 1',
    pitch: [5, 5],
    desc: 'Cao và ngang — giữ đều như ngân một nốt nhạc cao.',
    vi: 'Gần thanh ngang tiếng Việt nhưng CAO hơn hẳn.',
  },
  {
    t: '2' as const,
    name: 'Thanh 2',
    pitch: [3, 5],
    desc: 'Đi lên từ giữa lên cao, như khi hỏi lại “hả?”.',
    vi: 'Gần dấu sắc.',
  },
  {
    t: '3' as const,
    name: 'Thanh 3',
    pitch: [2, 1, 4],
    desc: 'Xuống thấp rồi vòng lên; trong câu thường chỉ xuống thấp rồi dừng.',
    vi: 'Gần dấu hỏi.',
  },
  {
    t: '4' as const,
    name: 'Thanh 4',
    pitch: [5, 1],
    desc: 'Rơi mạnh từ cao xuống thấp, dứt khoát như ra lệnh.',
    vi: 'Gần dấu huyền nhưng bắt đầu cao, rơi nhanh — đừng đọc thành dấu nặng.',
  },
];

const TONE_KEYS = ['1', '2', '3', '4'] as const;

/** Âm thanh đầu tiên có được trong các âm tiết ứng viên (ưu tiên thanh 1). */
export function firstSound(
  data: PinyinOverview | null,
  bases: string[],
): SyllableSound | null {
  for (const base of bases) {
    const s = data?.syllables.find((x) => x.base === base);
    for (const t of TONE_KEYS) if (s?.tones[t]) return s.tones[t]!;
  }
  return null;
}
