const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function setup(pending) {
  const data = new Map();
  let calls = 0;
  const storage = {
    setItemSync: (k, v) => data.set(k, v),
    getItemSync: (k) => data.get(k) ?? null,
    removeItemSync: (k) => data.delete(k),
  };
  const exports = {};
  const source = ts.transpileModule(fs.readFileSync('src/features/scan/pending-image.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(source, { exports, require: (name) => {
    if (name === 'expo-image-picker') return { getPendingResultAsync: async () => { calls++; return pending; } };
    if (name === 'expo-sqlite/kv-store') return storage;
    if (name === 'react-native') return { Platform: { OS: 'android' } };
    throw new Error(name);
  } });
  return { scan: exports, data, calls: () => calls };
}

test('recovers a scan photo once after Android recreates the app', async () => {
  const asset = { uri: 'file:///camera.jpg', width: 1200, height: 800 };
  const { scan, data, calls } = setup({ canceled: false, assets: [asset] });
  scan.markScanPickerPending();
  assert.equal(await scan.recoverScanPicker(), true);
  assert.equal(scan.takeRecoveredScanImage(), asset);
  assert.equal(scan.takeRecoveredScanImage(), null);
  assert.equal(data.size, 0);
  assert.equal(await scan.recoverScanPicker(), false);
  assert.equal(calls(), 1);
});

test('does not consume another picker result without a scan marker', async () => {
  const { scan, calls } = setup({ canceled: false, assets: [{ uri: 'file:///avatar.jpg' }] });
  assert.equal(await scan.recoverScanPicker(), false);
  assert.equal(calls(), 0);
});

test('ignores stale and cancelled picker results', async () => {
  const old = setup(null);
  old.data.set('hanni-scan-picker-pending', String(Date.now() - 11 * 60 * 1000));
  assert.equal(await old.scan.recoverScanPicker(), false);
  assert.equal(old.calls(), 0);
  assert.equal(old.data.size, 0);
  const canceled = setup({ canceled: true, assets: null });
  canceled.scan.markScanPickerPending();
  assert.equal(await canceled.scan.recoverScanPicker(), false);
  assert.equal(canceled.data.size, 0);
});
