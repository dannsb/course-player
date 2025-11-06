import { useState, useEffect, useCallback, useRef } from "react";
import { get, set } from 'idb-keyval';
import { VideoItem } from "../components/video-list/video-list.type";
import { generateVideoThumbnail } from "../utils/thumbnail";
import { isElectron, selectVideoFolder, renameVideoFile } from "../utils/electron";

interface UseVideoManagementProps {
  onError: (title: string, message: string) => void;
  onSuccess: (title: string, message: string) => void;
}

/**
 * Custom hook for managing video operations including loading, selection, thumbnails, and renaming
 */
export const useVideoManagement = ({
  onError,
  onSuccess,
}: UseVideoManagementProps) => {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [currentVideo, setCurrentVideo] = useState<VideoItem | null>(null);
  const [folderName, setFolderName] = useState<string>("");
  const [folderPath, setFolderPath] = useState<string>("");
  const [isLoadingThumbnails, setIsLoadingThumbnails] = useState<boolean>(false);
  
  // Track which thumbnails are currently being generated
  const generatingThumbnailsRef = useRef<Set<string>>(new Set());
  // Track if thumbnail generation is in progress to prevent multiple runs
  const isGeneratingRef = useRef<boolean>(false);

  /**
   * Generate thumbnails for all videos
   * OPTIMIZED: Only runs when videos array changes AND has videos without thumbnails
   */
  useEffect(() => {
    // Prevent multiple simultaneous thumbnail generation runs
    if (isGeneratingRef.current) return;
    
    // Early exit if no videos or all videos have thumbnails
    if (videos.length === 0) return;
    
    const videosNeedingThumbnails = videos.filter(v => !v.thumbnail);
    if (videosNeedingThumbnails.length === 0) return;

    const generateThumbnails = async () => {
      isGeneratingRef.current = true;
      setIsLoadingThumbnails(true);

      try {
        // Process thumbnails in batches of 3 for better performance
        const batchSize = 3;
        const batches: VideoItem[][] = [];
        
        for (let i = 0; i < videosNeedingThumbnails.length; i += batchSize) {
          batches.push(videosNeedingThumbnails.slice(i, i + batchSize));
        }

        for (const batch of batches) {
          const batchResults = await Promise.all(
            batch.map(async (video) => {
              // Skip if already generating
              if (generatingThumbnailsRef.current.has(video.file)) {
                return null;
              }

              generatingThumbnailsRef.current.add(video.file);
              const key = `thumb-${video.file}`;

              try {
                // Check cache from IndexedDB
                const cached = await get(key);
                if (cached) {
                  generatingThumbnailsRef.current.delete(video.file);
                  return { id: video.id, thumbnail: cached };
                }

                // Generate and cache thumbnail
                const thumbnail = await generateVideoThumbnail(video.file);
                await set(key, thumbnail);
                generatingThumbnailsRef.current.delete(video.file);
                return { id: video.id, thumbnail };
              } catch (err) {
                console.error(`Error generating thumbnail for ${video.title}:`, err);
                generatingThumbnailsRef.current.delete(video.file);
                return null;
              }
            })
          );

          // Update videos state with batch results
          setVideos(prevVideos => {
            const updates = batchResults.filter(Boolean) as Array<{ id: number; thumbnail: string }>;
            if (updates.length === 0) return prevVideos;

            return prevVideos.map(video => {
              const update = updates.find(u => u.id === video.id);
              return update ? { ...video, thumbnail: update.thumbnail } : video;
            });
          });
        }
      } catch (error) {
        console.error("Error in thumbnail generation:", error);
      } finally {
        setIsLoadingThumbnails(false);
        isGeneratingRef.current = false;
        generatingThumbnailsRef.current.clear();
      }
    };

    generateThumbnails();
  }, [videos]); // Only depends on videos

  /**
   * Select a folder containing videos
   * OPTIMIZED: Stable function reference with useCallback
   */
  const handleSelectFolder = useCallback(async () => {
    if (!isElectron()) {
      onError(
        "Electron Required",
        "This feature is only available in the Electron version of the application."
      );
      return;
    }

    try {
      const result = await selectVideoFolder();

      if (result && result.videos && result.videos.length > 0) {
        // Reset thumbnail generation state
        generatingThumbnailsRef.current.clear();
        isGeneratingRef.current = false;
        
        setVideos(result.videos);
        setCurrentVideo(result.videos[0]);
        setFolderPath(result.folderPath);
        
        // Extract folder name (cross-platform compatible)
        const folderNameExtracted = result.folderPath.split(/[\\/]/).pop() || "";
        setFolderName(folderNameExtracted);
      } else if (result && result.videos && result.videos.length === 0) {
        onError(
          "No Videos Found",
          "No video files were found in the selected folder. Please choose a folder containing video files."
        );
      }
    } catch (error) {
      console.error("Error selecting folder:", error);
      onError(
        "Error",
        "An error occurred while selecting the folder. Please try again."
      );
    }
  }, [onError]);

  /**
   * Select a video to play
   * OPTIMIZED: No dependencies needed since it only uses the parameter
   */
  const handleSelectVideo = useCallback((video: VideoItem) => {
    setCurrentVideo(video);
  }, []);

  /**
   * Rename a video file
   * OPTIMIZED: Reduced dependencies and improved state updates
   */
  const handleRename = useCallback(
    async (video: VideoItem, newTitle: string) => {
      if (!isElectron()) {
        onError(
          "Electron Required",
          "This feature is only available in the Electron version of the application."
        );
        return;
      }

      try {
        const result = await renameVideoFile(video.file, newTitle);

        if (result.success) {
          // Update videos array immutably
          setVideos(prevVideos => 
            prevVideos.map((v) =>
              v.id === video.id
                ? { ...v, title: newTitle, file: result.newPath }
                : v
            )
          );

          // Update current video if it was the one renamed
          setCurrentVideo(prevCurrent => 
            prevCurrent?.id === video.id
              ? { ...prevCurrent, title: newTitle, file: result.newPath }
              : prevCurrent
          );

          onSuccess("Success", "Video renamed successfully.");
        } else {
          onError("Error", result.error || "Failed to rename video.");
        }
      } catch (error) {
        console.error("Error renaming video:", error);
        onError(
          "Error",
          "An error occurred while renaming the video. Please try again."
        );
      }
    },
    [onError, onSuccess] // Removed videos and currentVideo dependencies
  );

  return {
    videos,
    currentVideo,
    folderName,
    folderPath,
    isLoadingThumbnails,
    handleSelectFolder,
    handleSelectVideo,
    handleRename,
  };
};