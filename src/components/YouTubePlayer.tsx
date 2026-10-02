import { useEffect, useRef, useState } from 'react';
import { usePlayer } from '../store/player';
import { useSettings } from '../store/settings';
import { useUI } from '../store/ui';

let ytApiLoaded = false;
let ytApiPromise: Promise<void> | null = null;

function loadYtApi() {
  if (ytApiLoaded) return Promise.resolve();
  if (ytApiPromise) return ytApiPromise;
  ytApiPromise = new Promise((resolve) => {
    (window as any).onYouTubeIframeAPIReady = () => {
      ytApiLoaded = true;
      resolve();
    };
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    document.body.appendChild(script);
  });
  return ytApiPromise;
}

export function YouTubePlayer() {
  const [isReady, setIsReady] = useState(false);
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const currentQidRef = useRef<string | null>(null);

  const current = usePlayer((s) => s.current());
  const isPlaying = usePlayer((s) => s.isPlaying);
  const position = usePlayer((s) => s.position);
  const volume = usePlayer((s) => s.volume);
  const muted = usePlayer((s) => s.muted);
  const isYoutube = current?.provider === 'youtube';

  const baseVol = () => {
    const norm = useSettings.getState().normalization ? 0.92 : 1;
    return (muted ? 0 : volume) * norm * 100;
  };

  useEffect(() => {
    loadYtApi().then(() => {
      if (!containerRef.current || playerRef.current) return;
      playerRef.current = new (window as any).YT.Player(containerRef.current, {
        height: '100%',
        width: '100%',
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          rel: 0,
          iv_load_policy: 3,
          playsinline: 1,
        },
        events: {
          onReady: (e: any) => {
            e.target.setVolume(baseVol());
            setIsReady(true);
          },
          onStateChange: (e: any) => {
            const YT = (window as any).YT;
            if (e.data === YT.PlayerState.ENDED) {
              const p = usePlayer.getState();
              if (p.repeat === 'one') {
                e.target.seekTo(0);
                e.target.playVideo();
              } else {
                p.advance(true);
              }
            }
          },
          onError: () => {
            useUI.getState().toast({ title: 'Playback failed', sub: 'YouTube blocked this stream.', kind: 'error' });
            usePlayer.getState().advance(true);
          }
        },
      });
    });
  }, []);

  // Sync track
  useEffect(() => {
    if (!isReady) return;
    if (!isYoutube || !current) {
      if (playerRef.current?.stopVideo) {
         playerRef.current.stopVideo();
         currentQidRef.current = null;
      }
      return;
    }
    const vid = current.id.replace('ytv:', '');
    if (currentQidRef.current !== current.qid) {
      currentQidRef.current = current.qid;
      if (playerRef.current?.loadVideoById) {
        playerRef.current.loadVideoById(vid);
        if (!isPlaying) playerRef.current.pauseVideo();
      }
    }
  }, [current, isYoutube, isPlaying, isReady]);

  // Sync play/pause
  useEffect(() => {
    if (!isReady || !isYoutube || !playerRef.current?.playVideo) return;
    if (isPlaying) playerRef.current.playVideo();
    else playerRef.current.pauseVideo();
  }, [isPlaying, isYoutube, isReady]);

  // Sync volume
  useEffect(() => {
    if (!playerRef.current?.setVolume) return;
    playerRef.current.setVolume(baseVol());
  }, [volume, muted]);

  // Sync seek
  useEffect(() => {
    if (!isYoutube || !playerRef.current?.getCurrentTime) return;
    const ct = playerRef.current.getCurrentTime() || 0;
    if (Math.abs(ct - position) > 2) {
      playerRef.current.seekTo(position, true);
    }
  }, [position, isYoutube]);

  const videoMode = useUI((s) => s.videoMode);
  const npOpen = useUI((s) => s.npOpen);
  const showVideo = videoMode && npOpen && isYoutube;

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (!isYoutube || !playerRef.current?.getCurrentTime || !isPlaying) return;
      const ct = playerRef.current.getCurrentTime() || 0;
      const dur = playerRef.current.getDuration() || 0;
      const p = usePlayer.getState();
      if (Math.abs(ct - p.position) > 0.5) p.setPosition(ct);
      if (dur > 0 && Math.abs(dur - p.duration) > 0.5) p.setDuration(dur);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [isYoutube, isPlaying]);

  return (
    <div 
      className={showVideo 
        ? "fixed inset-x-0 top-0 bottom-[160px] z-[85] pointer-events-none flex items-center justify-center p-6 lg:p-12 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300"
        : "hidden"
      }
      aria-hidden={!showVideo}
    >
      <div className={showVideo ? "w-full max-w-5xl aspect-video rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10" : ""}>
        <div className="w-full h-full scale-[1.35] pointer-events-none select-none">
          <div ref={containerRef} />
        </div>
      </div>
    </div>
  );
}
