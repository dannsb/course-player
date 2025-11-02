export interface IVideoList {
  videos: VideoItem[];
  currentVideo: VideoItem;
  progress: Record<number, number>;
  folderName: string;
  onSelectVideo: (video: VideoItem) => void;
  onMarkAsCompleted?: (video: VideoItem) => void;
  onMarkAsNotStarted?: (video: VideoItem) => void;
  onRename?: (video: VideoItem, newTitle: string) => void;
  isCollapsed?: boolean;
}

export interface VideoItem {
  id: number;
  title: string;
  file: string;
  thumbnail?: string;
}

