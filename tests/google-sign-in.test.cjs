const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const WEB = '977963570920-h0qat6jqr0j309m1326blhmu7516g0rj.apps.googleusercontent.com';
const IOS = 'test-ios.apps.googleusercontent.com';

function setup({ platform = 'android', web = WEB, ios, response, error } = {}) {
  const calls = { configure: [], playServices: 0, signOut: 0 };
  const lib = {
    GoogleSignin: {
      configure: (options) => calls.configure.push(options),
      hasPlayServices: async () => { calls.playServices++; },
      signIn: async () => {
        if (error) throw error;
        return response ?? { type: 'success', data: { idToken: 'google-id-token' } };
      },
      signOut: async () => { calls.signOut++; },
    },
    isSuccessResponse: (res) => res.type === 'success',
    isErrorWithCode: (err) => typeof err.code === 'string',
    statusCodes: { SIGN_IN_CANCELLED: 'cancelled', IN_PROGRESS: 'busy', PLAY_SERVICES_NOT_AVAILABLE: 'no-services' },
  };
  const exportsObj = {};
  const source = fs.readFileSync('src/features/auth/google-sign-in.ts', 'utf8');
  vm.runInNewContext(ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, {
    exports: exportsObj,
    process: { env: { EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: web, EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID: ios } },
    require: (name) => {
      if (name === 'react-native') return { Platform: { OS: platform } };
      if (name === '@react-native-google-signin/google-signin') return lib;
      throw new Error(`Unexpected module ${name}`);
    },
  });
  return { ...exportsObj, calls };
}

test('Android requests an ID token using the Web server client ID, then clears the Google session', async () => {
  const auth = setup();
  assert.equal(auth.googleSignInEnabled, true);
  assert.equal(await auth.getGoogleIdToken(), 'google-id-token');
  assert.equal(auth.calls.configure[0].webClientId, WEB);
  assert.equal(auth.calls.playServices, 1);
  assert.equal(auth.calls.signOut, 1);
});

test('iOS requires its own client ID and does not call Google Play Services', async () => {
  assert.equal(setup({ platform: 'ios' }).googleSignInEnabled, false);
  const auth = setup({ platform: 'ios', ios: IOS });
  assert.equal(auth.googleSignInEnabled, true);
  assert.equal(await auth.getGoogleIdToken(), 'google-id-token');
  assert.equal(auth.calls.configure[0].iosClientId, IOS);
  assert.equal(auth.calls.playServices, 0);
});

test('missing configuration and missing idToken cannot complete Google login', async () => {
  const disabled = setup({ web: ' ' });
  assert.equal(disabled.googleSignInEnabled, false);
  await assert.rejects(disabled.getGoogleIdToken(), /chưa được cấu hình/);
  await assert.rejects(setup({ response: { type: 'success', data: {} } }).getGoogleIdToken(), /thất bại/);
});

test('closing the account picker cancels login without an error', async () => {
  assert.equal(await setup({ response: { type: 'cancelled' } }).getGoogleIdToken(), null);
  assert.equal(await setup({ error: { code: 'cancelled' } }).getGoogleIdToken(), null);
});

test('Android configuration and Play Services errors provide actionable messages', async () => {
  await assert.rejects(setup({ error: { code: '10' } }).getGoogleIdToken(), /chưa được cấu hình/);
  await assert.rejects(setup({ error: { code: 'no-services' } }).getGoogleIdToken(), /Google Play Services/);
});

test('iOS build config registers the reverse client ID URL scheme only when configured', () => {
  const source = fs.readFileSync('app.config.js', 'utf8');
  function configFor(ios) {
    const module = { exports: {} };
    vm.runInNewContext(source, { module, process: { env: { EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID: ios } } });
    return module.exports({ config: { plugins: ['expo-router'] } });
  }
  assert.equal(configFor().plugins.length, 1);
  const config = configFor(IOS);
  assert.equal(config.plugins[1][0], '@react-native-google-signin/google-signin');
  assert.equal(config.plugins[1][1].iosUrlScheme, 'com.googleusercontent.apps.test-ios');
});
