import * as WebBrowser from 'expo-web-browser';
import { useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { mutate } from 'swr';

import { errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { createPremiumCheckout, pollPaymentOrder, validCheckout } from '@/lib/payments';
import type { PaymentProvider } from '@/lib/types';

import { readPendingCheckout, savePendingCheckout } from './pending-checkout';

/** Mount theo userId để đơn của tài khoản trước không hiện khi đổi tài khoản. */
export function usePremiumCheckout(userId: string) {
  const { refresh } = useAuth();
  const [pending, setPending] = useState(() => readPendingCheckout(userId));
  const [revision, setRevision] = useState(0);
  const [busy, setBusy] = useState(false);
  const [finishedRevision, setFinishedRevision] = useState<number | null>(null);
  const checking = !!pending && finishedRevision !== revision;
  const [paid, setPaid] = useState(false);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  /** Trang thanh toán đang mở trong app (`CheckoutSheet`, chỉ Android/iOS). */
  const [sheetUrl, setSheetUrl] = useState<string | null>(null);
  const lock = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') { setError(null); setRevision((value) => value + 1); }
    });
    return () => { mounted.current = false; subscription.remove(); };
  }, []);

  useEffect(() => {
    if (!pending) return;
    const controller = new AbortController();
    void pollPaymentOrder(pending.orderCode, controller.signal, (order) => {
      if (order.status === 'PENDING') {
        setNote('Đang chờ xác nhận thanh toán. Nếu đã chuyển khoản, hãy chờ và kiểm tra lại; không cần tạo đơn mới.');
        return;
      }
      savePendingCheckout(userId, null);
      setPending(null);
      setSheetUrl(null);
      if (order.status === 'PAID') {
        setPaid(true);
        setNote('Thanh toán thành công! Premium đã được kích hoạt.');
        // Cập nhật quyền lợi, hạn mức AI, Coach và thông tin tài khoản ngay trong app.
        void Promise.all([refresh(), mutate(() => true)]).catch(() => {
          if (mounted.current) setError('Đã xác nhận thanh toán. Kéo tải lại để cập nhật quyền lợi Premium.');
        });
      } else {
        setNote(order.status === 'CANCELLED' ? 'Đơn đã huỷ. Bạn có thể chọn gói và thử lại.' : 'Đơn đã hết hạn. Bạn có thể tạo đơn mới.');
      }
    }).catch((err: unknown) => {
      if (!controller.signal.aborted) setError(errorMessage(err, 'Chưa kiểm tra được đơn. Kết nối lại rồi bấm kiểm tra; đơn vẫn được giữ.'));
    }).finally(() => {
      if (!controller.signal.aborted) setFinishedRevision(revision);
    });
    return () => controller.abort();
  }, [pending, revision, userId, refresh]);

  async function openCheckout(url: string) {
    // Điện thoại: mở ngay trong app, cổng trả về là tấm tự đóng (`closeSheet`). Web: tab mới như trang web Hanni.
    if (Platform.OS !== 'web') {
      setSheetUrl(url);
      return;
    }
    await WebBrowser.openBrowserAsync(url);
    if (mounted.current) setRevision((value) => value + 1);
  }

  function closeSheet() {
    setSheetUrl(null);
    setError(null);
    setRevision((value) => value + 1);
  }

  async function pay(planKey: string, provider: PaymentProvider) {
    if (lock.current || pending) return;
    lock.current = true;
    setBusy(true);
    setError(null);
    setNote('');
    setPaid(false);
    try {
      const checkout = await createPremiumCheckout(planKey, provider);
      if (!validCheckout(checkout)) throw new Error('Invalid checkout');
      if (!mounted.current) { savePendingCheckout(userId, checkout); return; }
      savePendingCheckout(userId, checkout);
      setRevision((value) => value + 1);
      setPending(checkout);
      await openCheckout(checkout.checkoutUrl);
    } catch (err) {
      if (mounted.current) setError(errorMessage(err, 'Chưa mở được trang thanh toán. Nếu đã có mã đơn, bấm mở lại đơn đó.'));
    } finally {
      lock.current = false;
      if (mounted.current) setBusy(false);
    }
  }

  async function reopen() {
    if (!pending || lock.current) return;
    lock.current = true;
    setError(null);
    try { await openCheckout(pending.checkoutUrl); }
    catch { if (mounted.current) setError('Không mở được trình duyệt. Thử lại hoặc kiểm tra trạng thái đơn.'); }
    finally { lock.current = false; }
  }

  return {
    pending, busy, checking, paid, note, error, pay, reopen, sheetUrl, closeSheet,
    check: () => { setError(null); setRevision((value) => value + 1); },
  };
}
