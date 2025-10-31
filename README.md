# Course Player

An Electron-based video course player with progress tracking and folder import functionality.

## Features

- 📁 **Folder Import**: Select any folder containing video files
- 🎥 **Video Playback**: Play videos with built-in HTML5 player
- 📊 **Progress Tracking**: Automatically tracks your progress for each video
- 💾 **Persistent Storage**: Remembers your last opened folder and progress
- 🎨 **Beautiful UI**: Modern, responsive interface with Persian language support
- 📝 **Video List**: Easy navigation between videos in your course

## Supported Video Formats

- MP4
- MKV
- AVI
- MOV
- WebM
- FLV
- WMV
- M4V

## Project Structure

```
src/
├── components/
│   ├── VideoPlayer/
│   │   ├── VideoPlayer.tsx
│   │   └── index.ts
│   ├── VideoList/
│   │   ├── VideoList.tsx
│   │   └── index.ts
│   └── FolderImport/
│       ├── FolderImport.tsx
│       └── index.ts
├── types/
│   └── electron.d.ts
├── App.tsx
├── index.tsx
└── index.css
```

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

### Individual Scripts

- `npm start` - Start React development server only
- `npm run react-start` - Start React without opening browser
- `npm run electron-dev` - Compile TypeScript for Electron in watch mode
- `npm run electron-start` - Start Electron window
- `npm test` - Run tests

## How to Use

1. **Start the Application**
   ```bash
   npm run dev
   ```

2. **Import Videos**
   - Click the "📂 انتخاب پوشه" (Select Folder) button
   - Choose a folder containing your video files
   - All supported video files will be automatically detected

3. **Watch Videos**
   - Click on any video in the sidebar to play it
   - Your progress is automatically saved
   - The app remembers your last opened folder

4. **Change Folder**
   - Click the "📂 پوشه جدید" (New Folder) button at the bottom of the sidebar
   - Select a different folder with videos

## Technologies Used

- **React 19** with TypeScript
- **Electron 39** for desktop application
- **Tailwind CSS** for styling
- **HTML5 Video** for playback
- **Local Storage** for progress persistence

## Development

This project was bootstrapped with Create React App and extended with Electron support.

### Requirements

- Node.js 16+
- npm or yarn

### Installation

```bash
npm install
```

### TypeScript Configuration

- `tsconfig.json` - React app TypeScript configuration
- `tsconfig.electron.json` - Electron main process TypeScript configuration

## License

Private project for educational purposes.
