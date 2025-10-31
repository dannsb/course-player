import { FC } from "react";
import { IFolderImport } from "./folder-import.type";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { FolderIcon } from "lucide-react";

const FolderImport: FC<IFolderImport> = ({ onFolderSelect, hasVideos }) => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary/20 via-background to-secondary/20 p-4">
      <Card className="max-w-lg w-full shadow-2xl border-border/50 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <FolderIcon className="w-12 h-12 text-primary" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-foreground">
            Course Player
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            {hasVideos
              ? "Select a new folder to load different course videos"
              : "To start, select a folder containing video files"}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button
            onClick={onFolderSelect}
            size="lg"
            className="w-full sm:w-auto shadow-lg hover:shadow-xl transition-all gap-2"
          >
            <FolderIcon className="w-4 h-4" />
            Select Folder
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default FolderImport;
