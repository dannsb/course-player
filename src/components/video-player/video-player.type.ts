export interface IVideoPlayer {
  videoPath: string;
  title: string;
  onTimeUpdate: () => void;
  onEnded?: () => void;
  initialNote?: string;
  onNoteChange: (note: string) => void;
}

