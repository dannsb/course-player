import { useImperativeHandle, forwardRef, useState, useEffect, useRef } from "react";
import { IVideoPlayer } from "./video-player.type";
import "video.js/dist/video-js.css";
import { useVideoPlayer } from "./useVideoPlayer";
import { isPersian } from "../../utils/persian-text";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { ChevronDown } from "lucide-react";

export interface VideoPlayerRef {
  seekTo: (time: number) => void;
  pause: () => void;
}

const VideoPlayer = forwardRef<VideoPlayerRef, IVideoPlayer>(({
  videoPath,
  title,
  onTimeUpdate,
  initialProgress,
  initialNote = "",
  onNoteChange,
}, ref) => {
  const { videoRef, playerRef } = useVideoPlayer({ videoPath, onTimeUpdate, initialProgress });
  const [note, setNote] = useState(initialNote);
  const notesRef = useRef<HTMLDivElement>(null);

  // Detect if note contains Persian text
  const hasPersianText = isPersian(note);

  // Debounce note changes
  useEffect(() => {
    const timer = setTimeout(() => {
      onNoteChange(note);
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [note, onNoteChange]);

  // Update note when initialNote changes (when switching videos)
  useEffect(() => {
    setNote(initialNote);
  }, [initialNote]);

  const scrollToNotes = () => {
    notesRef.current?.scrollIntoView({ behavior: "smooth" });
  };

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
    <div className="flex-1 bg-background flex flex-col overflow-hidden">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col min-h-full">
          <div className="flex flex-col items-center justify-center min-h-screen">
            <div data-vjs-player className="w-4/5">
              <div ref={videoRef} className="rounded-xl overflow-hidden shadow-[0_0_20px_rgb(var(--foreground)/0.15)]" />
            </div>
            <h3 className="text-white mt-3 text-xl" dir={isPersian(title) ? "rtl" : "ltr"}>{title}</h3>
            
            <div className="w-4/5 mt-8">
              <button
                onClick={scrollToNotes}
                className="ml-auto mr-0 flex items-center gap-2 text-white hover:text-white/80 transition-colors cursor-pointer"
              >
                <Label className="text-base cursor-pointer">Notes</Label>
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Note Section  */}
          <div ref={notesRef} className="w-4/5 mx-auto mb-16 mt-8">
            <Label htmlFor="note">Notes</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add your notes here..."
              className="mt-2"
              rows={12}
              dir={hasPersianText ? "rtl" : "ltr"}
            />
          </div>
        </div>
      </div>
    </div>
  );
});

VideoPlayer.displayName = "VideoPlayer";

export default VideoPlayer;

