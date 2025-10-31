import { useState } from "react";

interface DialogContent {
  title: string;
  message: string;
}

/**
 * Custom hook for managing dialog state and content
 */
export const useDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState<DialogContent>({
    title: "",
    message: "",
  });

  const showDialog = (title: string, message: string) => {
    setContent({ title, message });
    setIsOpen(true);
  };

  const closeDialog = () => {
    setIsOpen(false);
  };

  return {
    isOpen,
    content,
    showDialog,
    closeDialog,
    setIsOpen,
  };
};

