const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const source = ts.transpileModule(fs.readFileSync('src/features/study/use-review-session.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

// Harness tối thiểu cho state/ref của hook; các request giữ nguyên bất đồng bộ.
async function session(api, kind = { kind: 'due' }, suspendWord = async () => {}) {
  const slots = [];
  let index = 0;
  let mounted = false;
  let effect;
  const react = {
    useState(initial) {
      const key = index++;
      if (!(key in slots)) slots[key] = initial;
      return [slots[key], (value) => { slots[key] = typeof value === 'function' ? value(slots[key]) : value; }];
    },
    useRef(initial) {
      const key = index++;
      if (!(key in slots)) slots[key] = { current: initial };
      return slots[key];
    },
    useEffect(callback) { if (!mounted) effect = callback; },
  };
  const exports = {};
  vm.runInNewContext(source, {
    exports,
    require(name) {
      if (name === 'react') return react;
      if (name === 'swr') return { mutate: () => {} };
      if (name === '@/lib/api') return { api };
      if (name === '@/lib/hooks') return { suspendWord };
      throw new Error(name);
    },
  });
  function render() { index = 0; return exports.useReviewSession(kind); }
  render();
  mounted = true;
  effect();
  await new Promise(setImmediate);
  return render;
}

test('review uses current endpoints and prevents duplicate ratings before rerender', async () => {
  const calls = [];
  let complete;
  const render = await session({
    get: async (path) => { calls.push(path); return { due: [{ word: { id: 'w1' } }], newCards: [] }; },
    post: (path, body) => {
      calls.push({ path, body });
      return new Promise((resolve) => { complete = resolve; });
    },
  });
  const screen = render();
  assert.equal(screen.phase, 'intro');
  const first = screen.rate('GOOD', 1200);
  await screen.rate('EASY', 1200);
  assert.equal(calls.length, 2);
  assert.equal(calls[1].path, '/study/review');
  assert.equal(JSON.stringify(calls[1].body), JSON.stringify({ wordId: 'w1', rating: 'GOOD', durationMs: 1200 }));
  complete({ isCorrect: true });
  await first;
  assert.equal(render().phase, 'done');
  assert.equal(render().correct, 1);
  assert.equal(calls.length, 2); // không mở/đóng session đã bị server gỡ
});

test('lesson flashcards include words not due yet without duplicating due words', async () => {
  const render = await session({
    get: async (path) => path.startsWith('/study/queue')
      ? { due: [{ word: { id: 'w1' } }], newCards: [] }
      : { words: [{ id: 'w1' }, { id: 'w2', progressState: 'LEARNING' }] },
  }, { kind: 'lesson', lessonId: 'l1' });
  assert.equal(render().items.map((item) => item.word.id).join(','), 'w1,w2');
});

test('a failed review unlocks the card for retry', async () => {
  let attempts = 0;
  const render = await session({
    get: async () => ({ due: [{ word: { id: 'w1' } }], newCards: [] }),
    post: async () => { if (++attempts === 1) throw new Error('offline'); return { isCorrect: true }; },
  });
  await render().rate('GOOD', 500);
  assert.ok(render().error);
  await render().rate('GOOD', 500);
  assert.equal(render().phase, 'done');
  assert.equal(attempts, 2);
});
