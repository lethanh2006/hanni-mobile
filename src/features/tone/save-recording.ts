import * as Sharing from 'expo-sharing';

/** "Tải bản ghi về máy": mở bảng chia sẻ của máy để lưu/gửi tệp ghi âm (WAV). */
export async function saveRecording(uri: string, _name: string) {
  if (!(await Sharing.isAvailableAsync())) return false;
  await Sharing.shareAsync(uri, { mimeType: 'audio/wav', dialogTitle: 'Lưu bản ghi phát âm' });
  return true;
}
