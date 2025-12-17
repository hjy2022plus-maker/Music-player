# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Apple Music Replica - A React + TypeScript music player application that mimics Apple Music's interface. Supports local audio file uploads, playback controls, album/artist management, and data persistence via LocalStorage.

**Tech Stack**: React 19.2.0, TypeScript 5.8.2, Vite 6.2.0, Tailwind CSS 4.1.17, Lucide React 0.555.0

## Development Commands

```bash
# Install dependencies
npm install

# Start frontend dev server (http://localhost:3000)
npm run dev

# Start mock API server (http://localhost:4000)
npm run mock

# Build for production
npm run build

# Preview production build
npm run preview
```

**Important**: For local development, run both `npm run mock` and `npm run dev` simultaneously in separate terminals.

## Architecture

### Core State Management (App.tsx)

The main application component manages all global state:
- **PlayerState**: Current song, playback status, volume, progress, queue, repeat mode, shuffle
- **Library**: User's uploaded music collection
- **View State**: Current view (HOME, ALBUMS, ARTISTS, SEARCH, etc.)
- **Audio Control**: HTML5 `<audio>` element via `audioRef`

Key functions:
- `handlePlaySong()`: Play a specific song and update queue
- `handleNext()` / `handlePrev()`: Navigate between songs with shuffle/repeat logic
- `handleImport()`: Upload local audio files, read ID3 tags, persist to mock API
- `handleSeek()`: Seek to specific position in current song

### Data Persistence

**Three-tier Persistence Strategy**:

1. **LocalStorage** (Client-side cache):
   - Caches uploaded songs for faster initial load
   - Only stores songs with stable HTTP URLs
   - Filtered automatically on save (blob URLs excluded)

2. **Backend Database**:
   - **Development**: `mock/data.json` → `uploadedSongs` array
   - **Production**: Vercel KV (Redis database)
   - Single source of truth for uploaded files
   - Survives browser cache clear

3. **File Storage**:
   - **Development**: `mock/uploads/` directory
   - **Production**: Vercel Blob Storage
   - Actual audio file binaries

**Data Flow**:
- **Upload**: Client → Backend API → Database + File Storage → LocalStorage
- **Load**: Backend API → Client (merge with LocalStorage) → Display
- **Delete**: Client → Backend API → Database + File Storage → LocalStorage

**Benefits**:
- Fast initial load (LocalStorage cache)
- Data survives browser clear (backend database)
- Cross-device sync (shared backend)
- Automatic deduplication by URL

### LocalStorage Keys

- `local_uploaded_library`: Persisted music library (HTTP URLs only)
- `local_uploaded_queue`: Persisted playback queue
- `local_player_state`: Player state (volume, repeat mode, shuffle)
- `local_current_song`: Currently playing song

**Important**: Only songs with stable HTTP URLs are persisted. Blob URLs are filtered out as they cannot survive page refreshes.

### Component Architecture

**App.tsx** → Root component, manages all state and audio playback
├── **Sidebar.tsx** → Left navigation (search, view switching)
├── **MainView.tsx** → Content area (renders different views based on currentView)
│   ├── HOME: Music library with import button
│   ├── ALBUMS: Album grid view
│   ├── ARTISTS: Artist grid view
│   ├── RECENTLY_ADDED: Recently added songs
│   ├── ALBUM_DETAILS: Album detail page with song list
│   └── SEARCH: Search results
├── **PlayerBar.tsx** → Bottom playback controls
├── **FullScreenPlayer.tsx** → Immersive full-screen player (toggled by isFullScreen)
└── **QueueList.tsx** → Right sidebar queue panel (toggled by isQueueOpen)

**Reusable Components**:
- **SongRow.tsx**: Song list item with play button, info, duration, delete action
- **AlbumCard.tsx**: Album card with cover, title, artist, hover play button

### Type System (types.ts)

```typescript
interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  cover: string;
  duration: string;  // Format: "3:45"
  url?: string;      // Audio file URL
  accentColor?: string;
}

interface Album {
  id: string;
  title: string;
  artist: string;
  cover: string;
  year: string;
  songs: Song[];
  accentColor?: string;
}

interface PlayerState {
  currentSong: Song | null;
  isPlaying: boolean;
  volume: number;        // 0-100
  progress: number;      // Seconds
  duration?: number;     // Seconds
  queue: Song[];
  repeatMode: RepeatMode;  // OFF, ALL, ONE
  isShuffle: boolean;
}

enum View {
  HOME, BROWSE, RADIO, ALBUM_DETAILS, SEARCH,
  RECENTLY_ADDED, ARTISTS, ALBUMS, AI_DJ
}
```

### Mock API Server (mock/server.js)

Node.js HTTP server providing REST API for development:

**Endpoints**:
- `GET /health` - Health check
- `POST /upload` - Upload audio file (multipart/form-data), saves file and metadata to data.json
- `GET /uploads/:filename` - Serve uploaded files
- `GET /uploaded-songs` - List user-uploaded songs from data.json
- `DELETE /delete?id={fileId}` - Delete file and metadata by ID
- `PUT/PATCH /update?id={fileId}` - Update file metadata by ID
- `GET /albums` - List albums (supports `?q=search`)
- `GET /albums/:id` - Album details
- `GET /albums/:id/songs` - Album songs
- `GET /songs` - List songs (supports `?q=search`)

