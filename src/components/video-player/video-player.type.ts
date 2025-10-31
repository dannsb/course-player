export interface IVideoPlayer {
  videoPath: string;
  title: string;
  onTimeUpdate: () => void;
  initialProgress?: number;
}

