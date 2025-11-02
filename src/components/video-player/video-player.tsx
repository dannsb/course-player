import { useImperativeHandle, forwardRef } from "react";
import { IVideoPlayer } from "./video-player.type";
import "video.js/dist/video-js.css";
import { useVideoPlayer } from "./useVideoPlayer";
import { isPersian } from "../../utils/persian-text";

export interface VideoPlayerRef {
  seekTo: (time: number) => void;
  pause: () => void;
}

const VideoPlayer = forwardRef<VideoPlayerRef, IVideoPlayer>(({
  videoPath,
  title,
  onTimeUpdate,
  initialProgress,
}, ref) => {
  const { videoRef, playerRef } = useVideoPlayer({ videoPath, onTimeUpdate, initialProgress });

  useImperativeHandle(ref, () => ({
    seekTo: (time: number) => {
      if (playerRef.current && !playerRef.current.isDisposed()) {
        playerRef.current.currentTime(time);
      }
    },
    pause: () => {
      if (playerRef.current && !playerRef.current.isDisposed()) {
        playerRef.current.pause();
      }
    },
  }));

  return (
    <div className="flex-1 bg-background flex flex-col items-center justify-center">
      <div data-vjs-player className="w-4/5">
        <div ref={videoRef} className="rounded-xl overflow-hidden shadow-[0_0_20px_rgb(var(--foreground)/0.15)]" />
      </div>
      <h3 className="text-white mt-3 text-xl" dir={isPersian(title) ? "rtl" : "ltr"}>{title}</h3>
    </div>
  );
});

VideoPlayer.displayName = "VideoPlayer";

export default VideoPlayer;

