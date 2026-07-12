import React, { useEffect, useRef } from "react";
import { toast } from "sonner";
import { VideoItem } from "../components/video-list/video-list.type";
import { VideoPlayerRef } from "../components/video-player/video-player";
import { Button } from "../components/ui/button";
import { X } from "lucide-react";

interface UseContinueToastProps {
  currentVideo: VideoItem | null;
  progress: Record<number, number>;
  videoPlayerRef: React.RefObject<VideoPlayerRef | null>;
}

/**
 * Hook to show a toast notification when a video has saved progress
 * Offers to continue from where the user left off
 */
export const useContinueToast = ({
  currentVideo,
  progress,
  videoPlayerRef,
}: UseContinueToastProps) => {
  const lastVideoIdRef = useRef<number | null>(null);
  const toastIdRef = useRef<string | number | null>(null);
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!currentVideo) {
      // Dismiss any existing toast when no video is selected
      if (toastIdRef.current) {
        toast.dismiss(toastIdRef.current);
        toastIdRef.current = null;
      }
      lastVideoIdRef.current = null;
      return;
    }

    // Don't show toast if it's the same video (to prevent re-showing)
    if (lastVideoIdRef.current === currentVideo.id) {
      return;
    }

    // Update last video ID immediately to prevent duplicate toasts
    lastVideoIdRef.current = currentVideo.id;

    // Dismiss any existing toast first
    if (toastIdRef.current) {
      toast.dismiss(toastIdRef.current);
      toastIdRef.current = null;
    }

    // Clear any existing timeout
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }

    // Only show toast if video has progress between 1% and 99%
    const videoProgress = progress[currentVideo.id];
    
    if (videoProgress && videoProgress > 1 && videoProgress < 99) {
      // Wait a bit for video to start loading before showing toast
      timeoutIdRef.current = setTimeout(() => {
        // Capture videoProgress in closure
        const savedProgress = videoProgress;
        
        // Show the continue toast with custom action buttons
        const toastId = toast.custom(
          (t) => (
            <div className="flex items-center gap-3 p-3  bg-popover border border-border shadow-lg">
              <span className="text-popover-foreground flex-1 text-sm">
                Continue where it left?
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={async () => {
                    const seekToPosition = async () => {
                      if (!videoPlayerRef.current) return;
                      
                      const start = Date.now();
                      const checkDuration = () => {
                        if (!videoPlayerRef.current) return;
                        const duration = videoPlayerRef.current.getDuration();
                        if (duration > 0) {
                          const seekTime = (savedProgress / 100) * duration;
                          videoPlayerRef.current.seekTo(seekTime);
                        } else if (Date.now() - start < 2000) {
                          setTimeout(checkDuration, 50);
                        }
                      };
                      checkDuration();
                    };

                    await seekToPosition();
                    toast.dismiss(t);
                    toastIdRef.current = null;
                  }}
                  className="h-8 px-3 text-xs"
                >
                  Continue
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    toast.dismiss(t);
                    toastIdRef.current = null;
                  }}
                  aria-label="Close"
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ),
          {
            duration: Infinity, // Don't auto-dismiss
            position: "bottom-left",
          }
        );

        toastIdRef.current = toastId;
      }, 500); // Delay to allow video to start loading
    }

    // Cleanup: dismiss toast and clear timeout when component unmounts or video changes
    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
      if (toastIdRef.current) {
        toast.dismiss(toastIdRef.current);
        toastIdRef.current = null;
      }
    };
  }, [currentVideo, progress, videoPlayerRef]);
};

