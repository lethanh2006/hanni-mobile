import { forwardRef, useEffect, useId, useImperativeHandle, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Svg, { ClipPath, Defs, G, Path } from 'react-native-svg';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { AppText } from '@/components/ui';
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
export function writerHtml(char: string, size: number, colors: Record<'text' | 'primary' | 'border' | 'good', string>) {
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
window.acceptStroke=function(points){var svg=document.querySelector('#w svg');if(!svg||!points.length)return;var r=svg.getBoundingClientRect();function fire(target,type,p){target.dispatchEvent(new MouseEvent(type,{bubbles:true,cancelable:true,clientX:r.left+p[0],clientY:r.top+p[1]}));}fire(svg,'mousedown',points[0]);points.slice(1).forEach(function(p){fire(svg,'mousemove',p)});fire(document,'mouseup',points[points.length-1]);};
</script></body></html>`;
}

/** Khung luyện viết 1 chữ. Đổi chữ thì đặt `key={chữ}` để dựng lại khung. */
export const HanziWriterView = forwardRef<HanziWriterHandle, { char: string; size: number; onEvent: (e: WriterEvent) => void }>(
  function HanziWriterView({ char, size, onEvent }, ref) {
    const theme = useTheme();
    // `WebView<P = undefined>` của thư viện làm props thành `never` dưới TS 6 — truyền `object` để có đúng kiểu props.
    const webview = useRef<WebView<object>>(null);
    const [mode, setMode] = useState<WriterMode>('watch');
    const [paths, setPaths] = useState<string[] | null>(null);
    const [loadFailed, setLoadFailed] = useState(false);
    const [drawn, setDrawn] = useState<number[][][]>([]);
    const [current, setCurrent] = useState<number[][]>([]);
    const currentRef = useRef<number[][]>([]);
    const modeRef = useRef<WriterMode>('watch');
    const clipId = `hanzi-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;

    useEffect(() => {
      let cancelled = false;
      fetch(`${WEB_ORIGIN}/hanzi-strokes/${encodeURIComponent(char)}.json`)
        .then((response) => { if (!response.ok) throw new Error('load'); return response.json(); })
        .then((data: { strokes?: unknown }) => {
          if (!Array.isArray(data.strokes) || !data.strokes.length || !data.strokes.every((p) => typeof p === 'string')) throw new Error('data');
          if (!cancelled) setPaths(data.strokes as string[]);
        })
        .catch(() => { if (!cancelled) setLoadFailed(true); });
      return () => { cancelled = true; };
    }, [char]);

    const point = (x: number, y: number) => [Math.max(0, Math.min(size, x)), Math.max(0, Math.min(size, y))];
    const pan = usePanGesture({
      minDistance: 0,
      runOnJS: true,
      onBegin: (e) => { currentRef.current = [point(e.x, e.y)]; setCurrent(currentRef.current); },
      onUpdate: (e) => {
        if (!currentRef.current.length) return;
        const next = point(e.x, e.y);
        const last = currentRef.current[currentRef.current.length - 1];
        if (Math.hypot(next[0] - last[0], next[1] - last[1]) < 1) return;
        currentRef.current = [...currentRef.current, next];
        setCurrent(currentRef.current);
      },
      onFinalize: (e) => {
        const stroke = currentRef.current;
        currentRef.current = [];
        setCurrent([]);
        if (e.canceled || !stroke.length || modeRef.current === 'watch') return;
        setDrawn((previous) => [...previous, stroke]);
        // Hanzi Writer vẫn kiểm tra thứ tự và hình dạng nét, còn lớp native hiện mực ngay khi vuốt.
        webview.current?.injectJavaScript(`window.acceptStroke && window.acceptStroke(${JSON.stringify(stroke)}); true;`);
      },
    });
    const scale = (size - 32) / 1024;
    const transform = `translate(16 ${size - 16 - 124 * scale}) scale(${scale} ${-scale})`;
    const asPath = (stroke: number[][]) => stroke.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ') + (stroke.length === 1 ? ' l0.1 0' : '');

    useImperativeHandle(ref, () => ({
      run: (next) => { modeRef.current = next; setMode(next); setDrawn([]); setCurrent([]); currentRef.current = []; webview.current?.injectJavaScript(`window.runMode && window.runMode('${next}'); true;`); },
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
        <View pointerEvents={mode === 'watch' ? 'auto' : 'none'} style={[StyleSheet.absoluteFill, mode !== 'watch' && { opacity: 0 }]}>
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
        {mode !== 'watch' && (mode === 'test' || paths) && (
          <GestureDetector gesture={pan}>
            <View accessibilityLabel={mode === 'trace' ? 'Tô chữ mẫu bằng ngón tay' : 'Tự viết chữ bằng ngón tay'} style={{ width: size, height: size }}>
              <Svg width={size} height={size} pointerEvents="none">
                {mode === 'trace' && paths && <Defs><ClipPath id={clipId}><G transform={transform}>{paths.map((d, i) => <Path key={i} d={d} />)}</G></ClipPath></Defs>}
                {mode === 'trace' && paths && <G transform={transform}>{paths.map((d, i) => <Path key={i} d={d} fill={theme.border} />)}</G>}
                <G clipPath={mode === 'trace' ? `url(#${clipId})` : undefined}>
                  {[...drawn, ...(current.length ? [current] : [])].map((stroke, i) => <Path key={i} d={asPath(stroke)} fill="none" stroke={mode === 'trace' ? theme.primary : theme.text} strokeWidth={mode === 'trace' ? 24 : 6} strokeLinecap="round" strokeLinejoin="round" />)}
                </G>
              </Svg>
            </View>
          </GestureDetector>
        )}
        {mode === 'trace' && !paths && <View style={styles.wait}>{loadFailed ? <AppText color="danger" center>Chưa tải được nét mẫu. Kiểm tra mạng và mở lại chữ này.</AppText> : <ActivityIndicator />}</View>}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  box: { borderWidth: 1, borderRadius: Radius.lg, overflow: 'hidden', alignSelf: 'center' },
  web: { backgroundColor: 'transparent' },
  wait: { flex: 1, justifyContent: 'center', padding: 12 },
});
