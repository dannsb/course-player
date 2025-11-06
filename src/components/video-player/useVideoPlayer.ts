import { useEffect, useRef } from "react";
import videojs from "video.js";
import type Player from "video.js/dist/types/player";
import "videojs-hotkeys";
import "videojs-theme-kit/style.css";
import "videojs-theme-kit/videojs-skin.min.js";

interface UseVideoPlayerProps {
  videoPath: string;
  onTimeUpdate: () => void;
  onEnded?: () => void;
}

export const useVideoPlayer = ({ videoPath, onTimeUpdate, onEnded }: UseVideoPlayerProps) => {
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Player | null>(null);
  const onTimeUpdateRef = useRef(onTimeUpdate);
  const onEndedRef = useRef(onEnded);
  const hasRestoredRef = useRef(false);
  const timeUpdateHandlerRef = useRef<(() => void) | null>(null);
  const endedHandlerRef = useRef<(() => void) | null>(null);

  // Update the refs when callbacks change
  useEffect(() => {
    onTimeUpdateRef.current = onTimeUpdate;
  }, [onTimeUpdate]);

  useEffect(() => {
    onEndedRef.current = onEnded;
  }, [onEnded]);

  useEffect(() => {
    // Make sure Video.js player is only initialized once
    if (!playerRef.current) {
      const videoElement = document.createElement("video-js");

      videoRef.current!.appendChild(videoElement);

      const player = (playerRef.current = videojs(
        videoElement,
        {
          controls: true,
          preload: "auto",
          fluid: true,
          playbackRates: [1, 1.25, 1.5, 2],
          responsive: true,
          sources: [{ src: videoPath, type: "video/mp4" }],
        },
      ));

      // Enable hotkeys and custom sleek theme
      player.ready(() => {
        //skin: 'slate', 'spaced', 'sleek', 'zen'
        (player as any).theme({skin:'sleek'}); 
        
        // Custom sleek modifications: remove rewind button, add playback rate
        const sleekBar = player.el().querySelector('.sleek-bar');
        if (sleekBar) {
          // Remove rewind button if exists
          const rewindBtn = sleekBar.querySelector('.vjs-rewind-button');
          if (rewindBtn) {
            rewindBtn.remove();
          }
          
          // Add playback rate control after hotkeys are set up
          setTimeout(() => {
            const controlBar = (player as any).controlBar;
            if (controlBar) {
              const playbackRateControl = controlBar.getChild('PlaybackRateMenuButton');
              if (playbackRateControl) {
                const spacer = sleekBar.querySelector('.vjs-custom-control-spacer');
                if (spacer) {
                  sleekBar.insertBefore(playbackRateControl.el(), spacer);
                }
              }
            }
          }, 100);
        }
        
        (player as any).hotkeys({
          volumeStep: 0.1,
          seekStep: 5,
          enableModifiersForNumbers: false,
          enableVolumeScroll: true,
          enableHoverScroll: true,
          enableFullscreen: true,
          enableNumbers: true,
          alwaysCaptureHotkeys: true,
        });
      });

      // Create and store the timeupdate handler
      const timeUpdateHandler = () => {
        onTimeUpdateRef.current();
      };
      timeUpdateHandlerRef.current = timeUpdateHandler;
      player.on("timeupdate", timeUpdateHandler);

      // Create and store the ended handler
      const endedHandler = () => {
        if (onEndedRef.current) {
          onEndedRef.current();
        }
      };
      endedHandlerRef.current = endedHandler;
      player.on("ended", endedHandler);

    } else {
      const player = playerRef.current;
      
      // Remove the old listeners before changing the video
      if (timeUpdateHandlerRef.current) {
        player.off("timeupdate", timeUpdateHandlerRef.current);
      }
      if (endedHandlerRef.current) {
        player.off("ended", endedHandlerRef.current);
      }
      
      // Update the video source
      player.src([{ src: videoPath, type: "video/mp4" }]);
      
      // Re-register the timeupdate listener with the current handler
      const timeUpdateHandler = () => {
        onTimeUpdateRef.current();
      };
      timeUpdateHandlerRef.current = timeUpdateHandler;
      player.on("timeupdate", timeUpdateHandler);

      // Re-register the ended listener with the current handler
      const endedHandler = () => {
        if (onEndedRef.current) {
          onEndedRef.current();
        }
      };
      endedHandlerRef.current = endedHandler;
      player.on("ended", endedHandler);
    }

    // Reset the restoration flag when video changes
    hasRestoredRef.current = false;
    
    // Cleanup function to remove the listeners when video changes or component unmounts
    return () => {
      if (playerRef.current) {
        if (timeUpdateHandlerRef.current) {
          playerRef.current.off("timeupdate", timeUpdateHandlerRef.current);
        }
        if (endedHandlerRef.current) {
          playerRef.current.off("ended", endedHandlerRef.current);
        }
      }
    };
  }, [videoPath]);


  useEffect(() => {
    const player = playerRef.current;

    return () => {
      if (player && !player.isDisposed()) {
        player.dispose();
        playerRef.current = null;
      }
    };
  }, []);

  return { videoRef, playerRef };
};