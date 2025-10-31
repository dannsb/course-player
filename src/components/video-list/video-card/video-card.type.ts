import { VideoItem } from "../video-list.type";

export interface IVideoCard {
  video: VideoItem;
  isActive: boolean;
  videoProgress: number;
  onSelect: (video: VideoItem) => void;
  onMarkAsCompleted?: (video: VideoItem) => void;
  onMarkAsNotStarted?: (video: VideoItem) => void;
  onRename?: (video: VideoItem, newTitle: string) => void;
}

