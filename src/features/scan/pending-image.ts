import * as ImagePicker from 'expo-image-picker';
import Storage from 'expo-sqlite/kv-store';
import { Platform } from 'react-native';

const KEY = 'hanni-scan-picker-pending';
const MAX_AGE = 10 * 60 * 1000;
let recovered: ImagePicker.ImagePickerAsset | null = null;
let recovery: Promise<boolean> | null = null;

export function markScanPickerPending() {
  if (Platform.OS !== 'android') return;
  try { Storage.setItemSync(KEY, String(Date.now())); } catch { /* Tiếp tục chọn ảnh nếu bộ nhớ không khả dụng. */ }
}

export function clearScanPickerPending() {
  if (Platform.OS !== 'android') return;
  try { Storage.removeItemSync(KEY); } catch { /* Không chặn việc quét ảnh. */ }
}

// Android có thể tạo lại MainActivity trong khi máy ảnh/thư viện đang mở.
// Chỉ lấy kết quả đang chờ nếu chính màn quét ảnh đã mở picker.
export function recoverScanPicker(): Promise<boolean> {
  if (Platform.OS !== 'android') return Promise.resolve(false);
  if (recovered) return Promise.resolve(true);
  if (recovery) return recovery;
  recovery = (async () => {
    let started: string | null;
    try { started = Storage.getItemSync(KEY); } catch { return false; }
    if (!started) return false;
    const age = Date.now() - Number(started);
    if (!Number.isFinite(age) || age < 0 || age > MAX_AGE) {
      clearScanPickerPending();
      return false;
    }
    try {
      const result = await ImagePicker.getPendingResultAsync();
      clearScanPickerPending();
      if (result && 'canceled' in result && !result.canceled && result.assets?.[0]) {
        recovered = result.assets[0];
        return true;
      }
    } catch {
      clearScanPickerPending();
    }
    return false;
  })().finally(() => { recovery = null; });
  return recovery;
}

export function takeRecoveredScanImage() {
  const asset = recovered;
  recovered = null;
  return asset;
}
