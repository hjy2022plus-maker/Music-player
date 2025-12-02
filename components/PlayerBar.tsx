import React from 'react';
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Volume2, ListMusic, MessageSquare, Music } from 'lucide-react';
import { Song, PlayerState } from '../types';

interface PlayerBarProps {
  playerState: PlayerState;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onVolumeChange: (val: number) => void;
}

const PlayerBar: React.FC<PlayerBarProps> = ({ playerState, onTogglePlay, onNext, onPrev, onVolumeChange }) => {
  const { currentSong, isPlaying, volume, progress } = playerState;

  // Mock progress simulation
  const progressPercent = currentSong ? (progress / 200) * 100 : 0; // Simplified

  return (
    <div className="h-20 bg-[#1c1c1e]/80 backdrop-blur-2xl border-t border-white/10 flex items-center px-4 justify-between fixed bottom-0 w-full z-50 text-white select-none shadow-2xl">
      
      {/* Song Info */}
      <div className="flex items-center w-1/3 gap-4">
        {currentSong ? (
          <>
            <div className="w-12 h-12 rounded-md bg-gray-800 overflow-hidden shadow-md group relative flex-shrink-0">
              <img src={currentSong.cover} alt="Cover" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/20 hidden group-hover:flex items-center justify-center">
                 {/* Tiny overlay indicator could go here */}
              </div>
            </div>
            <div className="flex flex-col justify-center overflow-hidden">
              <span className="text-sm font-medium truncate cursor-pointer hover:underline">{currentSong.title}</span>
              <span className="text-xs text-gray-400 truncate cursor-pointer hover:underline hover:text-gray-300">{currentSong.artist}</span>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-4 opacity-50">
             <div className="w-12 h-12 bg-[#2c2c2c] rounded-md flex items-center justify-center">
                <Music size={20} className="text-gray-500"/>
             </div>
             <div className="text-xs text-gray-500">Not Playing</div>
          </div>
        )}
      </div>

      {/* Center Controls */}
      <div className="flex flex-col items-center w-1/3 max-w-xl">
        <div className="flex items-center gap-6 mb-1">
          <button className="text-gray-400 hover:text-rose-500 transition-colors">
            <Shuffle size={16} />
          </button>
          <button onClick={onPrev} className="text-gray-200 hover:text-white transition-colors">
            <SkipBack size={24} fill="currentColor" />
          </button>
          <button 
            onClick={onTogglePlay}
            className="w-8 h-8 flex items-center justify-center text-white hover:scale-105 transition-transform"
          >
            {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" />}
          </button>
          <button onClick={onNext} className="text-gray-200 hover:text-white transition-colors">
            <SkipForward size={24} fill="currentColor" />
          </button>
          <button className="text-gray-400 hover:text-rose-500 transition-colors">
            <Repeat size={16} />
          </button>
        </div>
        {/* Scrubber */}
        <div className="w-full flex items-center gap-2 text-[10px] text-gray-500 font-mono">
           <span>0:00</span>
           <div className="flex-1 h-1 bg-[#3a3a3c] rounded-full relative group cursor-pointer">
              <div 
                className="absolute top-0 left-0 h-full bg-gray-400 rounded-full group-hover:bg-rose-500 transition-colors" 
                style={{ width: `${progressPercent}%` }}
              />
              <div 
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ left: `${progressPercent}%` }}
              />
           </div>
           <span>-{currentSong?.duration || '0:00'}</span>
        </div>
      </div>

      {/* Right Volume & Extras */}
      <div className="flex items-center justify-end w-1/3 gap-4">
        <button className="text-gray-400 hover:text-rose-500 transition-colors">
             <MessageSquare size={18} />
        </button>
         <button className="text-gray-400 hover:text-rose-500 transition-colors">
             <ListMusic size={18} />
        </button>
        <div className="flex items-center gap-2 w-24">
          <Volume2 size={18} className="text-gray-400" />
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={volume}
            onChange={(e) => onVolumeChange(Number(e.target.value))}
            className="w-full h-1 bg-[#3a3a3c] rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
          />
        </div>
      </div>
    </div>
  );
};

export default PlayerBar;