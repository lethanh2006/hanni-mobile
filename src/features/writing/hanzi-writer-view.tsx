import { forwardRef, useImperativeHandle, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { WEB_ORIGIN } from '@/lib/api';

export type WriterMode = 'watch' | 'trace' | 'test';

export type WriterEvent =
  | { type: 'ready'; strokes: number }
  | { type: 'error' }
  | { type: 'mistake' }
  | { type: 'correct' }
  | { type: 'done'; mistakes: number };

export interface HanziWriterHandle {
  run: (mode: WriterMode) => void;
}

/**
 * Trang HTML nhỏ chạy thư viện hanzi-writer (MIT) — vẽ thứ tự nét và chấm nét người dùng tô.
 * Dữ liệu nét lấy từ web Hanni (`/hanzi-strokes/<chữ>.json`, 3.088 chữ HSK, giấy phép Arphic).
 */
function writerHtml(char: string, size: number, colors: Record<'text' | 'primary' | 'border' | 'good', string>) {
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no">
<style>html,body{margin:0;background:transparent;overflow:hidden}#w{width:${size}px;height:${size}px}</style>
<script src="https://cdn.jsdelivr.net/npm/hanzi-writer@3.7.3/dist/hanzi-writer.min.js"></script></head>
<body><div id="w"></div><script>
var send=function(m){window.ReactNativeWebView.postMessage(JSON.stringify(m))};
var writer=HanziWriter.create('w',${JSON.stringify(char)},{width:${size},height:${size},padding:16,
strokeAnimationSpeed:1,delayBetweenStrokes:250,strokeColor:'${colors.text}',radicalColor:'${colors.primary}',
outlineColor:'${colors.border}',highlightColor:'${colors.primary}',drawingColor:'${colors.good}',
charDataLoader:function(c,onLoad,onError){fetch('${WEB_ORIGIN}/hanzi-strokes/'+encodeURIComponent(c)+'.json')
.then(function(r){if(!r.ok)throw new Error();return r.json()}).then(onLoad).catch(onError)},
onLoadCharDataSuccess:function(d){send({type:'ready',strokes:d.strokes.length})},
onLoadCharDataError:function(){send({type:'error'})}});
var quizOpts={onMistake:function(){send({type:'mistake'})},onCorrectStroke:function(){send({type:'correct'})},
onComplete:function(r){send({type:'done',mistakes:r.totalMistakes})}};
window.runMode=function(mode){writer.cancelQuiz();
if(mode==='watch'){writer.hideOutline({duration:0});writer.showCharacter({duration:0});writer.animateCharacter();return}
writer.hideCharacter({duration:0});
if(mode==='trace'){writer.showOutline({duration:0});writer.quiz(quizOpts);return}
writer.hideOutline({duration:0});writer.quiz(Object.assign({showHintAfterMisses:false},quizOpts))};
</script></body></html>`;
}

/** Khung luyện viết 1 chữ. Đổi chữ thì đặt `key={chữ}` để dựng lại khung. */
export const HanziWriterView = forwardRef<HanziWriterHandle, { char: string; size: number; onEvent: (e: WriterEvent) => void }>(
  function HanziWriterView({ char, size, onEvent }, ref) {
    const theme = useTheme();
    // `WebView<P = undefined>` của thư viện làm props thành `never` dưới TS 6 — truyền `object` để có đúng kiểu props.
    const webview = useRef<WebView<object>>(null);

    useImperativeHandle(ref, () => ({
      run: (mode) => webview.current?.injectJavaScript(`window.runMode && window.runMode('${mode}'); true;`),
    }));

    function onMessage(e: WebViewMessageEvent) {
      try {
        onEvent(JSON.parse(e.nativeEvent.data) as WriterEvent);
      } catch {
        // Bỏ qua tin nhắn lạ.
      }
    }

    return (
      <View style={[styles.box, { width: size, height: size, borderColor: theme.border, backgroundColor: theme.surface }]}>
        <WebView<object>
          ref={webview}
          source={{
            html: writerHtml(char, size, { text: theme.text, primary: theme.primary, border: theme.border, good: theme.good }),
          }}
          originWhitelist={['*']}
          onMessage={onMessage}
          scrollEnabled={false}
          style={styles.web}
        />
      </View>
    );
  },
);

const styles = StyleSheet.create({
  box: { borderWidth: 1, borderRadius: Radius.lg, overflow: 'hidden', alignSelf: 'center' },
  web: { backgroundColor: 'transparent' },
});
