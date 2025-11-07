import { useRef, useCallback } from "react";
import VideoPlayer, {
  VideoPlayerRef,
} from "./components/video-player/video-player";
import VideoList from "./components/video-list/video-list";
import FolderImport from "./components/folder-import/folder-import";
import LoadingOverlay from "./components/ui/loading-overlay";
import DialogNotification from "./components/ui/dialog-notification";
import { Toaster } from "./components/ui/sonner";
import { Button } from "./components/ui/button";
import { Separator } from "./components/ui/separator";
import { FolderIcon } from "lucide-react";
import { useDialog } from "./hooks/useDialog";
import { useVideoProgress } from "./hooks/useVideoProgress";
import { useVideoManagement } from "./hooks/useVideoManagement";
import { useContinueToast } from "./hooks/useContinueToast";
import {
  SidebarProvider,
  useSidebar,
  SidebarTrigger,
} from "./components/ui/sidebar";

function AppContent() {
  const videoPlayerRef = useRef<VideoPlayerRef>(null);

  const { isOpen, content, showDialog, setIsOpen } = useDialog();

  // Video management (loading, selection, renaming)
  const {
    videos,
    currentVideo,
    folderName,
    folderPath,
    isLoadingThumbnails,
    handleSelectFolder,
    handleSelectVideo,
    handleRename,
  } = useVideoManagement({
    onError: showDialog,
    onSuccess: showDialog,
  });

  // Video progress tracking
  const {
    progress,
    handleTimeUpdate,
    markAsCompleted,
    markAsNotStarted,
    notes,
    updateNote,
  } = useVideoProgress(folderPath, videoPlayerRef);

  // Show continue toast when video has saved progress
  useContinueToast({
    currentVideo,
    progress,
    videoPlayerRef,
  });

  const { state } = useSidebar();

  // Memoize the onTimeUpdate handler to prevent unnecessary re-renders
  const onTimeUpdateHandler = useCallback(() => {
    if (currentVideo) {
      handleTimeUpdate(currentVideo);
    }
  }, [currentVideo, handleTimeUpdate]);

  // Memoize the onNoteChange handler to prevent unnecessary re-renders
  const onNoteChangeHandler = useCallback((note: string) => {
    if (currentVideo) {
      updateNote(currentVideo.id, note);
    }
  }, [currentVideo, updateNote]);

  // Memoize the onEnded handler to mark video as completed when it finishes
  const onEndedHandler = useCallback(() => {
    if (currentVideo) {
      markAsCompleted(currentVideo);
    }
  }, [currentVideo, markAsCompleted]);

  // Calculate current video index and navigation handlers
  const currentVideoIndex = currentVideo ? videos.findIndex(v => v.id === currentVideo.id) : -1;
  const hasPrev = currentVideoIndex > 0;
  const hasNext = currentVideoIndex >= 0 && currentVideoIndex < videos.length - 1;

  const handlePrev = useCallback(() => {
    if (hasPrev && currentVideoIndex > 0) {
      handleSelectVideo(videos[currentVideoIndex - 1]);
    }
  }, [hasPrev, currentVideoIndex, videos, handleSelectVideo]);

  const handleNext = useCallback(() => {
    if (hasNext && currentVideoIndex < videos.length - 1) {
      handleSelectVideo(videos[currentVideoIndex + 1]);
    }
  }, [hasNext, currentVideoIndex, videos, handleSelectVideo]);

  // Show folder import screen if no videos
  if (videos.length === 0) {
    return (
      <>
        <FolderImport onFolderSelect={handleSelectFolder} hasVideos={false} />
        <DialogNotification
          isOpen={isOpen}
          onOpenChange={setIsOpen}
          title={content.title}
          message={content.message}
        />
      </>
    );
  }
  
  return (
    <>
      <div className="flex h-screen w-full ">
        <div
          className={`flex flex-col h-full justify-between transition-all duration-200 ${state === "collapsed" ? "w-16" : "w-72"}`}
        >
          <VideoList
            videos={videos}
            currentVideo={currentVideo!}
            progress={progress}
            onSelectVideo={handleSelectVideo}
            folderName={folderName}
            onMarkAsCompleted={markAsCompleted}
            onMarkAsNotStarted={markAsNotStarted}
            onRename={handleRename}
            isCollapsed={state === "collapsed"}
          />
          {state === "expanded" && (
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
          )}
        </div>

        {/* Video Player */}
        {currentVideo && (
          <div className="flex flex-col flex-1 relative ">
            <div className="absolute top-2 left-2 z-10">
              <SidebarTrigger />
            </div>
            <VideoPlayer
              ref={videoPlayerRef}
              videoPath={currentVideo.file}
              title={currentVideo.title}
              onTimeUpdate={onTimeUpdateHandler}
              onEnded={onEndedHandler}
              initialNote={notes[currentVideo.id] || ""}
              onNoteChange={onNoteChangeHandler}
              onPrev={handlePrev}
              onNext={handleNext}
              hasPrev={hasPrev}
              hasNext={hasNext}
            />
          </div>
        )}
      </div>

      {/* Loading overlay for thumbnail generation */}
      {isLoadingThumbnails && (
        <LoadingOverlay message="Generating thumbnails..." />
      )}

      {/* Dialog for notifications */}
      <DialogNotification
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        title={content.title}
        message={content.message}
      />

      {/* Sonner Toaster for toast notifications */}
      <Toaster />
    </>
  );
}

function App() {
  return (
    <SidebarProvider>
      <AppContent />
    </SidebarProvider>
  );
}

export default App;
