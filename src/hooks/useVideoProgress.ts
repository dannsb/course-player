import {
  useState,
  useCallback,
  useEffect,
  RefObject,
  useRef,
  useLayoutEffect,
  useMemo,
} from "react";
import { VideoItem } from "../components/video-list/video-list.type";
import { VideoPlayerRef } from "../components/video-player/video-player";

const STORAGE_KEY_PREFIX = "video_progress_";
const NOTES_STORAGE_KEY_PREFIX = "video_notes_";

export const useVideoProgress = (
  folderPath?: string,
  videoPlayerRef?: RefObject<VideoPlayerRef | null>
) => {
  const [progress, setProgress] = useState<Record<number, number>>({});
  const [notes, setNotes] = useState<Record<number, string>>({});

  // Track the current video ID to prevent cross-contamination
  const currentVideoIdRef = useRef<number | null>(null);
  // Track the current folder path to prevent cross-folder contamination
  const currentFolderPathRef = useRef<string | undefined>(folderPath);

  // Generate storage key based on folder path (memoized to prevent unnecessary re-renders)
  const getStorageKey = useCallback(() => {
    if (!folderPath) return null;
    const sanitizedPath = folderPath.replace(/[^a-zA-Z0-9]/g, "_");
    return `${STORAGE_KEY_PREFIX}${sanitizedPath}`;
  }, [folderPath]);

  // Generate notes storage key based on folder path (memoized to prevent unnecessary re-renders)
  const getNotesStorageKey = useCallback(() => {
    if (!folderPath) return null;
    const sanitizedPath = folderPath.replace(/[^a-zA-Z0-9]/g, "_");
    return `${NOTES_STORAGE_KEY_PREFIX}${sanitizedPath}`;
  }, [folderPath]);

  useLayoutEffect(() => {
    setProgress({});
  }, [folderPath]);

  // Load progress from local storage when folder changes
  useEffect(() => {
    const storageKey = getStorageKey();
    if (!storageKey) {
      setProgress({});
      currentFolderPathRef.current = folderPath;
      currentVideoIdRef.current = null; // Reset video ID when folder changes
      return;
    }

    try {
      const savedProgress = localStorage.getItem(storageKey);

      if (savedProgress) {
        const parsedProgress = JSON.parse(savedProgress);
        setProgress(parsedProgress);
      } else {
        setProgress({});
      }
      // Reset tracking refs when folder changes
      currentFolderPathRef.current = folderPath;
      currentVideoIdRef.current = null;
    } catch (error) {
      console.error("Error loading progress from local storage:", error);
      setProgress({});
      currentFolderPathRef.current = folderPath;
      currentVideoIdRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folderPath]); // getStorageKey is memoized and only depends on folderPath, so it's safe to omit

  // // Load notes from local storage when folder changes
  useEffect(() => {
    const storageKey = getNotesStorageKey();
    if (!storageKey) {
      setNotes({});
      return;
    }

    try {
      const savedNotes = localStorage.getItem(storageKey);
      if (savedNotes) {
        const parsedNotes = JSON.parse(savedNotes);
        setNotes(parsedNotes);
      } else {
        setNotes({});
      }
    } catch (error) {
      console.error("Error loading notes from local storage:", error);
      setNotes({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folderPath]); // getNotesStorageKey is memoized and only depends on folderPath, so it's safe to omit

  // Save progress to local storage whenever it changes
  useEffect(() => {
    const storageKey = getStorageKey();
    if (!storageKey) return;

    try {
      localStorage.setItem(storageKey, JSON.stringify(progress));
    } catch (error) {
      console.error("Error saving progress to local storage:", error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress, folderPath]); // getStorageKey is memoized and only depends on folderPath, so it's safe to omit

  // // Save notes to local storage whenever they change
  useEffect(() => {
    const storageKey = getNotesStorageKey();
    if (!storageKey) return;

    try {
      localStorage.setItem(storageKey, JSON.stringify(notes));
    } catch (error) {
      console.error("Error saving notes to local storage:", error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes, folderPath]); 
  // getNotesStorageKey is memoized and only depends on folderPath, so it's safe to omit

  const handleTimeUpdate = useCallback(
    (currentVideo: VideoItem | null) => {
      if (!currentVideo) return;

      // CRITICAL: Verify we're in the correct folder context
      // This prevents cross-folder progress contamination
      if (currentFolderPathRef.current !== folderPath) {
        // Folder changed, ignore this update
        return;
      }

      // Update the current video ID reference
      currentVideoIdRef.current = currentVideo.id;

      const videoElement = document.querySelector("video");
      if (!videoElement || !videoElement.duration) return;

      // Verify we're still on the same video (prevent race conditions)
      // Double-check folder path hasn't changed during async operations
      if (
        currentFolderPathRef.current !== folderPath ||
        currentVideoIdRef.current !== currentVideo.id
      ) {
        return;
      }

      const currentTime = videoElement.currentTime;
      const duration = videoElement.duration;

      // Ignore initial timeupdate events (first 0.5 seconds)
      // This prevents capturing old video position on new video load
      if (currentTime < 0.5) {
        return;
      }

      const percent = (currentTime / duration) * 100;

      setProgress((prev) => {
        // Final validation: ensure folder hasn't changed during state update
        if (currentFolderPathRef.current !== folderPath) {
          return prev; // Don't update if folder changed
        }

        const currentProgress = prev[currentVideo.id] || 0;
        // Only update if new progress is greater than current progress
        // AND less than 99% (to avoid premature completion)
        const newProgress = Math.max(currentProgress, Math.min(percent, 99));

        // Only update if there's a meaningful change (> 1%)
        if (Math.abs(newProgress - currentProgress) < 1) {
          return prev;
        }

        return { ...prev, [currentVideo.id]: newProgress };
      });
    },
    [folderPath] // Include folderPath in dependencies to ensure closure is updated
  );

  const markAsCompleted = useCallback((video: VideoItem) => {
    console.log(4);

    setProgress((prev) => ({ ...prev, [video.id]: 100 }));
  }, []);

  const markAsNotStarted = useCallback(
    (video: VideoItem) => {
    console.log(6);
      setProgress((prev) => ({ ...prev, [video.id]: 0 }));

      if (videoPlayerRef?.current) {
        videoPlayerRef.current.seekTo(0);
        videoPlayerRef.current.pause();
      }
    },
    [videoPlayerRef]
  );

  const updateNote = useCallback((videoId: number, note: string) => {
    setNotes((prev) => ({ ...prev, [videoId]: note }));
  }, []);

  return {
    progress,
    handleTimeUpdate,
    markAsCompleted,
    markAsNotStarted,
    notes,
    updateNote,
  };
};
