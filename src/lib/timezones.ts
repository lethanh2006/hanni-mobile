/** Danh sách múi giờ IANA phổ biến cho dropdown Cài đặt. */
export const TIMEZONES: { value: string; label: string }[] = [
  { value: 'Asia/Ho_Chi_Minh', label: 'Việt Nam (Hà Nội / TP.HCM)' },
  { value: 'Asia/Bangkok', label: 'Thái Lan (Bangkok)' },
  { value: 'Asia/Phnom_Penh', label: 'Campuchia (Phnom Penh)' },
  { value: 'Asia/Vientiane', label: 'Lào (Vientiane)' },
  { value: 'Asia/Jakarta', label: 'Indonesia (Jakarta)' },
  { value: 'Asia/Singapore', label: 'Singapore' },
  { value: 'Asia/Kuala_Lumpur', label: 'Malaysia (Kuala Lumpur)' },
  { value: 'Asia/Manila', label: 'Philippines (Manila)' },
  { value: 'Asia/Shanghai', label: 'Trung Quốc (Bắc Kinh / Thượng Hải)' },
  { value: 'Asia/Hong_Kong', label: 'Hồng Kông' },
  { value: 'Asia/Taipei', label: 'Đài Loan (Đài Bắc)' },
  { value: 'Asia/Tokyo', label: 'Nhật Bản (Tokyo)' },
  { value: 'Asia/Seoul', label: 'Hàn Quốc (Seoul)' },
  { value: 'Asia/Kolkata', label: 'Ấn Độ (Kolkata)' },
  { value: 'Asia/Dubai', label: 'UAE (Dubai)' },
  { value: 'Australia/Sydney', label: 'Úc (Sydney)' },
  { value: 'Pacific/Auckland', label: 'New Zealand (Auckland)' },
  { value: 'Europe/London', label: 'Anh (London)' },
  { value: 'Europe/Paris', label: 'Pháp / Đức (Paris)' },
  { value: 'Europe/Moscow', label: 'Nga (Moscow)' },
  { value: 'America/New_York', label: 'Mỹ – Miền Đông (New York)' },
  { value: 'America/Chicago', label: 'Mỹ – Trung tâm (Chicago)' },
  { value: 'America/Denver', label: 'Mỹ – Núi (Denver)' },
  { value: 'America/Los_Angeles', label: 'Mỹ – Bờ Tây (Los Angeles)' },
  { value: 'America/Sao_Paulo', label: 'Brazil (São Paulo)' },
  { value: 'UTC', label: 'UTC' },
];

/** Múi giờ trình duyệt đang dùng (nếu phát hiện được). */
export function detectTimezone(): string | null {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch {
    return null;
  }
}
