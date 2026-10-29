const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const exportsObj = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/features/tone/pcm.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, { exports: exportsObj, DataView, Float32Array, Math });
test('PCM 16-bit little-endian preserves signed audio amplitudes for tone analysis', () => {
  const data = new Uint8Array([0, 128, 0, 192, 0, 0, 0, 64, 255, 127]).buffer;
  const values = Array.from(exportsObj.pcm16ToFloat32(data));
  assert.deepEqual(values.slice(0, 4), [-1, -0.5, 0, 0.5]);
  assert.ok(values[4] > 0.999 && values[4] < 1);
});
