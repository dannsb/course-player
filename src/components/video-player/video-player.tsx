import { FC, useRef } from "react";
import { IVideoPlayer } from "./video-player.type";

const VideoPlayer: FC<IVideoPlayer> = ({
  videoPath,
  title,
  onTimeUpdate,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  return (
    <div className="flex-1 bg-background flex flex-col items-center justify-center">
      <video
        ref={videoRef}
        src={videoPath}
        controls
        onTimeUpdate={onTimeUpdate}
        className="w-4/5 rounded-xl"
      />
      <h3 className="text-white mt-3 text-xl">{title}</h3>
    </div>
  );
};

export default VideoPlayer;

