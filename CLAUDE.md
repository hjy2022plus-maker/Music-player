# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Apple Music Replica is a React-based music player UI with AI-powered playlist generation using Google's Gemini API. The app features album browsing, song playback controls, and an AI DJ that generates playlists based on natural language prompts.

## Development Commands

- `npm install` - Install dependencies (Node.js required)
- `npm run dev` - Start Vite dev server on http://localhost:3000
- `npm run build` - Build production bundle to `dist/`
- `npm run preview` - Preview production build locally
- `npm run mock` - Start mock API server on http://localhost:4000 (override with `MOCK_PORT` env var)

## Environment Setup

Create `.env.local` in the root directory with:
```
GEMINI_API_KEY=your_api_key_here
```

The Vite config (vite.config.ts:14-15) exposes this as both `process.env.API_KEY` and `process.env.GEMINI_API_KEY` to the client. The Gemini service (services/geminiService.ts:8) expects `process.env.API_KEY`.

## Architecture

### State Management
- **App-level state** (App.tsx:12-18): Single `PlayerState` object manages current song, play/pause status, volume, progress, and queue
- **View routing**: Enum-based view system (types.ts:28-35) with `View.HOME`, `View.ALBUM_DETAILS`, `View.AI_DJ`, etc.
- **No external state library**: All state managed via React hooks (`useState`, `useEffect`)

### Component Structure
- **App.tsx**: Root component, manages player state and view routing
- **Sidebar.tsx**: Navigation menu for switching between views
- **MainView.tsx**: View router that renders different content based on `currentView` prop
  - Home view: Featured banner, album grids, hit songs list
  - Album details view: Album header + song list
  - AI DJ view: Prompt input + generated playlist display
- **PlayerBar.tsx**: Bottom player controls (play/pause, volume, progress)
- **AlbumCard.tsx**: Grid item for album display
- **SongRow.tsx**: List item for song display with play button

### Data Flow
1. **Mock data**: `constants.ts` exports `MOCK_ALBUMS` and `MOCK_HITS` for static content
2. **Mock API**: `mock/server.js` serves data from `mock/data.json` with REST endpoints
3. **AI generation**: `services/geminiService.ts` calls Gemini API with structured output schema
4. **Player simulation**: App.tsx:21-34 uses interval timer to simulate playback progress (no real audio)

### Key Patterns
- **View switching**: `handleNavChange` in App.tsx:62-68 resets state when leaving views
- **Song playback**: `handlePlaySong` in App.tsx:36-49 toggles play/pause for same song, resets progress for new songs
- **AI playlist generation**: MainView.tsx:34-48 handles form submission, loading states, and error handling
- **Styling**: Utility-first CSS classes (Tailwind-like), dark theme with rose accent color

## Mock API Endpoints

When `npm run mock` is running on http://localhost:4000:
- `GET /health` - Server health check
- `GET /albums?q=<search>` - List/search albums
- `GET /albums/:id` - Get album details
- `GET /albums/:id/songs` - Get album tracks
- `GET /songs?q=<search>` - List/search songs

Data source: `mock/data.json`. CORS enabled for local development.

## Gemini Integration

The AI DJ feature (services/geminiService.ts) uses Google's Gemini 2.5 Flash model with structured output:
- Generates 5 songs based on mood/prompt
- Returns JSON array with title, artist, album, duration (MM:SS), and cover URL
- Uses picsum.photos for placeholder cover images
- Falls back to empty array if API key is missing

## Type System

Core types in types.ts:
- `Song`: id, title, artist, album, cover, duration, optional url
- `Album`: id, title, artist, cover, year, songs array
- `PlayerState`: currentSong, isPlaying, volume, progress, queue
- `View`: Enum for routing (HOME, BROWSE, RADIO, ALBUM_DETAILS, SEARCH, AI_DJ)

## Path Aliases

Vite config (vite.config.ts:18-20) sets up `@` alias pointing to project root:
```typescript
import { Song } from '@/types';
```
