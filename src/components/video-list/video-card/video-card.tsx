import { FC, useState } from "react";
import { Card, CardContent } from "../../ui/card";
import { Progress } from "../../ui/progress";
import { Badge } from "../../ui/badge";
import { IVideoCard } from "./video-card.type";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "../../ui/context-menu";
import { CheckCircle, PlayCircle, Pencil } from "lucide-react";
import RenameDialog from "./rename-dialog";
import { isPersian } from "../../../utils/persian-text";

const VideoCard: FC<IVideoCard> = ({
  video,
  isActive,
  videoProgress,
  onSelect,
  onMarkAsCompleted,
  onMarkAsNotStarted,
  onRename,
}) => {
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState(video.title);

  const getVideoStatus = (progress: number) => {
    // Only show "Completed" when progress is 100% (or very close, accounting for rounding)
    if (progress >= 99.5)
      return { label: "Completed", variant: "outline" as const };
    if (progress > 0)
      return { label: "In Progress", variant: "secondary" as const };
    return { label: "Not Started", variant: "outline" as const };
  };

  const status = getVideoStatus(videoProgress);

  const handleRename = () => {
    if (onRename && newTitle.trim() !== "" && newTitle !== video.title) {
      onRename(video, newTitle.trim());
    }
    setRenameDialogOpen(false);
  };

  const handleOpenRenameDialog = () => {
    setNewTitle(video.title);
    setRenameDialogOpen(true);
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger className="group">
          <Card
            onClick={() => onSelect(video)}
            className={`
              p-0
              cursor-pointer transition-all hover:shadow-md
              ${
                isActive
                  ? "bg-primary/20 shadow-lg border-primary/50"
                  : "bg-card hover:bg-accent border-border/50"
              }
            `}
          >
            <CardContent className="p-0 min-h-[240px]">
              {/* Video Thumbnail */}
              {video.thumbnail && (
                <div className="relative w-full aspect-video overflow-hidden rounded-t-lg ">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover "
                  />
                  {/* Play overlay indicator */}
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity">
                    <PlayCircle className="w-8 h-8 text-white" />
                  </div>
                </div>
              )}
              
              <div className="p-3 space-y-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="m-0 text-sm font-medium text-card-foreground line-clamp-3 flex-1"
                    dir={isPersian(video.title) ? "rtl" : "ltr"}
                  >
                    {video.title}
                  </p>
                </div>
                <div className="space-y-3">
                  <Progress value={videoProgress} className="h-1.5" />  
                  <div className="flex items-center justify-between">
                    <small className="text-muted-foreground text-xs">
                      {Math.round(videoProgress)}%
                    </small>
                    <Badge
                      variant={status.variant}
                      className="text-[9px] px-2 py-1"
                    >
                      {status.label}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          <ContextMenuItem
            onClick={() => onMarkAsCompleted?.(video)}
            className="cursor-pointer"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            <span>Mark as Completed</span>
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => onMarkAsNotStarted?.(video)}
            className="cursor-pointer"
          >
            <PlayCircle className="mr-2 h-4 w-4" />
            <span>Mark as Not Started</span>
          </ContextMenuItem>
          <ContextMenuItem
            onClick={handleOpenRenameDialog}
            className="cursor-pointer"
          >
            <Pencil className="mr-2 h-4 w-4" />
            <span>Rename</span>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <RenameDialog
        open={renameDialogOpen}
        onOpenChange={setRenameDialogOpen}
        title={newTitle}
        onTitleChange={setNewTitle}
        onRename={handleRename}
      />
    </>
  );
};

export default VideoCard;

