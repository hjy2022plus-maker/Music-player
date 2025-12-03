# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Apple Music replica built with React 19, TypeScript, Vite, and Tailwind CSS. It's a local music player that allows users to import audio files, read ID3 tags, and play them with a polished UI inspired by Apple Music.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (default port 3000)
npm run dev

# Start mock API server (default port 4000)
npm run mock

# Build for production
npm run build

# Preview production build
npm run preview

# Windows: Start both dev and mock servers
start-dev.bat
```

**Important**: The mock API server must be running for file uploads to work. Run `npm run mock` in a separate terminal before starting the dev server.

## Architecture

### Entry Point & State Management
- Entry: `index.tsx` → `App.tsx` → mounts at `#root`
- `App.tsx` is the main state container holding:
  - `library`: Array of all songs (Song[])
  - `playerState`: Current playback state (PlayerState interface)
  - `audioRef`: HTML audio element reference for actual playback
  - View routing logic (HOME, ALBUMS, ARTISTS, RECENTLY_ADDED, ALBUM_DETAILS)

### Core Data Flow
1. **File Import**: User uploads audio files → `handleImport` in App.tsx:191
   - Creates temporary blob URL for immediate playback
   - Uploads to mock API server (`/upload` endpoint) for persistent URL
   - Reads ID3 tags using jsmediatags library (loaded via CDN in index.html:8)
   - Updates library state with metadata (title, artist, album, cover art)

2. **Playback**: User clicks song → `handlePlaySong` in App.tsx:144
   - Updates `playerState.currentSong` and `isPlaying`
   - `useEffect` at App.tsx:31 triggers audio element play/pause
   - Audio events (timeupdate, ended, loadedmetadata) update progress and duration

3. **Persistence**: LocalStorage is used for:
   - `local_uploaded_library`: Songs with stable HTTP URLs (App.tsx:82-90)
   - `local_uploaded_queue`: Queue state (App.tsx:92-100)
   - Blob URLs are NOT persisted (filtered out before saving)

### Component Structure
- **Sidebar**: Navigation tabs (Home, Recently Added, Artists, Albums)
- **MainView**: Main content area, switches between views based on `currentView` state
  - HOME: Featured banner + full library list
  - ALBUMS: Grid of albums derived from library songs (grouped by album name)
  - ARTISTS: Grid of artists derived from library songs (grouped by artist name)
  - RECENTLY_ADDED: Reverse chronological list of library
  - ALBUM_DETAILS: Song list for selected album/artist
- **PlayerBar**: Bottom player controls (play/pause, seek, volume, queue toggle)
- **FullScreenPlayer**: Expanded player view with large album art
- **QueueList**: Slide-in panel showing current queue
- **SongRow**: Individual song item with play button and metadata
- **AlbumCard**: Album/artist card for grid views

### Mock API Server
Located in `mock/server.js`, provides:
- `POST /upload`: Multipart file upload, saves to `mock/uploads/`, returns stable URL
- `GET /uploads/:filename`: Serves uploaded files
- `GET /albums`, `GET /albums/:id/songs`, `GET /songs`: Mock data from `mock/data.json`
- Auto-retry on port conflict (tries ports 4000-4005)

### Styling & Theming
- Tailwind CSS 4.x with custom config in `tailwind.config.js`
- Dynamic background gradient based on `currentSong.accentColor` (App.tsx:292-313)
- Animated blob effects for visual polish (defined in index.html:32-50)
- Custom scrollbar styles in index.html:11-29

## Key Technical Details

### Path Aliasing
- `@/*` resolves to project root (configured in vite.config.ts:14-16 and tsconfig.json:21-24)
- Use `import { Song } from '@/types'` instead of relative paths

### Audio Handling
- Real HTML `<audio>` element (App.tsx:281-287) controlled by React state
- Duration is extracted on `loadedmetadata` event and updates library (App.tsx:112-131)
- Next/prev navigation wraps around library array (App.tsx:177-189)

### ID3 Tag Reading
- Uses jsmediatags library (CDN loaded in index.html:8)
- Reads title, artist, album, and embedded cover art from audio files
- Cover art is converted from binary to base64 data URL (App.tsx:244-251)
- Fallback to filename and placeholder cover if tags missing

### Import Maps
- React and lucide-react loaded from aistudiocdn.com (index.html:57-66)
- Allows using npm package names in browser without bundling

## Common Tasks

### Adding a New View
1. Add enum value to `View` in `types.ts`
2. Add navigation item in `Sidebar.tsx`
3. Add conditional render in `MainView.tsx`
4. Update `handleNavChange` in `App.tsx` if needed

### Modifying Player Controls
- Player state is in `App.tsx` as `playerState`
- Control handlers: `handleTogglePlay`, `handleNext`, `handlePrev`, `handleSeek`
- Volume is 0-100 scale, converted to 0-1 for audio element (App.tsx:48-51)

### Changing Mock API Port
Set `MOCK_PORT` environment variable or edit `mock/server.js:10`

### Adding New Song Metadata Fields
1. Update `Song` interface in `types.ts`
2. Update ID3 tag reading in `App.tsx:238-270`
3. Update `SongRow.tsx` to display new field

## Important Notes

- **Do not commit** `mock/uploads/` directory (contains user-uploaded files)
- **Blob URLs** (`blob:http://...`) are temporary and lost on page refresh
- **Mock API** must run for uploads; without it, only blob URLs work (no persistence)
- **React 19** is used; ensure compatibility when adding dependencies
- **Chinese UI**: Most user-facing text is in Chinese (本地音乐库, 导入音频文件, etc.)
