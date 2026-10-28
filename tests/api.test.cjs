const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const source = ts.transpileModule(fs.readFileSync('src/lib/api.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function loadApi(fetch, extra = {}) {
  const exports = {};
  vm.runInNewContext(source, {
    exports, require: () => ({ Platform: { OS: 'android' } }),
    process: { env: { EXPO_PUBLIC_API_URL: ' https://example.test/api/// ' } },
    __DEV__: true, fetch, AbortController, setTimeout, clearTimeout, ...extra,
  });
  return exports;
}
const reply = (data, status = 200) => new Response(JSON.stringify(data), { status });

test('native API normalizes the base URL and sends session cookies', async () => {
  const api = loadApi(async (url, options) => {
    assert.equal(url, 'https://example.test/api/auth/session');
    assert.equal(options.credentials, 'include');
    return reply({ user: null });
  });
  assert.equal((await api.api.get('/auth/session')).user, null);
});

test('concurrent unauthorized requests share one refresh and retry', async () => {
  let refreshed = false;
  let refreshes = 0;
  const api = loadApi(async (url) => {
    if (url.endsWith('/auth/refresh')) {
      refreshes++;
      await new Promise((resolve) => setTimeout(resolve, 10));
      refreshed = true;
      return reply({ ok: true });
    }
    return reply(refreshed ? { ok: true } : { message: 'expired' }, refreshed ? 200 : 401);
  });
  const results = await Promise.all([api.api.get('/a'), api.api.get('/b')]);
  assert.equal(refreshes, 1);
  assert.ok(results.every((r) => r.ok));
});

test('a stalled startup request aborts with a readable timeout', async () => {
  const api = loadApi((url, { signal }) => new Promise((resolve, reject) => {
    signal.addEventListener('abort', () => reject(new Error('aborted')));
  }), { setTimeout: (callback) => setTimeout(callback, 5) });
  await assert.rejects(api.api.get('/auth/session'), (err) => err.status === 408 && err.message.includes('Kết nối quá lâu'));
});

test('upload preserves multipart body and retries after refresh', async () => {
  const form = new FormData();
  form.append('image', 'test');
  let attempts = 0;
  const api = loadApi(async (url, options) => {
    if (url.endsWith('/auth/refresh')) return reply({ ok: true });
    attempts++;
    assert.equal(options.body, form);
    assert.equal(options.headers, undefined);
    return reply(attempts === 1 ? { message: 'expired' } : { ok: true }, attempts === 1 ? 401 : 200);
  });
  assert.equal((await api.api.upload('/scan', form)).ok, true);
  assert.equal(attempts, 2);
});
