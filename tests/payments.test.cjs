const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(path, modules = {}) {
  const exports = {};
  const source = ts.transpileModule(fs.readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(source, { exports, require: (name) => modules[name], URL, setTimeout, clearTimeout });
  return exports;
}
const apiCalls = [];
const payments = load('src/lib/payments.ts', { './api': { api: {
  post: async (path, body) => { apiCalls.push({ path, body }); return {}; },
  get: async (path) => { apiCalls.push({ path }); return {}; },
} } });
const checkout = { orderCode: 123, checkoutUrl: 'https://pay.example.test/order/123', qrCode: null };

test('provider availability respects configured flags and legacy payOS response', () => {
  assert.equal(payments.providerAvailable({ configured: true }, 'payos'), true);
  assert.equal(payments.providerAvailable({ configured: true }, 'momo'), false);
  assert.equal(payments.providerAvailable({ configured: true, payos: false, momo: true }, 'payos'), false);
  assert.equal(payments.providerAvailable({ configured: true, momo: true }, 'momo'), true);
  assert.equal(payments.providerAvailable(undefined, 'payos'), false);
});
test('checkout uses the same server contract as web', async () => {
  await payments.createPremiumCheckout('year', 'momo');
  assert.equal(JSON.stringify(apiCalls.at(-1)), JSON.stringify({ path: '/payments/premium-checkout', body: { planKey: 'year', provider: 'momo' } }));
});
test('checkout URL and order ID must be valid before opening a browser', () => {
  assert.equal(payments.validCheckout(checkout), true);
  for (const url of ['javascript:alert(1)', 'http://pay.example.test', 'https://user:pass@pay.example.test']) {
    assert.equal(payments.validCheckout({ ...checkout, checkoutUrl: url }), false);
  }
  assert.equal(payments.validCheckout({ ...checkout, orderCode: -1 }), false);
});
test('pending orders are retried until server confirms PAID', async () => {
  const seen = [];
  let calls = 0;
  await payments.pollPaymentOrder(123, new AbortController().signal, (order) => seen.push(order.status), {
    delayMs: 0, get: async () => ({ orderCode: 123, status: ++calls === 3 ? 'PAID' : 'PENDING' }),
  });
  assert.deepEqual(seen, ['PENDING', 'PENDING', 'PAID']);
});
test('cancelled and expired orders stop polling without a success status', async () => {
  for (const status of ['CANCELLED', 'EXPIRED']) {
    const seen = [];
    await payments.pollPaymentOrder(123, new AbortController().signal, (order) => seen.push(order.status), {
      get: async () => ({ orderCode: 123, status }),
    });
    assert.deepEqual(seen, [status]);
  }
});
test('polling is bounded and rejects mismatched order IDs', async () => {
  let calls = 0;
  await payments.pollPaymentOrder(123, new AbortController().signal, () => {}, {
    delayMs: 0, get: async () => { calls++; return { orderCode: 123, status: 'PENDING' }; },
  });
  assert.equal(calls, 10);
  await assert.rejects(payments.pollPaymentOrder(123, new AbortController().signal, () => assert.fail(), {
    get: async () => ({ orderCode: 456, status: 'PAID' }),
  }));
});
test('aborted in-flight checks do not update a departed screen/account', async () => {
  const controller = new AbortController();
  await payments.pollPaymentOrder(123, controller.signal, () => assert.fail('late update'), {
    get: async () => { controller.abort(); return { orderCode: 123, status: 'PAID' }; },
  });
});
test('pending checkout survives reload and stays scoped to its owner', () => {
  const data = new Map();
  const pending = load('src/features/premium/pending-checkout.ts', {
    '@/lib/payments': payments,
    'expo-sqlite/kv-store': { __esModule: true, default: {
      getItemSync: (key) => data.get(key), setItemSync: (key, value) => data.set(key, value), removeItemSync: (key) => data.delete(key),
    } },
  });
  pending.savePendingCheckout('alice', checkout);
  assert.equal(pending.readPendingCheckout('alice').orderCode, 123);
  assert.equal(pending.readPendingCheckout('bob'), null);
  pending.savePendingCheckout('alice', null);
  assert.equal(pending.readPendingCheckout('alice'), null);
});
test('plan validity clamps end-of-month dates and extends existing subscriptions', () => {
  const plans = load('src/features/premium/plans.ts');
  const plan = { months: 1 };
  const status = { active: false, lifetime: false, until: null };
  assert.match(plans.validity(plan, status, new Date(2026, 0, 31)), /28\/2\/2026/);
  assert.match(plans.validity(plan, { ...status, active: true, until: '2026-03-31T12:00:00' }), /30\/4\/2026/);
  assert.match(plans.validity({ months: null }, status), /mãi mãi/);
});
