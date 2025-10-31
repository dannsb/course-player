import { useState, useEffect, useCallback } from "react";
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

  /**
   * Generate thumbnails for all videos
   */
  useEffect(() => {
    const generateThumbnails = async () => {
      // Only generate thumbnails if videos have no thumbnails yet
      if (videos.length === 0 || videos.every(v => v.thumbnail)) return;

      setIsLoadingThumbnails(true);

      const videosWithThumbnails = await Promise.all(
        videos.map(async (video) => {
          // Skip if thumbnail already exists
          if (video.thumbnail) return video;
          
          try {
            const thumbnail = await generateVideoThumbnail(video.file);
            return { ...video, thumbnail };
          } catch (error) {
            console.error(
              `Error generating thumbnail for ${video.title}:`,
              error
            );
            return video;
          }
        })
      );

      // Only update if we actually generated new thumbnails
      const hasNewThumbnails = videosWithThumbnails.some((v, i) => 
        v.thumbnail && v.thumbnail !== videos[i].thumbnail
      );
      
      if (hasNewThumbnails) {
        setVideos(videosWithThumbnails);
      }

      setIsLoadingThumbnails(false);
    };

    generateThumbnails();
  }, [videos]);

  /**
   * Select a folder containing videos
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
        setVideos(result.videos);
        setCurrentVideo(result.videos[0]);
        setFolderPath(result.folderPath);
        setFolderName(result.folderPath.split("\\").pop());
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
   */
  const handleSelectVideo = useCallback((video: VideoItem) => {
    setCurrentVideo(video);
  }, []);

  /**
   * Rename a video file
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
          // Update the videos array with the new file path and title
          const updatedVideos = videos.map((v) =>
            v.id === video.id
              ? { ...v, title: newTitle, file: result.newPath }
              : v
          );
          setVideos(updatedVideos);

          // Update current video if it was the one renamed
          if (currentVideo?.id === video.id) {
            setCurrentVideo({ ...video, title: newTitle, file: result.newPath });
          }

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
    [videos, currentVideo, onError, onSuccess]
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

