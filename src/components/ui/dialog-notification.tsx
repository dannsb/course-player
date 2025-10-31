import { FC } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./dialog";

interface DialogNotificationProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message: string;
}

const DialogNotification: FC<DialogNotificationProps> = ({
  isOpen,
  onOpenChange,
  title,
  message,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};

export default DialogNotification;

