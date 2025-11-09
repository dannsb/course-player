# Course Player

An Electron-based video course player with progress tracking, video management, and folder import functionality. Perfect for watching educational courses, tutorials, or any collection of local video files.

## Features

- 📁 **Folder Import**: Select any folder containing video files and automatically load all supported formats
- 🎥 **Advanced Video Playback**: Powered by Video.js with support for keyboard shortcuts and hotkeys
- 📊 **Progress Tracking**: Automatically tracks your progress for each video with precise time tracking
- 💾 **Persistent Storage**: Uses IndexedDB to remember your progress, notes, and preferences
- 🎨 **Modern UI**: Beautiful, responsive interface built with Tailwind CSS and Radix UI components
- 📝 **Video Notes**: Add and save personal notes for each video
- 🖼️ **Video Thumbnails**: Automatic thumbnail generation for quick video identification
- ✏️ **Video Renaming**: Rename video files directly from the application
- ✅ **Completion Tracking**: Mark videos as completed or not started
- ⏭️ **Video Navigation**: Navigate between videos with Previous/Next buttons
- 🔔 **Continue Watching**: Toast notifications to resume where you left off
- 🎹 **Keyboard Shortcuts**: Full keyboard support for video playback controls
- 🌓 **Theme Support**: Dark and light theme modes
- 📱 **Responsive Design**: Collapsible sidebar and adaptive layout
- 🔄 **Auto-resume**: Automatically resumes video playback from where you left off

## Supported Video Formats

- MP4
- MKV
- AVI
- MOV
- WebM
- FLV
- WMV
- M4V


## Available Scripts

### Development Mode

```bash
npm run dev
```

Runs the app in development mode with:
- React development server on http://localhost:3000
- Electron window with hot reload
- TypeScript compilation in watch mode

### Build for Production

```bash
npm run build
npm run electron-build
```

Builds the React app and runs it in Electron production mode.

### Package Application

```bash
npm run package
```

Creates a packaged application for the current platform.

### Create Installer

```bash
npm run make
```

Creates distributable installers for the application (Windows, macOS, Linux).

### Individual Scripts

- `npm start` - Start React development server only
- `npm run react-start` - Start React without opening browser
- `npm run electron-dev` - Compile TypeScript for Electron in watch mode
- `npm run electron-start` - Start Electron window
- `npm test` - Run tests
- `npm run package` - Package the application
- `npm run make` - Create distributable installers

## How to Use

1. **Start the Application**
   ```bash
   npm run dev
   ```

2. **Import Videos**
   - Click the "Select Folder" button
   - Choose a folder containing your video files
   - All supported video files will be automatically detected and loaded

3. **Watch Videos**
   - Click on any video in the sidebar to play it
   - Your progress is automatically saved as you watch
   - Use keyboard shortcuts for playback control (space to play/pause, arrow keys for seeking)
   - Click Previous/Next buttons to navigate between videos

4. **Manage Videos**
   - Right-click on a video to rename it
   - Mark videos as completed or not started
   - Add notes to videos for your personal reference
   - Thumbnails are automatically generated for easy identification

5. **Change Folder**
   - Click the folder icon button to select a different folder
   - Your progress for the current folder is saved before switching

## Keyboard Shortcuts

The video player supports standard keyboard shortcuts:
- **Space** - Play/Pause
- **Arrow Left** - Seek backward (10 seconds)
- **Arrow Right** - Seek forward (10 seconds)
- **Arrow Up** - Volume up
- **Arrow Down** - Volume down
- **M** - Mute/Unmute
- **F** - Fullscreen
- **0-9** - Seek to percentage (0 = 0%, 9 = 90%)

## Technologies Used

- **React 19** - UI framework with TypeScript
- **Electron 39** - Desktop application framework
- **Video.js 8** - Advanced video player with plugin support
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible UI component primitives
- **IndexedDB (idb-keyval)** - Client-side storage for progress and data
- **TypeScript** - Type-safe JavaScript
- **Electron Forge** - Application packaging and distribution
- **Lucide React** - Icon library
- **Sonner** - Toast notifications
- **next-themes** - Theme management

## Development

This project was bootstrapped with Create React App and extended with Electron support.

### Requirements

- Node.js 16+ (recommended: Node.js 18+)
- npm or yarn

### Installation

```bash
npm install
```

### TypeScript Configuration

- `tsconfig.json` - React app TypeScript configuration
- `tsconfig.electron.json` - Electron main process TypeScript configuration

### Building from Source

1. Clone the repository
2. Install dependencies: `npm install`
3. Run in development: `npm run dev`
4. Build for production: `npm run build && npm run electron-build`
5. Create installer: `npm run make`

## Features in Detail

### Progress Tracking
- Automatically saves video progress as you watch
- Resume playback from where you left off
- Progress is stored per video using IndexedDB
- Continue watching notifications when reopening videos

### Video Management
- Rename video files directly from the application
- Mark videos as completed or reset to not started
- Organize videos in a clean, scrollable list
- Collapsible sidebar for more screen space

### Thumbnail Generation
- Automatic thumbnail generation for all videos
- Thumbnails are cached in IndexedDB for fast loading
- Batch processing for efficient thumbnail generation
- Visual identification of videos in the list

### Notes System
- Add personal notes to any video
- Notes are saved automatically
- Notes persist across sessions
- Support for Persian and English text

## License

Private project for educational purposes.
