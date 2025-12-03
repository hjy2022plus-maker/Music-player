export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  cover: string;
  duration: string;
  url?: string; // Optional real URL, otherwise mock
  accentColor?: string;
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  cover: string;
  year: string;
  songs: Song[];
  accentColor?: string;
}

export interface Playlist {
  id: string;
  title: string;
  description: string;
  cover: string;
  songs: Song[];
}

export enum View {
  HOME = 'HOME',
  BROWSE = 'BROWSE',
  RADIO = 'RADIO',
  ALBUM_DETAILS = 'ALBUM_DETAILS',
  SEARCH = 'SEARCH',
  RECENTLY_ADDED = 'RECENTLY_ADDED',
  ARTISTS = 'ARTISTS',
  ALBUMS = 'ALBUMS'
}

export interface PlayerState {
  currentSong: Song | null;
  isPlaying: boolean;
  volume: number;
  progress: number;
  duration?: number; // Added duration state
  queue: Song[];
}
