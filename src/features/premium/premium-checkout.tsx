import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, View, type ScrollViewInstance } from 'react-native';
import useSWR from 'swr';

import { AppText, Button, Card, ErrorNote, Icon, Loading, PageHeader, Screen } from '@/components/ui';
import { alpha } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { providerAvailable, type PaymentsConfigured } from '@/lib/payments';
import type { PaymentProvider, PremiumStatus } from '@/lib/types';

import { BENEFITS, durationLabel, money, validity } from './plans';
import { usePremiumCheckout } from './use-premium-checkout';

export function PremiumCheckout({ userId }: { userId: string }) {
  const theme = useTheme();
  const scrollRef = useRef<ScrollViewInstance>(null);
  const status = useSWR<PremiumStatus>('/premium/status');
  const configured = useSWR<PaymentsConfigured>('/payments/configured');
  const checkout = usePremiumCheckout(userId);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [picked, setPicked] = useState<PaymentProvider>('payos');
  const [confirming, setConfirming] = useState(false);
  const data = status.data;
  const plans = data?.plans ?? [];
  const selected = plans.find((plan) => plan.key === selectedKey) ?? plans.find((plan) => plan.badge) ?? plans[0];
  const provider = providerAvailable(configured.data, picked) ? picked
    : providerAvailable(configured.data, 'payos') ? 'payos' : 'momo';
  const available = providerAvailable(configured.data, provider);

  return (
    <Screen scrollRef={scrollRef} contentStyle={styles.page}>
      <PageHeader icon="crown" tone="accent" title={confirming ? 'Xác nhận gói Premium' : 'Hanni Premium'}
        description="Mở thêm tiện ích AI — mọi bài học vẫn miễn phí." />
      {checkout.note ? <Card><AppText color={checkout.paid ? 'good' : 'muted'}>{checkout.note}</AppText></Card> : null}
      {checkout.error && <ErrorNote>{checkout.error}</ErrorNote>}
      {checkout.pending ? (
        <Card>
          <AppText variant="heading">Đơn #{checkout.pending.orderCode}</AppText>
          <AppText color="muted">Đơn được giữ trên máy. Sau khi thanh toán, đóng trang thanh toán để quay lại Hanni; app sẽ kiểm tra với hệ thống.</AppText>
          <Button title="Mở lại trang thanh toán" onPress={() => void checkout.reopen()} />
          <Button title={checkout.checking ? 'Đang kiểm tra…' : 'Kiểm tra thanh toán'} variant="secondary"
            loading={checkout.checking} onPress={checkout.check} />
        </Card>
      ) : checkout.paid ? (
        <Button title="Về tài khoản" onPress={() => router.navigate('/account')} />
      ) : status.error ? (
        <ErrorNote>Chưa tải được gói Premium. <AppText onPress={() => void status.mutate()} color="primary">Thử lại</AppText></ErrorNote>
      ) : !data ? <Loading /> : data.lifetime ? (
        <Card><AppText variant="heading">Bạn đang dùng gói trọn đời</AppText><AppText color="muted">Tất cả quyền lợi Premium đã được mở, bạn không cần mua thêm.</AppText></Card>
      ) : (
        <>
          {!confirming ? (
            <>
              <Card>
                {BENEFITS.map((benefit) => <View key={benefit} style={styles.benefit}><Icon name="check" color="good" size={18} /><AppText style={styles.flex}>{benefit}</AppText></View>)}
                <AppText variant="caption" color="muted">9 cấp HSK, từ điển, ngữ pháp, ôn tập và đề thi thử đều có trong bản thường.</AppText>
              </Card>
              <AppText variant="heading">{data.active ? 'Gia hạn Premium' : 'Chọn gói'}</AppText>
              {plans.map((plan) => {
                const active = selected?.key === plan.key;
                return (
                  <Pressable key={plan.key} accessibilityRole="radio" accessibilityState={{ checked: active }}
                    onPress={() => setSelectedKey(plan.key)}
                    style={[styles.plan, { borderColor: active ? theme.accent : theme.border, backgroundColor: active ? alpha(theme.accent, 0.08) : theme.surface }]}>
                    <View style={styles.row}><AppText weight="700">{plan.name || durationLabel(plan)}</AppText><Icon name={active ? 'check' : 'clock'} color={active ? 'accent' : 'muted'} /></View>
                    <AppText variant="title">{money(plan.priceVnd)} <AppText color="muted">/ {durationLabel(plan)}</AppText></AppText>
                    {plan.originalPriceVnd && plan.originalPriceVnd > plan.priceVnd ? <AppText color="muted" style={styles.strike}>{money(plan.originalPriceVnd)}</AppText> : null}
                    {plan.badge ? <AppText color="accent" weight="700">{plan.badge}</AppText> : null}
                  </Pressable>
                );
              })}
              {plans.length === 0 && <AppText color="muted">Hiện chưa có gói mở bán.</AppText>}
            </>
          ) : selected ? (
            <Card>
              <AppText variant="heading">{selected.name || durationLabel(selected)}</AppText>
              <AppText variant="title">{money(selected.priceVnd)}</AppText>
              <AppText>{validity(selected, data)}</AppText>
              <AppText color="muted">Thanh toán một lần cho thời hạn đã chọn, không tự động trừ tiền gia hạn. Tiến độ học vẫn giữ nguyên khi hết hạn.</AppText>
              <AppText weight="700">Cách thanh toán</AppText>
              {(['payos', 'momo'] as const).map((method) => {
                const enabled = providerAvailable(configured.data, method);
                return <Button key={method} variant={provider === method && enabled ? 'primary' : 'secondary'} disabled={!enabled}
                  title={`${method === 'payos' ? 'Quét mã QR ngân hàng' : 'MoMo'}${enabled ? '' : ' · Sắp ra mắt'}`} onPress={() => setPicked(method)} />;
              })}
              <AppText color="muted">{provider === 'payos'
                ? 'Trang payOS hiện mã QR với số tiền đã điền sẵn. Dùng app ngân hàng hoặc MoMo để quét và xác nhận chuyển khoản.'
                : 'Trang MoMo sẽ hướng dẫn bạn chọn cách thanh toán và xác nhận giao dịch.'}</AppText>
              {provider === 'momo' && configured.data?.momoSandbox && <AppText color="warn">MoMo đang ở môi trường thử nghiệm.</AppText>}
              <AppText color="muted">Xong giao dịch, quay lại Hanni để kiểm tra đơn. Premium chỉ được cập nhật sau khi hệ thống xác nhận.</AppText>
            </Card>
          ) : null}
          {configured.error ? <ErrorNote>Chưa kiểm tra được cổng thanh toán. <AppText onPress={() => void configured.mutate()} color="primary">Thử lại</AppText></ErrorNote>
            : configured.isLoading ? <Loading /> : !available ? <AppText color="muted">Thanh toán đang chuẩn bị mở bán. Bạn vẫn học miễn phí đầy đủ các bài.</AppText> : null}
          {confirming && <Button title="Đổi gói" variant="secondary" disabled={checkout.busy} onPress={() => { setConfirming(false); scrollRef.current?.scrollTo({ y: 0, animated: false }); }} />}
          <Button title={checkout.busy ? 'Đang mở thanh toán…' : confirming ? `Thanh toán ${selected ? money(selected.priceVnd) : ''}` : 'Tiếp tục'}
            leftIcon="crown" loading={checkout.busy} disabled={!selected || !available}
            onPress={() => { if (confirming && selected) void checkout.pay(selected.key, provider); else { setConfirming(true); scrollRef.current?.scrollTo({ y: 0, animated: false }); } }} />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { gap: 18, paddingBottom: 48 },
  benefit: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  flex: { flex: 1 },
  plan: { padding: 18, borderWidth: 2, borderRadius: 16, gap: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  strike: { textDecorationLine: 'line-through' },
});
