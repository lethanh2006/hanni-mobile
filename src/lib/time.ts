/** "2 phút trước", "3 giờ trước"... — dùng cho bình luận & thông báo. */
export function timeAgo(iso: string): string {
  const diffSec = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  const steps: [number, string][] = [
    [60, "giây"],
    [60, "phút"],
    [24, "giờ"],
    [7, "ngày"],
    [4.345, "tuần"],
    [12, "tháng"],
    [Infinity, "năm"],
  ];
  let value = diffSec;
  for (const [size, unit] of steps) {
    if (value < size) {
      const n = Math.max(1, Math.floor(value));
      return unit === "giây" ? "vừa xong" : `${n} ${unit} trước`;
    }
    value /= size;
  }
  return "vừa xong";
}