**Features**:
- CORS enabled for all routes
- Automatic port conflict resolution (tries next port if 4000 is busy)
- Multipart form data parsing (no external dependencies)
- File uploads stored in `mock/uploads/`
- Metadata stored in `mock/data.json` → `uploadedSongs` array

### Vercel API Routes (api/)

Serverless API routes for production deployment:

**api/upload.js** - File upload endpoint
- Uploads file to Vercel Blob Storage
- Saves metadata to Vercel KV (Redis)
- Returns complete file metadata object

**api/songs.js** - List uploaded files
- Fetches all uploaded songs from Vercel KV
- Returns array of file metadata

**api/delete.js** - Delete file endpoint
- Deletes file from Vercel Blob Storage
- Removes metadata from Vercel KV
- Accepts `?id={fileId}` query parameter

**api/update.js** - Update metadata endpoint
- Updates file metadata in Vercel KV
- Accepts JSON body with updatable fields
- Accepts `?id={fileId}` query parameter

### File Upload Flow

1. User selects local audio file via file input
2. Create temporary Blob URL for immediate playback
3. Upload file to backend:
   - **Development**: `POST ${MOCK_API_BASE}/upload` → saves to `mock/uploads/`
   - **Production**: `POST /api/upload` → uploads to Vercel Blob Storage
4. Backend saves complete file metadata:
   - **Development**: Appends to `mock/data.json` → `uploadedSongs` array
   - **Production**: Stores in Vercel KV (Redis database)
5. Frontend receives file metadata object with unique ID
6. Replace temporary song with server metadata (using server-assigned ID)
7. Read ID3 tags using `jsmediatags` library (loaded via CDN in index.html)
8. Update song metadata locally (title, artist, album, cover from ID3)
9. Sync ID3 metadata to server via `PATCH /update?id={fileId}`
10. Save to LocalStorage (only HTTP URLs, not Blob URLs)

**File Metadata Structure**:
```typescript
{
  // File identifiers
  id: "file-1734432000000-abc123",        // Unique file ID
  blobId: "pathname-or-filename",          // Storage identifier

  // File information
  filename: "1734432000000_song.mp3",      // Stored filename
  originalName: "song.mp3",                // Original upload name
  size: 3456789,                           // File size in bytes
  mimeType: "audio/mpeg",                  // MIME type

  // Storage URLs
  url: "https://blob.vercel-storage.com/...",
  downloadUrl: "https://blob.vercel-storage.com/...",

  // Music metadata (from ID3 tags or defaults)
  title: "Song Title",
  artist: "Artist Name",
  album: "Album Name",
  duration: "3:45",
  cover: "/covers/default.jpg",
  accentColor: "#ff006e",

  // Timestamps
  uploadedAt: "2024-12-17T10:00:00.000Z",
  createdAt: "2024-12-17T10:00:00.000Z",
  updatedAt: "2024-12-17T10:05:00.000Z",

  // Business associations
  userId: null,                            // For future user system
  tags: ["uploaded"],                      // File tags

  // Status
  status: "active"                         // active, deleted, processing
}
```

**Data Restoration on Page Load**:
1. Load songs from LocalStorage (if available)
2. Fetch uploaded songs from backend API:
   - **Development**: `GET ${MOCK_API_BASE}/uploaded-songs`
   - **Production**: `GET /api/songs`
3. Merge and deduplicate by URL
4. Display complete library to user

**File Deletion Flow**:
1. User clicks delete button on song
2. Remove from local state immediately (optimistic update)
3. Call backend API:
   - **Development**: `DELETE ${MOCK_API_BASE}/delete?id={fileId}`
   - **Production**: `DELETE /api/delete?id={fileId}`
4. Backend deletes both file and metadata:
   - File from Blob Storage / local uploads directory
   - Metadata from KV database / data.json

**Metadata Update Flow**:
1. ID3 tags are read after upload
2. Extract metadata (title, artist, album, cover)
3. Update local state immediately
4. Sync to backend:
   - **Development**: `PATCH ${MOCK_API_BASE}/update?id={fileId}`
   - **Production**: `PATCH /api/update?id={fileId}`
5. Backend updates metadata in KV database / data.json

**ID3 Tag Reading** (App.tsx):
```typescript
if ((window as any).jsmediatags) {
  (window as any).jsmediatags.read(file, {
    onSuccess: (tag: any) => {
      const { title, artist, album, picture } = tag.tags;
      // Update song info with metadata
    }
  });
}
```

### Playback Logic

**Shuffle Mode**: When enabled, `handleNext()` randomly selects next song (avoiding current song)

**Repeat Modes**:
- `OFF`: Stop at end of queue
- `ALL`: Loop back to first song after last song
- `ONE`: Repeat current song indefinitely

