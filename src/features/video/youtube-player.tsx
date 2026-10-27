import { useImperativeHandle, useRef, type Ref } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { WEB_ORIGIN } from '@/lib/api';

export interface YoutubePlayerHandle {
  /** Tua tới giây `s` rồi phát. */
  seek: (s: number) => void;
}

/**
 * Trang nhỏ chạy YouTube IFrame API: báo thời gian đang phát ~4 lần/giây, nhận lệnh tua. Gốc trang là web Hanni
 * (`baseUrl`) — YouTube từ chối phát khi trang nhúng không có nguồn hợp lệ.
 */
function playerHtml(youtubeId: string) {
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no">
<style>html,body{margin:0;height:100%;background:#000;overflow:hidden}#p{width:100%;height:100%}</style></head>
<body><div id="p"></div><script>
var player,last=-1;
function send(m){window.ReactNativeWebView.postMessage(JSON.stringify(m))}
function onYouTubeIframeAPIReady(){
player=new YT.Player('p',{videoId:${JSON.stringify(youtubeId)},playerVars:{rel:0,modestbranding:1,playsinline:1},
events:{onReady:function(){send({type:'ready',duration:player.getDuration()})}}});
setInterval(function(){try{var t=player.getCurrentTime();if(typeof t==='number'&&t!==last){last=t;send({type:'time',t:t})}}catch(e){}},250);}
window.seek=function(s){if(player&&player.seekTo){player.seekTo(s,true);player.playVideo()}};
</script><script src="https://www.youtube.com/iframe_api"></script></body></html>`;
}

/** Nhúng YouTube 16:9 (`YoutubePlayer` của web). `onTick` nhận thời gian hiện tại (giây). */
export function YoutubePlayer({
  youtubeId,
  onTick,
  ref,
}: {
  youtubeId: string;
  onTick?: (seconds: number) => void;
  ref?: Ref<YoutubePlayerHandle>;
}) {
  // `WebView<P = undefined>` của thư viện làm props thành `never` dưới TS 6 — truyền `object` để có đúng kiểu props.
  const webview = useRef<WebView<object>>(null);

  useImperativeHandle(ref, () => ({
    seek: (s) => webview.current?.injectJavaScript(`window.seek && window.seek(${Number(s) || 0}); true;`),
  }));

  function onMessage(e: WebViewMessageEvent) {
    try {
      const m = JSON.parse(e.nativeEvent.data) as { type: string; t?: number };
      if (m.type === 'time' && typeof m.t === 'number') onTick?.(m.t);
    } catch {
      // Bỏ qua tin nhắn lạ.
    }
  }

  return (
    <View style={styles.frame}>
      <WebView<object>
        ref={webview}
        source={{ html: playerHtml(youtubeId), baseUrl: WEB_ORIGIN }}
        originWhitelist={['*']}
        onMessage={onMessage}
        allowsInlineMediaPlayback
        allowsFullscreenVideo
        mediaPlaybackRequiresUserAction={false}
        scrollEnabled={false}
        style={styles.web}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { width: '100%', aspectRatio: 16 / 9, overflow: 'hidden', backgroundColor: '#000000' },
  web: { flex: 1, backgroundColor: '#000000' },
});
