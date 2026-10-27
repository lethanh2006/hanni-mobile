import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

/** Ghi tệp lịch (.ics) vào bộ nhớ đệm rồi mở bảng chia sẻ — chọn app Lịch để thêm lịch học. */
export async function saveIcs(body: string, name: string) {
  const file = new File(Paths.cache, name);
  file.create({ overwrite: true });
  file.write(body);
  await Sharing.shareAsync(file.uri, { mimeType: 'text/calendar', UTI: 'public.calendar-event', dialogTitle: 'Thêm lịch học' });
}
