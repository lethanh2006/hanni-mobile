const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function setup() {
  const instances = [];
  class Audio {
    constructor(src) { this.src = src; instances.push(this); }
    play() { this.plays = (this.plays || 0) + 1; return Promise.resolve(); }
    pause() { this.paused = true; }
    removeAttribute() { this.src = ''; }
    load() {}
  }
  const exports = {};
  const speech = { stop() {}, speak() {} };
  const source = ts.transpileModule(fs.readFileSync('src/lib/audio.web.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(source, { exports, Audio, require: (name) => name === 'expo-speech' ? speech : { mediaUrl: (s) => s || null } });
  return { audio: exports, instances };
}

test('mẫu → ghi âm → nghe lại → mẫu đều phát đúng nguồn và dừng nguồn trước', () => {
  const { audio, instances } = setup();
  let ended = 0;
  audio.playClip('https://example.test/sample.mp3', '你好', 0.85, () => ended++);
  instances[0].onended();
  assert.equal(ended, 1);
  audio.playRecording('blob:recording');
  assert.equal(instances[0].paused, true);
  assert.equal(instances[1].src, 'blob:recording');
  audio.playWord('https://example.test/sample.mp3');
  assert.equal(instances[1].paused, true);
  assert.equal(instances[2].src, 'https://example.test/sample.mp3');
  assert.equal(instances[2].plays, 1);
});

test('bấm nghe lại từ đầu phát lại và không nhận callback từ nguồn cũ', () => {
  const { audio, instances } = setup();
  let oldDone = 0;
  audio.playClip('sample', '你好', 0.85, () => oldDone++);
  const stale = instances[0].onended;
  audio.playClip('sample', '你好', 0.85, () => {});
  stale();
  assert.equal(oldDone, 0);
  assert.equal(instances[1].plays, 1);
  assert.equal(instances[0].paused, true);
});

test('lỗi phát bản ghi được báo một lần', async () => {
  const { audio, instances } = setup();
  let errors = 0;
  audio.playRecording('blob:recording', () => errors++);
  const fail = instances[0].onerror;
  fail(); fail();
  assert.equal(errors, 1);
});
