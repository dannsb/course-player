import { FC } from "react";
import { IVideoList } from "./video-list.type";
import { FolderOpen } from "lucide-react";
import VideoCard from "./video-card/video-card";

const VideoList: FC<IVideoList> = ({
  videos,
  currentVideo,
  progress,
  onSelectVideo,
  folderName,
  onMarkAsCompleted,
  onMarkAsNotStarted,
  onRename,
}) => {
  return (
    <div className="w-full bg-secondary/50 text-foreground p-5 flex flex-col flex-1 overflow-y-auto smooth-scroll border-r border-border">
      <div className="flex items-center gap-2 mb-4">
        <FolderOpen className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-bold text-foreground">{folderName}</h2>
      </div>
      <div className="flex-1 pr-2 overflow-y-auto smooth-scroll">
        <div className="flex flex-col gap-2">
          {videos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              isActive={currentVideo.id === video.id}
              videoProgress={progress[video.id] || 0}
              onSelect={onSelectVideo}
              onMarkAsCompleted={onMarkAsCompleted}
              onMarkAsNotStarted={onMarkAsNotStarted}
              onRename={onRename}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default VideoList;
