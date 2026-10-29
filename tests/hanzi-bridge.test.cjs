const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const exportsObj = {};
const react = { forwardRef: (fn) => fn };
const source = ts.transpileModule(fs.readFileSync('src/features/writing/hanzi-writer-view.tsx', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
vm.runInNewContext(source, { exports: exportsObj, require: (name) => {
  if (name === 'react') return react;
  if (name === 'react-native') return { StyleSheet: { create: (s) => s } };
  if (name === '@/constants/theme') return { Radius: { lg: 12 } };
  if (name === '@/lib/api') return { WEB_ORIGIN: 'https://example.test' };
  return {};
} });

test('native stroke is forwarded to the existing Hanzi Writer quiz in order', () => {
  const html = exportsObj.writerHtml('你', 280, { text: '#000', primary: '#f00', border: '#ccc', good: '#090' });
  const script = html.match(/<body><div id="w"><\/div><script>([\s\S]*?)<\/script>/)[1];
  const events = [];
  const svg = { getBoundingClientRect: () => ({ left: 4, top: 6 }), dispatchEvent: (e) => events.push(e) };
  const document = { querySelector: () => svg, dispatchEvent: (e) => events.push(e) };
  const writer = { cancelQuiz() {}, hideCharacter() {}, showOutline() {}, hideOutline() {}, quiz() {} };
  class MouseEvent { constructor(type, opts) { this.type = type; Object.assign(this, opts); } }
  const window = { ReactNativeWebView: { postMessage() {} } };
  vm.runInNewContext(script, { window, document, MouseEvent, HanziWriter: { create: () => writer }, fetch() {} });
  window.runMode('test');
  window.acceptStroke([[10, 20], [20, 30], [30, 40]]);
  assert.equal(events.map((e) => e.type).join(','), 'mousedown,mousemove,mousemove,mouseup');
  assert.equal(events[0].clientX, 14);
  assert.equal(events.at(-1).clientY, 46);
});
