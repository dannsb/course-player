export interface IVideoPlayer {
  videoPath: string;
  title: string;
  onTimeUpdate: () => void;
  initialNote?: string;
  onNoteChange: (note: string) => void;
}

