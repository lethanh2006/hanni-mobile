import { api } from './api';
import type { CheckoutResponse, PaymentOrder, PaymentProvider } from './types';

export interface PaymentsConfigured {
  configured: boolean;
  payos?: boolean;
  momo?: boolean;
  momoSandbox?: boolean;
}

export function providerAvailable(config: PaymentsConfigured | undefined, provider: PaymentProvider): boolean {
  if (!config?.configured) return false;
  return provider === 'payos' ? (config.payos ?? config.configured) : config.momo === true;
}

export function createPremiumCheckout(planKey: string, provider: PaymentProvider) {
  return api.post<CheckoutResponse>('/payments/premium-checkout', { planKey, provider });
}

export function getOrderStatus(orderCode: number) {
  return api.get<PaymentOrder>(`/payments/orders/${orderCode}`);
}

export function validCheckout(value: unknown): value is CheckoutResponse {
  if (!value || typeof value !== 'object') return false;
  const checkout = value as CheckoutResponse;
  if (!Number.isSafeInteger(checkout.orderCode) || checkout.orderCode <= 0) return false;
  try {
    const url = new URL(checkout.checkoutUrl);
    return url.protocol === 'https:' && !url.username && !url.password;
  } catch {
    return false;
  }
}

function wait(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const done = () => { clearTimeout(timer); signal.removeEventListener('abort', done); resolve(); };
    const timer = setTimeout(done, ms);
    signal.addEventListener('abort', done, { once: true });
    if (signal.aborted) done();
  });
}

/** Chỉ trạng thái từ server xác nhận trả tiền; đóng trình duyệt/URL quay về không phải bằng chứng thanh toán. */
export async function pollPaymentOrder(
  code: number,
  signal: AbortSignal,
  onOrder: (order: PaymentOrder) => void,
  options: { get?: typeof getOrderStatus; delayMs?: number; tries?: number } = {},
): Promise<void> {
  for (let attempt = 0; attempt < (options.tries ?? 10) && !signal.aborted; attempt++) {
    const order = await (options.get ?? getOrderStatus)(code);
    if (signal.aborted) return;
    if (order.orderCode !== code || !['PENDING', 'PAID', 'CANCELLED', 'EXPIRED'].includes(order.status)) {
      throw new Error('Trạng thái đơn không hợp lệ.');
    }
    onOrder(order);
    if (order.status !== 'PENDING') return;
    if (attempt + 1 < (options.tries ?? 10)) await wait(options.delayMs ?? 3000, signal);
  }
}
