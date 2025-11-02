import { useState, useCallback, useEffect, RefObject } from "react";
import { VideoItem } from "../components/video-list/video-list.type";
import { VideoPlayerRef } from "../components/video-player/video-player";

const STORAGE_KEY_PREFIX = "video_progress_";
const NOTES_STORAGE_KEY_PREFIX = "video_notes_";

export const useVideoProgress = (folderPath?: string, videoPlayerRef?: RefObject<VideoPlayerRef | null>) => {
  const [progress, setProgress] = useState<Record<number, number>>({});
  const [notes, setNotes] = useState<Record<number, string>>({});

  // Generate storage key based on folder path
  const getStorageKey = useCallback(() => {
    if (!folderPath) return null;
    const sanitizedPath = folderPath.replace(/[^a-zA-Z0-9]/g, "_");
    return `${STORAGE_KEY_PREFIX}${sanitizedPath}`;
  }, [folderPath]);

  // Generate notes storage key based on folder path
  const getNotesStorageKey = useCallback(() => {
    if (!folderPath) return null;
    const sanitizedPath = folderPath.replace(/[^a-zA-Z0-9]/g, "_");
    return `${NOTES_STORAGE_KEY_PREFIX}${sanitizedPath}`;
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

  // Load notes from local storage when folder changes
  useEffect(() => {
    const storageKey = getNotesStorageKey();
    if (!storageKey) return;

    try {
      const savedNotes = localStorage.getItem(storageKey);
      if (savedNotes) {
        const parsedNotes = JSON.parse(savedNotes);
        setNotes(parsedNotes);
      } else {
        // Reset notes if no saved data for this folder
        setNotes({});
      }
    } catch (error) {
      console.error("Error loading notes from local storage:", error);
      setNotes({});
    }
  }, [folderPath, getNotesStorageKey]);

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

  // Save notes to local storage whenever they change
  useEffect(() => {
    const storageKey = getNotesStorageKey();
    if (!storageKey) return;

    try {
      localStorage.setItem(storageKey, JSON.stringify(notes));
    } catch (error) {
      console.error("Error saving notes to local storage:", error);
    }
  }, [notes, getNotesStorageKey]);

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

