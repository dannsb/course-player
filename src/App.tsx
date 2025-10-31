import { useState, useEffect, useRef } from "react";
import VideoPlayer from "./components/video-player/video-player";
import VideoList from "./components/video-list/video-list";
import { VideoItem } from "./components/video-list/video-list.type";
import FolderImport from "./components/folder-import/folder-import";
import { Button } from "./components/ui/button";
import { Separator } from "./components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./components/ui/dialog";
import { FolderIcon } from "lucide-react";
import { generateVideoThumbnail } from "./utils/thumbnail";

// Check if we're running in Electron
const isElectron = () => {
  // @ts-ignore - Check for Electron
  return window && window.process && window.process.type;
};

function App() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [currentVideo, setCurrentVideo] = useState<VideoItem | null>(null);
  const [progress, setProgress] = useState<Record<number, number>>({});
  const [folderName, setFolderName] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogContent, setDialogContent] = useState({ title: "", message: "" });
  const thumbnailsGeneratedRef = useRef(false);

  const showDialog = (title: string, message: string) => {
    setDialogContent({ title, message });
    setDialogOpen(true);    
  };

  const handleSelectFolder = async () => {
    if (!isElectron()) {
      showDialog(
        "Electron Required",
        "This feature is only available in the Electron version of the application."
      );
      return;
    }

    try {
      // @ts-ignore - Electron IPC
      const { ipcRenderer } = window.require("electron");
      const result = await ipcRenderer.invoke("select-folder");
      
      if (result && result.videos && result.videos.length > 0) {
        thumbnailsGeneratedRef.current = false; // Reset for new folder
        setVideos(result.videos);
        setCurrentVideo(result.videos[0]);
        setFolderName(result.folderPath.split("\\").pop());
      } else if (result && result.videos && result.videos.length === 0) {        
        showDialog(
          "No Videos Found",
          "No video files were found in the selected folder. Please choose a folder containing video files."
        );
      }
    } catch (error) {
      console.error("Error selecting folder:", error);
      showDialog(
        "Error",
        "An error occurred while selecting the folder. Please try again."
      );
    }
  };

  const handleTimeUpdate = () => {
    if (!currentVideo) return;

    // Get video element from the DOM
    const videoElement = document.querySelector("video");
    if (!videoElement || !videoElement.duration) return;

    const percent = (videoElement.currentTime / videoElement.duration) * 100;
    setProgress({ ...progress, [currentVideo.id]: percent });
  };

  // Generate thumbnails for videos when they are loaded
  useEffect(() => {
    const generateThumbnails = async () => {
      if (videos.length === 0 || thumbnailsGeneratedRef.current) return;

      // Mark as generating to prevent duplicate runs
      thumbnailsGeneratedRef.current = true;

      const videosWithThumbnails = await Promise.all(
        videos.map(async (video) => {
          try {
            const thumbnail = await generateVideoThumbnail(video.file);
            return { ...video, thumbnail };
          } catch (error) {
            console.error(`Error generating thumbnail for ${video.title}:`, error);
            return video;
          }
        })
      );

      setVideos(videosWithThumbnails);
    };

    generateThumbnails();
  }, [videos]);

  const handleSelectVideo = (video: VideoItem) => {
    setCurrentVideo(video);
  };

  const handleMarkAsCompleted = (video: VideoItem) => {
    setProgress({ ...progress, [video.id]: 100 });
  };

  const handleMarkAsNotStarted = (video: VideoItem) => {
    setProgress({ ...progress, [video.id]: 0 });
  };

  const handleRename = async (video: VideoItem, newTitle: string) => {
    if (!isElectron()) {
      showDialog(
        "Electron Required",
        "This feature is only available in the Electron version of the application."
      );
      return;
    }

    try {
      // @ts-ignore - Electron IPC
      const { ipcRenderer } = window.require("electron");
      const result = await ipcRenderer.invoke("rename-video", {
        oldPath: video.file,
        newTitle: newTitle,
      });

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

        showDialog("Success", "Video renamed successfully.");
      } else {
        showDialog("Error", result.error || "Failed to rename video.");
      }
    } catch (error) {
      console.error("Error renaming video:", error);
      showDialog(
        "Error",
        "An error occurred while renaming the video. Please try again."
      );
    }
  };

  // Show folder import screen if no videos
  if (videos.length === 0) {
    return (
      <FolderImport onFolderSelect={handleSelectFolder} hasVideos={false} />
    );
  }

  return (
    <>
      <div className="flex h-screen">
        {/* Sidebar with video list and import button */}
        <div className="flex flex-col w-72 h-full justify-between">
          <VideoList
            videos={videos}
            currentVideo={currentVideo!}
            progress={progress}
            onSelectVideo={handleSelectVideo}
            folderName={folderName}
            onMarkAsCompleted={handleMarkAsCompleted}
            onMarkAsNotStarted={handleMarkAsNotStarted}
            onRename={handleRename}
          />
          <div className="bg-secondary/50 border-r border-border">
            <Separator className="mb-2" />
            <div className="p-2.5">
              <Button
                onClick={handleSelectFolder}
                variant="secondary"
                className="w-full gap-2"
              >
                <FolderIcon className="w-4 h-4" /> New Folder
              </Button>
            </div>
          </div>
        </div>

        {/* Video Player */}
        {currentVideo && (
          <VideoPlayer
            videoPath={currentVideo.file}
            title={currentVideo.title}
            onTimeUpdate={handleTimeUpdate}
          />
        )}
      </div>

      {/* Dialog for notifications */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogContent.title}</DialogTitle>
            <DialogDescription>{dialogContent.message}</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default App;
