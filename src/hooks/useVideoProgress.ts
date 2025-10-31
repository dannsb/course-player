import { useState, useCallback, useEffect, RefObject } from "react";
import { VideoItem } from "../components/video-list/video-list.type";
import { VideoPlayerRef } from "../components/video-player/video-player";

const STORAGE_KEY_PREFIX = "video_progress_";

export const useVideoProgress = (folderPath?: string, videoPlayerRef?: RefObject<VideoPlayerRef | null>) => {
  const [progress, setProgress] = useState<Record<number, number>>({});

  // Generate storage key based on folder path
  const getStorageKey = useCallback(() => {
    if (!folderPath) return null;
    const sanitizedPath = folderPath.replace(/[^a-zA-Z0-9]/g, "_");
    return `${STORAGE_KEY_PREFIX}${sanitizedPath}`;
  }, [folderPath]);

  // Load progress from local storage when folder changes
  useEffect(() => {
    const storageKey = getStorageKey();
    if (!storageKey) return;

    try {
      const savedProgress = localStorage.getItem(storageKey);
      if (savedProgress) {
        const parsedProgress = JSON.parse(savedProgress);
        setProgress(parsedProgress);
      } else {
        // Reset progress if no saved data for this folder
        setProgress({});
      }
    } catch (error) {
      console.error("Error loading progress from local storage:", error);
      setProgress({});
    }
  }, [folderPath, getStorageKey]);

  // Save progress to local storage whenever it changes
  useEffect(() => {
    const storageKey = getStorageKey();
    if (!storageKey) return;

    try {
      localStorage.setItem(storageKey, JSON.stringify(progress));
    } catch (error) {
      console.error("Error saving progress to local storage:", error);
    }
  }, [progress, getStorageKey]);

  const handleTimeUpdate = useCallback(
    (currentVideo: VideoItem | null) => {
      if (!currentVideo) return;

      const videoElement = document.querySelector("video");
      if (!videoElement || !videoElement.duration) return;

      const percent =
        (videoElement.currentTime / videoElement.duration) * 100;
      setProgress((prev) => {
        const currentProgress = prev[currentVideo.id] || 0;
        // Only update if new progress is greater than current progress
        const newProgress = Math.max(currentProgress, percent);
        return { ...prev, [currentVideo.id]: newProgress };
      });
    },
    []
  );

  const markAsCompleted = useCallback((video: VideoItem) => {
    setProgress((prev) => ({ ...prev, [video.id]: 100 }));
  }, []);


  const markAsNotStarted = useCallback((video: VideoItem) => {
    setProgress((prev) => ({ ...prev, [video.id]: 0 }));
  
    if (videoPlayerRef?.current) {
      videoPlayerRef.current.seekTo(0);
      videoPlayerRef.current.pause();

    }
  }, [videoPlayerRef]);

  return {
    progress,
    handleTimeUpdate,
    markAsCompleted,
    markAsNotStarted,
  };
};

