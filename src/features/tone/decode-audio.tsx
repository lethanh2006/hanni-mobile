import { useRef, useSyncExternalStore } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { WEB_ORIGIN } from '@/lib/api';

export interface DecodedAudio {
  x: Float32Array;
  sr: number;
}

/**
 * Giải mã ghi âm chuẩn (MP3 ở `/media/audio`) ra mẫu PCM để vẽ đường cao độ giọng chuẩn. React Native không có bộ giải
 * mã MP3 cho JS nên nhờ một WebView ẩn làm đúng việc web làm (`decodeAudio` ở `lib/pitch.ts` của web: OfflineAudioContext
 * 16 kHz, trộn về 1 kênh). Gốc trang là web Hanni — server chỉ cho trang Hanni tải file audio (CORS).
 */
const HTML = `<!doctype html><html><body><script>
function send(m){window.ReactNativeWebView.postMessage(JSON.stringify(m))}
function b64(f){var u=new Uint8Array(f.buffer),s='';for(var i=0;i<u.length;i+=32768)s+=String.fromCharCode.apply(null,u.subarray(i,i+32768));return btoa(s)}
function context(){var C=window.OfflineAudioContext||window.webkitOfflineAudioContext;try{return new C(1,1,16000)}catch(e){return new C(1,1,22050)}}
window.decode=function(id,url){fetch(url).then(function(r){if(!r.ok)throw new Error(String(r.status));return r.arrayBuffer()})
.then(function(buf){var ctx=context();return new Promise(function(res,rej){var p=ctx.decodeAudioData(buf,res,rej);if(p&&p.then)p.then(res,rej)})})
.then(function(a){var x=new Float32Array(a.length);for(var c=0;c<a.numberOfChannels;c++){var ch=a.getChannelData(c);for(var i=0;i<ch.length;i++)x[i]+=ch[i]/a.numberOfChannels}
send({id:id,sr:a.sampleRate,data:b64(x)})}).catch(function(e){send({id:id,error:String(e)})})};
send({ready:true});
</script></body></html>`;

let seq = 0;
let inject: ((js: string) => void) | null = null;
const queue: string[] = [];
const waiting = new Map<number, { resolve: (a: DecodedAudio) => void; reject: (e: Error) => void }>();
let needed = false;
const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function toFloat32(base64: string): Float32Array {
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Float32Array(bytes.buffer);
}

export function decodeAudioUrl(url: string): Promise<DecodedAudio> {
  return new Promise((resolve, reject) => {
    const id = ++seq;
    waiting.set(id, { resolve, reject });
    const job = `window.decode(${id}, ${JSON.stringify(url)}); true;`;
    if (inject) inject(job);
    else {
      queue.push(job);
      if (!needed) {
        needed = true;
        listeners.forEach((l) => l());
      }
    }
    setTimeout(() => {
      if (!waiting.delete(id)) return;
      reject(new Error('timeout'));
    }, 20000);
  });
}

/** WebView ẩn làm bộ giải mã — gắn 1 lần ở gốc app, chỉ thật sự mở khi có yêu cầu giải mã đầu tiên. */
export function AudioDecoderHost() {
  const show = useSyncExternalStore(subscribe, () => needed, () => false);
  // `WebView<P = undefined>` của thư viện làm props thành `never` dưới TS 6 — truyền `object` để có đúng kiểu props.
  const webview = useRef<WebView<object>>(null);

  function onMessage(e: WebViewMessageEvent) {
    let m: { ready?: boolean; id?: number; sr?: number; data?: string; error?: string };
    try {
      m = JSON.parse(e.nativeEvent.data);
    } catch {
      return;
    }
    if (m.ready) {
      inject = (js) => webview.current?.injectJavaScript(js);
      queue.splice(0).forEach((job) => inject?.(job));
      return;
    }
    const job = m.id === undefined ? undefined : waiting.get(m.id);
    if (!job || m.id === undefined) return;
    waiting.delete(m.id);
    if (m.error || !m.data || !m.sr) job.reject(new Error(m.error ?? 'decode'));
    else job.resolve({ x: toFloat32(m.data), sr: m.sr });
  }

  if (!show) return null;
  return (
    <View style={styles.hidden} pointerEvents="none">
      <WebView<object>
        ref={webview}
        source={{ html: HTML, baseUrl: WEB_ORIGIN }}
        originWhitelist={['*']}
        onMessage={onMessage}
        onContentProcessDidTerminate={() => {
          inject = null;
          webview.current?.reload();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  hidden: { position: 'absolute', width: 1, height: 1, opacity: 0, left: -10, top: -10 },
});
