// Learn more https://docs.expo.dev/guides/customizing-metro
const http = require('http');
const https = require('https');
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// expo-sqlite trên web chạy SQLite bằng WebAssembly (dùng cho "tra gần đây", bài thi làm dở).
config.resolver.assetExts.push('wasm');

const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'https://hanni-api.dangpham.id.vn/api').replace(/\/$/, '');
const SERVER_ORIGIN = API_URL.replace(/\/api$/, '');

/**
 * Bản web chạy ở localhost bị server API chặn CORS (server chỉ cho web Hanni thật), nên khi dev
 * `lib/api.ts` gọi `/api/...` cùng origin và Metro chuyển tiếp sang server. Tab Network vẫn xem đủ.
 * Bỏ Origin để server coi như request từ app; bỏ Domain của cookie để trình duyệt lưu cho localhost.
 */
function proxyApi(req, res) {
  // `/media/...` (ghi âm chuẩn để chấm thanh điệu) cũng bị chặn CORS như API.
  const target = new URL(req.url.startsWith('/media/') ? SERVER_ORIGIN + req.url : API_URL + req.url.slice('/api'.length));
  const headers = { ...req.headers, host: target.host };
  delete headers.origin;
  delete headers.referer;

  const client = target.protocol === 'https:' ? https : http;
  const upstream = client.request(target, { method: req.method, headers }, (up) => {
    const cookies = up.headers['set-cookie'];
    if (cookies) up.headers['set-cookie'] = cookies.map((c) => c.replace(/;\s*domain=[^;]*/i, ''));
    res.writeHead(up.statusCode ?? 502, up.headers);
    up.pipe(res);
  });
  upstream.on('error', (err) => {
    res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(`Proxy tới ${API_URL} lỗi: ${err.message}`);
  });
  req.pipe(upstream);
}

config.server.enhanceMiddleware = (middleware) => {
  return (req, res, next) => {
    if (req.url?.startsWith('/api/') || req.url?.startsWith('/media/')) return proxyApi(req, res);
    // Header COEP + COOP để trình duyệt cho dùng SharedArrayBuffer (kv-store đọc/ghi đồng bộ cần cái này).
    res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    middleware(req, res, next);
  };
};

module.exports = config;
