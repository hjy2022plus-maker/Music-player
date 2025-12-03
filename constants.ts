import { Album, Song } from './types';

export const REAL_SONGS: Song[] = [];

export const MOCK_ALBUMS: Album[] = [];

export const MOCK_HITS: Song[] = [];

export const MOCK_API_BASE = import.meta.env.VITE_MOCK_API_BASE || 'http://localhost:4000';

export const ACCENT_COLOR = 'text-rose-500';
export const BG_COLOR = 'bg-[#1e1e1e]'; 
export const SIDEBAR_COLOR = 'bg-[#181818]'; 
export const BORDER_COLOR = 'border-[#2c2c2c]';
