const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function setup() {
  const players = [];
  const expo = { createAudioPlayer(uri) {
    const p = { uri, play() { this.played = true; }, pause() { this.paused = true; }, remove() { this.removed = true; },
      setPlaybackRate(rate) { this.rate = rate; }, addListener(_, cb) { this.callback = cb; return { remove: () => { this.callback = null; } }; } };
    players.push(p); return p;
  } };
  const speech = { stop() {}, speak() {} };
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/audio.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, { exports, require: (name) => name === 'expo-audio' ? expo : name === 'expo-speech' ? speech : { mediaUrl: (v) => v } });
  return { audio: exports, players };
}
test('Android sample, recorded WAV, sample replay use fresh players', () => {
  const { audio, players } = setup();
  audio.playClip('sample.mp3', '你好', 0.85, () => {});
  audio.stopAudio();
  audio.playRecording('file:///voice.wav');
  audio.playWord('sample.mp3');
  assert.equal(players.length, 3);
  assert.equal(players[0].removed, true);
  assert.equal(players[1].removed, true);
  assert.equal(players[1].uri, 'file:///voice.wav');
  assert.equal(players[2].uri, 'sample.mp3');
  assert.equal(players[2].played, true);
});
test('native playback failure reports error once and stops listener', () => {
  const { audio, players } = setup();
  let failures = 0;
  audio.playRecording('file:///voice.wav', () => failures++);
  const callback = players[0].callback;
  callback({ error: 'failed' });
  assert.equal(failures, 1);
  assert.equal(players[0].callback, null);
});
