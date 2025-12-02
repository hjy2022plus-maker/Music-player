import React from 'react';
import { Play, BarChart2 } from 'lucide-react';
import { Song } from '../types';

interface SongRowProps {
  song: Song;
  index: number;
  isActive: boolean;
  isPlaying: boolean;
  onPlay: (song: Song) => void;
}

const SongRow: React.FC<SongRowProps> = ({ song, index, isActive, isPlaying, onPlay }) => {
  return (
    <div 
      className={`group flex items-center gap-4 px-4 py-2 rounded-md transition-colors cursor-default ${
        isActive ? 'bg-white/10' : 'hover:bg-white/5'
      }`}
      onDoubleClick={() => onPlay(song)}
    >
      <div className="w-6 text-center text-sm text-gray-500 font-medium flex justify-center items-center">
        <span className={`${isActive ? 'hidden' : 'group-hover:hidden'}`}>{index + 1}</span>
        <button 
          onClick={() => onPlay(song)}
          className={`text-gray-300 hover:text-rose-500 ${isActive ? 'block' : 'hidden group-hover:block'}`}
        >
          {isActive && isPlaying ? <BarChart2 size={16} className="text-rose-500 animate-pulse" /> : <Play size={16} fill="currentColor" />}
        </button>
      </div>
      
      <div className="relative w-10 h-10 rounded bg-[#2c2c2c] overflow-hidden flex-shrink-0">
        <img src={song.cover} alt="Cover" className="w-full h-full object-cover" />
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <h4 className={`text-sm font-medium truncate ${isActive ? 'text-rose-500' : 'text-white'}`}>
          {song.title}
        </h4>
        <span className="text-xs text-gray-400 truncate">{song.artist}</span>
      </div>

      <div className="hidden md:block w-1/3 text-sm text-gray-400 truncate">
        {song.album}
      </div>

      <div className="text-xs text-gray-500 font-mono">
        {song.duration}
      </div>
    </div>
  );
};

export default SongRow;