**Audio Events** (App.tsx):
- `onTimeUpdate`: Update progress state
- `onEnded`: Trigger `handleNext()` or repeat current song
- `onLoadedMetadata`: Capture song duration

### Dynamic Background Effect

Background gradient changes based on current song's `accentColor`:
```typescript
background: playerState.currentSong?.accentColor
  ? `linear-gradient(to bottom, ${playerState.currentSong.accentColor}aa, #121212)`
  : '#121212'
```

Animated blob effect with blur and mix-blend-overlay for visual depth.

### Styling System

**Color Scheme** (constants.ts):
- Accent: `text-rose-500` (rose red)
- Background: `bg-[#1e1e1e]` (dark gray)
- Sidebar: `bg-[#181818]` (darker gray)
- Border: `border-[#2c2c2c]` (medium gray)

**Tailwind Config**: Configured for dark mode with custom content paths including root-level components.

**Animation Classes**:
- `animate-in fade-in duration-300` - Fade in
- `zoom-in duration-300` - Zoom in
- `slide-in-from-bottom duration-500` - Slide up
- `hover:scale-105 transition-transform` - Hover scale
- `transition-colors duration-[1500ms]` - Smooth color transitions

### Environment Variables

```bash
# .env.local (development)
VITE_MOCK_API_BASE=http://localhost:4000

# .env.production (production)
VITE_MOCK_API_BASE=https://your-vercel-url.vercel.app
```

Access in code: `import.meta.env.VITE_MOCK_API_BASE`

## Deployment

### Vercel Deployment (Recommended)

The project is configured for Vercel with serverless API routes:
- `api/upload.js` - File upload endpoint (uploads to Vercel Blob Storage + saves metadata to Vercel KV)
- `api/songs.js` - Get uploaded songs endpoint (fetches from Vercel KV)
- `api/delete.js` - Delete file endpoint (removes from Blob Storage + KV)
- `api/update.js` - Update metadata endpoint (updates in KV)
- `vercel.json` - Routing and CORS configuration

**Deploy**:
```bash
npm i -g vercel
vercel login
vercel --prod
```

**Setup Vercel KV Database**:
1. In Vercel dashboard, go to Storage → Create Database → KV
2. Link KV database to your project
3. Environment variables (`KV_REST_API_URL`, `KV_REST_API_TOKEN`) are automatically configured

**Setup Vercel Blob Storage**:
1. In Vercel dashboard, go to Storage → Create Database → Blob
2. Link Blob storage to your project
3. Environment variable (`BLOB_READ_WRITE_TOKEN`) is automatically configured

**Install Dependencies**:
```bash
npm install @vercel/kv @vercel/blob
```

**Data Structure in Vercel KV**:
- Key: `uploaded-songs`
- Value: Array of file metadata objects

**Limitations**:
- Vercel serverless functions have 4.5MB file size limit for uploads
- Vercel Blob Storage has storage limits based on plan (Hobby: 500GB)
- Vercel KV has storage limits based on plan (Hobby: 256MB)
- For larger files or more storage, upgrade plan or use external services (Cloudinary, AWS S3)

### Alternative: Pure Frontend (IndexedDB)

For fully static deployment without backend, implement IndexedDB storage:
1. Install `idb` library: `npm install idb`
2. Store audio files as Blobs in IndexedDB
3. Recreate Blob URLs on page load
4. Remove dependency on mock API

See `DEPLOYMENT.md` for detailed implementation guide.

## Code Conventions

- **TypeScript Strict Mode**: All components use TypeScript with strict type checking
- **Functional Components**: Use React function components with hooks
- **State Updates**: Use functional updates to avoid closure issues: `setState(prev => ({ ...prev, ... }))`
- **Tailwind CSS**: Use utility classes exclusively, avoid custom CSS
- **useMemo**: Cache derived data (album lists, artist lists) to prevent unnecessary recalculations
- **useRef**: For audio element and preventing re-renders

## Common Issues

**Audio won't play**:
- Check browser audio format support (MP3, AAC, OGG)
- Verify CORS headers on audio file URLs
- Ensure URL is valid and accessible

**Upload fails**:
- Confirm mock API server is running (`npm run mock`)
- Check `VITE_MOCK_API_BASE` environment variable
- Verify file size and format

**LocalStorage data loss**:
- Only HTTP URLs persist (Blob URLs are filtered)
- Check browser privacy settings
- Verify LocalStorage quota not exceeded

**Styles not applying**:
- Ensure Tailwind CSS is properly configured
- Check PostCSS configuration
- Clear browser cache and rebuild

## File Structure Notes

- Root-level components: `App.tsx`, `types.ts`, `constants.ts`, `index.html`
- Component directory: `components/*.tsx`
- Mock API: `mock/server.js`, `mock/data.json`, `mock/uploads/`
- Build output: `dist/`
- Static assets: `covers/`, `music/`
- Vercel serverless: `api/*.js`

## Performance Optimizations

- `useMemo` for derived album/artist lists from library
- `useRef` for audio element to avoid re-renders
- Image lazy loading: `loading="lazy"` on album covers
- LocalStorage debouncing to reduce write frequency
- Vite code splitting in production builds
