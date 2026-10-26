import { useEffect, useState } from 'react';

import { playClip, stopAudio } from '@/lib/audio';

/** Phát 1 từ để luyện nghe (`useWordAudio` của web): biết đang phát, đã nghe chưa, nguồn là bản thu hay giọng máy. */
export function useWordAudio(text: string, audioUrl: string | null | undefined) {
  const [playing, setPlaying] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);

  // Rời từ đang luyện thì dừng, khỏi đọc chồng sang từ khác.
  useEffect(() => () => stopAudio(), []);

  return {
    playing,
    hasPlayed,
    synthetic: !audioUrl,
    play(rate: number) {
      setPlaying(true);
      setHasPlayed(true);
      playClip(audioUrl, text, rate, () => setPlaying(false));
    },
    stop() {
      stopAudio();
      setPlaying(false);
    },
  };
}
