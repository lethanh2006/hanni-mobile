const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function setup() {
  const calls = [];
  let onBuffer;
  const stream = {
    start: async () => calls.push('start'),
    startFileRecordingAsync: async () => calls.push('file-start'),
    stopFileRecordingAsync: async () => { calls.push('file-stop'); return { uri: 'file:///voice.wav' }; },
    stop: () => calls.push('stop'),
  };
  const expo = {
    requestRecordingPermissionsAsync: async () => ({ granted: true }),
    setAudioModeAsync: async (mode) => calls.push({ ...mode }),
    useAudioStream: (options) => { onBuffer = options.onBuffer; return { stream }; },
  };
  const exports = {};
  const source = ts.transpileModule(fs.readFileSync('src/features/tone/voice-recorder.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(source, { exports, Float32Array, Date, Math, require: (name) => {
    if (name === 'expo-audio') return expo;
    if (name === 'react') return { useRef: (value) => ({ current: value }) };
    if (name === '@/lib/audio') return { stopAudio: () => calls.push('audio-stop') };
    if (name === './pcm') return { pcm16ToFloat32: () => new Float32Array([0.1, 0.2]) };
    throw new Error(name);
  } });
  return { recorder: exports.useVoiceRecorder(), calls, push: () => onBuffer({ data: [], sampleRate: 16000 }) };
}

test('finishes WAV and releases microphone before restoring playback mode', async () => {
  const { recorder, calls, push } = setup();
  await recorder.start(() => {});
  push();
  const voice = await recorder.stop();
  assert.equal(voice.uri, 'file:///voice.wav');
  assert.equal(calls.indexOf('file-stop') < calls.indexOf('stop'), true);
  const mode = calls.at(-1);
  assert.equal(calls.at(-2), 'stop');
  assert.equal(mode.allowsRecording, false);
  assert.equal(mode.playsInSilentMode, true);
  assert.equal(mode.shouldRouteThroughEarpiece, false);
});
