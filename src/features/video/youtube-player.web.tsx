import { useEffect, useImperativeHandle, useRef, type Ref } from 'react';
import { StyleSheet, View } from 'react-native';

import type { YoutubePlayerHandle } from './youtube-player';

export type { YoutubePlayerHandle } from './youtube-player';

interface YTPlayer {
  seekTo: (s: number, allow: boolean) => void;
  playVideo: () => void;
  getCurrentTime: () => number;
  destroy: () => void;
}
type YTGlobal = { Player: new (el: HTMLElement, opts: Record<string, unknown>) => YTPlayer };
type YTWindow = Window & { YT?: YTGlobal; onYouTubeIframeAPIReady?: () => void };

let apiPromise: Promise<void> | null = null;
function loadApi(): Promise<void> {
  const w = window as YTWindow;
  if (w.YT?.Player) return Promise.resolve();
  apiPromise ??= new Promise<void>((resolve) => {
    const prev = w.onYouTubeIframeAPIReady;
    w.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    const s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(s);
  });
  return apiPromise;
}

/**
 * Bản web của khung YouTube (khi chạy app trên trình duyệt) — giống `YoutubePlayer` của hanni-client. Khung iframe gắn
 * `credentialless` vì máy chủ dev bật COEP (cần cho SQLite trên web), thiếu thì trình duyệt chặn khung YouTube.
 */
export function YoutubePlayer({
  youtubeId,
  onTick,
  ref,
}: {
  youtubeId: string;
  onTick?: (seconds: number) => void;
  ref?: Ref<YoutubePlayerHandle>;
}) {
  const host = useRef<HTMLDivElement>(null);
  const player = useRef<YTPlayer | null>(null);
  const tick = useRef(onTick);
  useEffect(() => {
    tick.current = onTick;
  });

  useImperativeHandle(ref, () => ({
    seek: (s) => {
      // Player chưa sẵn sàng thì chưa có các hàm điều khiển.
      if (typeof player.current?.seekTo !== 'function') return;
      player.current.seekTo(s, true);
      player.current.playVideo();
    },
  }));

  useEffect(() => {
    const box = host.current;
    if (!box) return;
    // Tạo khung bằng tay để gắn `credentialless` TRƯỚC khi khung tải trang.
    const frame = document.createElement('iframe');
    frame.setAttribute('credentialless', '');
    frame.title = 'YouTube';
    frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    frame.style.cssText = 'width:100%;height:100%;border:0';
    frame.src = `https://www.youtube.com/embed/${youtubeId}?enablejsapi=1&rel=0&modestbranding=1&playsinline=1&origin=${encodeURIComponent(window.location.origin)}`;
    box.appendChild(frame);
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;
    void loadApi().then(() => {
      const YT = (window as YTWindow).YT;
      if (cancelled || !YT) return;
      player.current = new YT.Player(frame, {});
      timer = setInterval(() => {
        try {
          const t = player.current?.getCurrentTime?.();
          if (typeof t === 'number') tick.current?.(t);
        } catch {
          // chưa sẵn sàng
        }
      }, 250);
    });
    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      try {
        player.current?.destroy();
      } catch {
        // đã gỡ
      }
      player.current = null;
      frame.remove();
    };
  }, [youtubeId]);

  return (
    <View style={styles.frame}>
      <div ref={host} style={{ width: '100%', height: '100%' }} />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { width: '100%', aspectRatio: 16 / 9, overflow: 'hidden', backgroundColor: '#000000' },
});
