import { useImperativeHandle, forwardRef, useState, useEffect, useRef } from "react";
import { IVideoPlayer } from "./video-player.type";
import { useVideoPlayer } from "./useVideoPlayer";
import { isPersian } from "../../utils/persian-text";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { ChevronDown, ChevronLeft, ChevronRight, Play, Pause, Volume1, Volume2, VolumeX, Maximize, RotateCcw, RotateCw } from "lucide-react";
import { Button } from "../ui/button";

export interface VideoPlayerRef {
  seekTo: (time: number) => void;
  pause: () => void;
  getDuration: () => number;
  getCurrentTime: () => number;
}

const formatTime = (timeInSeconds: number) => {
  if (isNaN(timeInSeconds)) return "0:00";
  const m = Math.floor(timeInSeconds / 60);
  const s = Math.floor(timeInSeconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

const VideoPlayer = forwardRef<VideoPlayerRef, IVideoPlayer>(({
  videoPath,
  title,
  onTimeUpdate,
  onEnded,
  initialNote = "",
  onNoteChange,
  onPrev,
  onNext,
  hasPrev = false,
  hasNext = false,
}, ref) => {
  const { 
    videoRef, 
    playerRef,
    isPlaying,
    currentTime,
    duration,
    volume,
    playbackRate,
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
  } = useVideoPlayer({ videoPath, onTimeUpdate, onEnded });

  const [note, setNote] = useState(initialNote);
  const notesRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  
  const [showControls, setShowControls] = useState(true);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const hideControlsTimeout = useRef<NodeJS.Timeout | null>(null);

  // Tooltip state
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPosition, setHoverPosition] = useState<number>(0);

  const handleMouseMove = () => {
    setShowControls(true);
    if (hideControlsTimeout.current) clearTimeout(hideControlsTimeout.current);
    if (isPlaying && !showSpeedMenu) {
      hideControlsTimeout.current = setTimeout(() => setShowControls(false), 2500);
    }
  };

  useEffect(() => {
    if (!isPlaying || showSpeedMenu) {
      setShowControls(true);
      if (hideControlsTimeout.current) clearTimeout(hideControlsTimeout.current);
    } else {
      hideControlsTimeout.current = setTimeout(() => setShowControls(false), 2500);
    }
    return () => {
      if (hideControlsTimeout.current) clearTimeout(hideControlsTimeout.current);
    };
  }, [isPlaying, showSpeedMenu]);

  const hasPersianText = isPersian(note);

  useEffect(() => {
    const timer = setTimeout(() => onNoteChange(note), 500);
    return () => clearTimeout(timer);
  }, [note, onNoteChange]);

  useEffect(() => {
    setNote(initialNote);
  }, [initialNote]);

  const scrollToNotes = () => {
    notesRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useImperativeHandle(ref, () => ({
    seekTo: (time: number) => playerRef.current.currentTime(time),
    pause: () => playerRef.current.pause(),
    getDuration: () => playerRef.current.duration(),
    getCurrentTime: () => playerRef.current.currentTime(),
  }));

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  
  const handleProgressMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percent = x / rect.width;
    setHoverPosition(percent * 100);
    setHoverTime(percent * duration);
  };

  const speedOptions = [0.5, 0.75, 1, 1.25, 1.5, 2];

  return (
    <div className="flex-1 bg-background flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col min-h-full">
          <div className="flex flex-col items-center justify-center min-h-screen relative">
            {hasPrev && onPrev && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onPrev}
                className="absolute left-[calc(10%-56px)] top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 hover:bg-background text-foreground opacity-60 hover:opacity-100 transition-all z-10"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
            )}
            
            <div 
              ref={containerRef}
              className="w-4/5 relative group bg-black rounded-xl overflow-hidden shadow-[0_0_20px_rgb(var(--foreground)/0.15)] flex flex-col justify-center"
              onMouseMove={handleMouseMove}
              onMouseLeave={() => isPlaying && !showSpeedMenu && setShowControls(false)}
            >
              <video 
                ref={videoRef} 
                className="w-full h-auto max-h-[85vh] object-contain cursor-pointer"
                onClick={togglePlay}
              />

              {/* Volume Indicator Overlay */}
              <div className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300 z-20 ${volumeIndicator?.visible ? 'opacity-100' : 'opacity-0'}`}>
                <div key={volumeIndicator?.id} className="bg-black/50 backdrop-blur-md rounded-full w-16 h-16 flex flex-col items-center justify-center transform transition-transform animate-in zoom-in-90 duration-200">
                  {volumeIndicator?.volume === 0 ? <VolumeX className="w-8 h-8 text-white" /> : 
                   volumeIndicator?.volume <= 0.5 ? <Volume1 className="w-8 h-8 text-white" /> : 
                   <Volume2 className="w-8 h-8 text-white" />}
                </div>
              </div>

              {/* Seek Indicator Overlay */}
              <div className={`absolute inset-0 flex items-center ${seekIndicator?.amount > 0 ? 'justify-end pr-24' : 'justify-start pl-24'} pointer-events-none transition-opacity duration-300 z-20 ${seekIndicator?.visible ? 'opacity-100' : 'opacity-0'}`}>
                <div key={seekIndicator?.id} className="bg-black/50 backdrop-blur-md rounded-full px-5 py-3 flex items-center justify-center transform transition-transform animate-in zoom-in-90 duration-200 text-white font-bold text-xl tracking-wider">
                  {seekIndicator?.amount > 0 ? (
                    <>{`+ ${seekIndicator.amount}`} <ChevronRight className="w-6 h-6 ml-1 opacity-70" /></>
                  ) : (
                    <><ChevronLeft className="w-6 h-6 mr-1 opacity-70" /> {`- ${Math.abs(seekIndicator?.amount)}`}</>
                  )}
                </div>
              </div>
              
              {/* Premium Glassmorphic Control Bar */}
              <div 
                className={`absolute bottom-0 left-0 right-0 p-4 pt-12 bg-gradient-to-t from-black/80 via-black/40 to-transparent transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}
              >
                {/* Scrub Bar */}
                <div 
                  ref={progressBarRef}
                  className="relative w-full h-1.5 bg-white/20 rounded-full mb-4 group/slider cursor-pointer"
                  onMouseMove={handleProgressMouseMove}
                  onMouseLeave={() => setHoverTime(null)}
                >
                  <input 
                    type="range"
                    min="0"
                    max={duration || 100}
                    step="0.01"
                    value={currentTime}
                    onMouseDown={handleScrubStart}
                    onMouseUp={(e) => handleScrubEnd(Number(e.currentTarget.value))}
                    onChange={(e) => handleSeek(Number(e.target.value))}
                    className="absolute top-0 left-0 w-full h-full cursor-pointer appearance-none outline-none bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow [&::-webkit-slider-thumb]:scale-0 group-hover/slider:[&::-webkit-slider-thumb]:scale-100 [&::-webkit-slider-thumb]:transition-transform"
                    style={{ background: `linear-gradient(to right, #ffffff ${progressPercent}%, transparent ${progressPercent}%)` }}
                  />
                  {/* Hover Tooltip */}
                  {hoverTime !== null && (
                    <div 
                      className="absolute bottom-4 -translate-x-1/2 px-2 py-1 bg-black/90 text-white text-xs font-mono rounded shadow-lg pointer-events-none"
                      style={{ left: `${hoverPosition}%` }}
                    >
                      {formatTime(hoverTime)}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center gap-4">
                    <button onClick={togglePlay} className="hover:text-white/80 transition-colors outline-none rounded-full p-1">
                      {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
                    </button>

                    <div className="relative group/rewind flex items-center justify-center">
                      <button onClick={() => { handleSeek(Math.max(0, currentTime - 10)); showSeekIndicator(-10); }} className="text-white opacity-70 hover:opacity-100 transition-opacity outline-none rounded-full p-1">
                        <RotateCcw className="w-5 h-5" />
                      </button>
                      <div className="absolute bottom-full mb-2 opacity-0 group-hover/rewind:opacity-100 transition-opacity bg-black/90 text-white text-xs font-mono rounded px-2 py-1 pointer-events-none whitespace-nowrap">
                        Rewind 10s
                      </div>
                    </div>
                    
                    <div className="relative group/forward flex items-center justify-center">
                      <button onClick={() => { handleSeek(Math.min(duration, currentTime + 10)); showSeekIndicator(10); }} className="text-white opacity-70 hover:opacity-100 transition-opacity outline-none rounded-full p-1">
                        <RotateCw className="w-5 h-5" />
                      </button>
                      <div className="absolute bottom-full mb-2 opacity-0 group-hover/forward:opacity-100 transition-opacity bg-black/90 text-white text-xs font-mono rounded px-2 py-1 pointer-events-none whitespace-nowrap">
                        Forward 10s
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 group/volume relative ml-2">
                      <button onClick={() => handleVolumeChange(volume > 0 ? 0 : 0.8)} className="hover:text-white/80 transition-colors outline-none rounded-full p-1 z-10 relative">
                        {volume === 0 ? <VolumeX className="w-5 h-5" /> : 
                         volume <= 0.5 ? <Volume1 className="w-5 h-5" /> : 
                         <Volume2 className="w-5 h-5" />}
                      </button>
                      <div className="w-0 overflow-hidden group-hover/volume:w-24 transition-all duration-300 ease-out flex items-center">
                        <input 
                          type="range" 
                          min="0" max="1" step="0.01"
                          value={volume}
                          onChange={(e) => handleVolumeChange(Number(e.target.value))}
                          className="w-20 h-1 rounded-full appearance-none outline-none cursor-pointer mx-2 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:scale-0 group-hover/volume:[&::-webkit-slider-thumb]:scale-100 [&::-webkit-slider-thumb]:transition-transform"
                          style={{ background: `linear-gradient(to right, #ffffff ${volume * 100}%, rgba(255,255,255,0.3) ${volume * 100}%)` }}
                        />
                      </div>
                    </div>

                    <div className="text-sm font-medium font-mono tabular-nums opacity-90 tracking-wide ml-2">
                      {formatTime(currentTime)} <span className="opacity-50 mx-1">/</span> {formatTime(duration)}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <button 
                        onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                        className="text-sm font-bold text-white hover:text-white/80 transition-colors px-2 py-1 rounded-md"
                      >
                        {playbackRate}x
                      </button>
                      {showSpeedMenu && (
                        <div className="absolute bottom-full right-0 mb-2 py-2 bg-black/80 backdrop-blur-xl border border-white/10 rounded-lg shadow-2xl flex flex-col gap-1 w-24 animate-in fade-in slide-in-from-bottom-2">
                          {speedOptions.map((rate) => (
                            <button
                              key={rate}
                              onClick={() => {
                                handlePlaybackRateChange(rate);
                                setShowSpeedMenu(false);
                              }}
                              className={`px-4 py-1.5 text-sm font-medium transition-colors text-left ${rate === playbackRate ? 'bg-white/20 text-white' : 'text-white/80 hover:bg-white/10'}`}
                            >
                              {rate}x
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <button onClick={() => toggleFullscreen(containerRef)} className="hover:text-white/80 transition-colors outline-none rounded-full p-1">
                      <Maximize className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {hasNext && onNext && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onNext}
                className="absolute right-[calc(10%-56px)] top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 hover:bg-background text-foreground opacity-60 hover:opacity-100 transition-all z-10"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={scrollToNotes}
              className="absolute bottom-8 animate-bounce rounded-full bg-background/50 hover:bg-background/80"
            >
              <ChevronDown className="h-6 w-6" />
            </Button>
          </div>

          <div ref={notesRef} className="min-h-screen bg-muted/30 p-8 flex flex-col items-center justify-center">
            <div className="w-full max-w-3xl space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="notes" className="text-lg font-semibold">
                  Notes for {title}
                </Label>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">
                  Auto-saves
                </span>
              </div>
              <Textarea
                id="notes"
                placeholder="Take your notes here... They will be automatically saved."
                className={`min-h-[400px] text-base resize-none shadow-sm ${
                  hasPersianText ? "rtl font-vazir" : "ltr"
                }`}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                dir={hasPersianText ? "rtl" : "ltr"}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

VideoPlayer.displayName = "VideoPlayer";
export default VideoPlayer;
