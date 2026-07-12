import { useEffect, useRef, useState, RefObject } from "react";
import { getMediaUrl } from "../../utils/electron";

interface UseVideoPlayerProps {
  videoPath: string;
  onTimeUpdate: () => void;
  onEnded?: () => void;
}



const VOLUME_KEY = "video_player_volume";
const SPEED_STORAGE_KEY = "video_player_speed";

const getSavedVolume = (): number => {
  const saved = localStorage.getItem(VOLUME_KEY);
  return saved ? Math.min(1, Math.max(0, parseFloat(saved))) : 0.8;
};

const getSavedSpeed = (): number => {
  const saved = localStorage.getItem(SPEED_STORAGE_KEY);
  if (saved) {
    const parsed = parseFloat(saved);
    if ([0.5, 0.75, 1, 1.25, 1.5, 2].includes(parsed)) return parsed;
  }
  return 1;
};

export interface NativePlayerRef {
  currentTime: (time?: number) => number;
  pause: () => void;
  play: () => void;
  duration: () => number;
  isDisposed: () => boolean;
}

export const useVideoPlayer = ({ videoPath, onTimeUpdate, onEnded }: UseVideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(getSavedVolume());
  const [playbackRate, setPlaybackRateState] = useState(getSavedSpeed());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isScrubbing, setIsScrubbing] = useState(false);
  
  // Indicator states
  const [volumeIndicator, setVolumeIndicator] = useState({ visible: false, volume: 1, id: 0 });
  const [seekIndicator, setSeekIndicator] = useState({ visible: false, amount: 0, id: 0 });
  const volumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const seekTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const onTimeUpdateRef = useRef(onTimeUpdate);
  const onEndedRef = useRef(onEnded);

  // Update refs
  useEffect(() => { onTimeUpdateRef.current = onTimeUpdate; }, [onTimeUpdate]);
  useEffect(() => { onEndedRef.current = onEnded; }, [onEnded]);

  // Handle source changes natively
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.src = getMediaUrl(videoPath);
      videoRef.current.load();
      videoRef.current.volume = getSavedVolume();
      videoRef.current.playbackRate = getSavedSpeed();
      setIsPlaying(false);
    }
  }, [videoPath]);

  // Video Event Listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      // Avoid overriding scrubbed time when user is dragging the slider
      if (!isScrubbing) {
        setCurrentTime(video.currentTime);
      }
      onTimeUpdateRef.current();
    };

    const handleDurationChange = () => setDuration(video.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      if (onEndedRef.current) onEndedRef.current();
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleDurationChange);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleDurationChange);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
    };
  }, [isScrubbing]);

  // Fullscreen listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Controls
  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) videoRef.current.play();
      else videoRef.current.pause();
    }
  };

  const handleSeek = (time: number) => {
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const handleScrubStart = () => setIsScrubbing(true);
  const handleScrubEnd = (time: number) => {
    setIsScrubbing(false);
    handleSeek(time);
  };

  const handleVolumeChange = (newVolume: number) => {
    const clamped = Math.min(1, Math.max(0, newVolume));
    setVolumeState(clamped);
    if (videoRef.current) videoRef.current.volume = clamped;
    localStorage.setItem(VOLUME_KEY, String(clamped));
  };

  const handlePlaybackRateChange = (rate: number) => {
    setPlaybackRateState(rate);
    if (videoRef.current) videoRef.current.playbackRate = rate;
    localStorage.setItem(SPEED_STORAGE_KEY, String(rate));
  };

  const toggleFullscreen = (containerRef: RefObject<HTMLElement | null>) => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const showVolumeIndicator = (vol: number) => {
    setVolumeIndicator({ visible: true, volume: vol, id: Date.now() });
    if (volumeTimeoutRef.current) clearTimeout(volumeTimeoutRef.current);
    volumeTimeoutRef.current = setTimeout(() => {
      setVolumeIndicator(prev => ({ ...prev, visible: false }));
    }, 800);
  };

  const showSeekIndicator = (amount: number) => {
    setSeekIndicator(prev => {
      // If opposite direction, reset accumulation. Otherwise, add.
      const isSameDirection = Math.sign(prev.amount) === Math.sign(amount) || prev.amount === 0;
      const newAmount = (prev.visible && isSameDirection) ? prev.amount + amount : amount;
      
      if (seekTimeoutRef.current) clearTimeout(seekTimeoutRef.current);
      seekTimeoutRef.current = setTimeout(() => {
        setSeekIndicator(p => ({ ...p, visible: false }));
      }, 800);
      
      return { visible: true, amount: newAmount, id: Date.now() };
    });
  };

  // Global Hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input/textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      const video = videoRef.current;
      if (!video) return;

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'arrowright':
          e.preventDefault();
          handleSeek(Math.min(video.duration, video.currentTime + 10));
          showSeekIndicator(10);
          break;
        case 'arrowleft':
          e.preventDefault();
          handleSeek(Math.max(0, video.currentTime - 10));
          showSeekIndicator(-10);
          break;
        case 'arrowup':
          e.preventDefault();
          const volUp = Math.min(1, volume + 0.1);
          handleVolumeChange(volUp);
          showVolumeIndicator(volUp);
          break;
        case 'arrowdown':
          e.preventDefault();
          const volDown = Math.max(0, volume - 0.1);
          handleVolumeChange(volDown);
          showVolumeIndicator(volDown);
          break;
        case 'm':
          e.preventDefault();
          if (video.volume > 0) handleVolumeChange(0);
          else handleVolumeChange(getSavedVolume());
          break;
        case 'f':
          e.preventDefault();
          if (video.parentElement) toggleFullscreen({ current: video.parentElement });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [volume]);

  // Compatibility object for external parent components
  const playerRef = useRef<NativePlayerRef>({
    currentTime: (time?: number) => {
      if (time !== undefined) {
        handleSeek(time);
        return time;
      }
      return videoRef.current?.currentTime || 0;
    },
    pause: () => {
      videoRef.current?.pause();
    },
    play: () => {
      videoRef.current?.play();
    },
    duration: () => {
      return videoRef.current?.duration || 0;
    },
    isDisposed: () => false,
  });

  return { 
    videoRef, 
    playerRef,
    isPlaying,
    currentTime,
    duration,
    volume,
    playbackRate,
    isFullscreen,
    volumeIndicator,
    seekIndicator,
    togglePlay,
    handleSeek,
    handleScrubStart,
    handleScrubEnd,
    handleVolumeChange,
    handlePlaybackRateChange,
    toggleFullscreen,
    showSeekIndicator
  };
};