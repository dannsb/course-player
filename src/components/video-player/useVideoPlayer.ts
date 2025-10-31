import { useEffect, useRef } from "react";
import videojs from "video.js";
import type Player from "video.js/dist/types/player";

interface UseVideoPlayerProps {
  videoPath: string;
  onTimeUpdate: () => void;
  initialProgress?: number;
}

export const useVideoPlayer = ({ videoPath, onTimeUpdate, initialProgress }: UseVideoPlayerProps) => {
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Player | null>(null);
  const onTimeUpdateRef = useRef(onTimeUpdate);
  const hasRestoredRef = useRef(false);

  // Update the ref when onTimeUpdate changes
  useEffect(() => {
    onTimeUpdateRef.current = onTimeUpdate;
  }, [onTimeUpdate]);

  useEffect(() => {
    // Make sure Video.js player is only initialized once
    if (!playerRef.current) {
      const videoElement = document.createElement("video-js");

      videoElement.classList.add("vjs-big-play-centered");
      videoRef.current!.appendChild(videoElement);

      const player = (playerRef.current = videojs(
        videoElement,
        {
          controls: true,
          preload: "auto",
          fluid: true,
          playbackRates: [1, 1.25, 1.5, 2],
          sources: [{ src: videoPath, type: "video/mp4" }],
        },
      ));

      player.on("timeupdate", () => {
        onTimeUpdateRef.current();
      });

    } else {
      const player = playerRef.current;
      player.src([{ src: videoPath, type: "video/mp4" }]);
    }

    // Reset the restoration flag when video changes
    hasRestoredRef.current = false;
  }, [videoPath]);

  // Restore video position from progress
  useEffect(() => {
    if (!playerRef.current || hasRestoredRef.current) return;
    if (!initialProgress || initialProgress <= 0 || initialProgress >= 100) return;

    const player = playerRef.current;

    // Wait for the video metadata to load before seeking
    const handleLoadedMetadata = () => {
      const duration = player.duration();
      if (!hasRestoredRef.current && duration && !isNaN(duration)) {
        const timeToSeek = (initialProgress / 100) * duration;
        player.currentTime(timeToSeek);
        hasRestoredRef.current = true;
      }
    };

    // Check if metadata is already loaded
    if (player.readyState() >= 1) {
      handleLoadedMetadata();
    } else {
      player.one("loadedmetadata", handleLoadedMetadata);
    }
  }, [initialProgress]);

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

