import { FC } from "react";
import { IVideoList } from "./video-list.type";
import { FolderOpen } from "lucide-react";
import VideoCard from "./video-card/video-card";
import {
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
} from "../ui/sidebar";

const VideoList: FC<IVideoList> = ({
  videos,
  currentVideo,
  progress,
  onSelectVideo,
  folderName,
  onMarkAsCompleted,
  onMarkAsNotStarted,
  onRename,
  isCollapsed = false,
}) => {
  return (
    <div
      className={`w-full bg-secondary/50 text-foreground flex flex-col flex-1 overflow-y-auto smooth-scroll border-r border-border   ${isCollapsed ? "px-0 pt-3 " : "p-5"}`}
    >
      <SidebarHeader
        className={`!p-0  flex items-center border-none ${isCollapsed ? "justify-center" : "gap-2 mb-4"}`}
      >
        <FolderOpen className="w-5 h-5 text-primary flex-shrink-0" />
        {!isCollapsed && (
          <h2 className="text-xl font-bold text-foreground break-words min-w-[219px]">
            {folderName}
          </h2>
        )}
      </SidebarHeader>
      {!isCollapsed && (
        <SidebarGroup className="!p-0 px-5 pb-5">
          <SidebarGroupContent>
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
          </SidebarGroupContent>
        </SidebarGroup>
      )}
      {isCollapsed && (
        <div className="flex flex-col gap-2 p-2">
          {videos.map((video, index) => (
            <div
              key={video.id}
              onClick={() => onSelectVideo(video)}
              className={`w-full p-2 rounded cursor-pointer transition-colors hover:bg-accent ${currentVideo.id === video.id ? "bg-primary/20" : ""
                }`}
              title={video.title}
            >
              <div className="text-xs truncate text-center">{index + 1}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VideoList;
