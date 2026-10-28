import Storage from 'expo-sqlite/kv-store';

import { validCheckout } from '@/lib/payments';
import type { CheckoutResponse } from '@/lib/types';

const key = (userId: string) => `hanni:premium-checkout:${userId}`;

export function readPendingCheckout(userId: string): CheckoutResponse | null {
  try {
    const value: unknown = JSON.parse(Storage.getItemSync(key(userId)) ?? 'null');
    return validCheckout(value) ? value : null;
  } catch { return null; }
}

export function savePendingCheckout(userId: string, checkout: CheckoutResponse | null) {
  // Lỗi lưu trữ không được làm mất đơn đang có trong state hoặc tạo đơn thứ hai.
  try {
    if (checkout) Storage.setItemSync(key(userId), JSON.stringify(checkout));
    else Storage.removeItemSync(key(userId));
  } catch { /* Vẫn giữ đơn trong phiên hiện tại. */ }
}
