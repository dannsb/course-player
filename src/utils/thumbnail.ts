export const generateVideoThumbnail = (videoPath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    video.preload = 'metadata'; // Changed from 'auto' to 'metadata' for faster loading
    video.muted = true;
    
    const cleanup = () => {
      // Remove all event listeners
      video.onloadedmetadata = null;
      video.onseeked = null;
      video.onerror = null;
      
      // Remove elements
      video.src = '';
      video.load(); // Release the video resource
      video.remove();
      canvas.remove();
    };

    video.onloadedmetadata = () => {
      // Seek to a specific time once metadata is loaded
      video.currentTime = Math.min(2, video.duration * 0.15);
    };

    video.onseeked = () => {
      // Use requestAnimationFrame to ensure frame is painted
      requestAnimationFrame(() => {
        try {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          if (canvas.width > 0 && canvas.height > 0) {
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);
            cleanup();
            resolve(thumbnailUrl);
          } else {
            cleanup();
            reject(new Error('Failed to create thumbnail canvas'));
          }
        } catch (error) {
          cleanup();
          reject(error);
        }
      });
    };

    video.onerror = () => {
      cleanup();
      reject(new Error('Failed to load video'));
    };

    video.src = videoPath;
    video.load();
  });
};