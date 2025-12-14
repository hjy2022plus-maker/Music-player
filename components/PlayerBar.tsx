import React from 'react';
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1, Volume2, ListMusic, Maximize2 } from 'lucide-react';
import { PlayerState, RepeatMode } from '../types';

interface PlayerBarProps {
  playerState: PlayerState;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onVolumeChange: (val: number) => void;
  onSeek: (time: number) => void;
  onToggleFullScreen: () => void;
  onToggleQueue: () => void;
  isQueueOpen: boolean;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
}

const PlayerBar: React.FC<PlayerBarProps> = ({ 
  playerState, 
  onTogglePlay, 
  onNext, 
  onPrev, 
  onVolumeChange, 
  onSeek, 
  onToggleFullScreen,
  onToggleQueue,
  isQueueOpen,
  onToggleShuffle,
  onToggleRepeat
}) => {
  const { currentSong, isPlaying, volume, progress, duration, isShuffle, repeatMode } = playerState;

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration ? (progress / duration) * 100 : 0;

  return (
    <div className="h-20 bg-[#1c1c1e]/90 backdrop-blur-2xl border-t border-white/10 flex items-center px-4 justify-between fixed bottom-0 w-full z-50 text-white select-none shadow-2xl transition-all duration-300">
      
      {/* Song Info - Clickable to toggle Full Screen */}
      <div 
        className={`flex items-center w-1/3 gap-4 group ${currentSong ? 'cursor-pointer' : ''}`}
        onClick={() => currentSong && onToggleFullScreen()}
        title={currentSong ? "全屏显示" : ""}
      >
        {currentSong ? (
          <>
            <div className="w-12 h-12 rounded-md bg-gray-800 overflow-hidden shadow-md relative flex-shrink-0 animate-in fade-in zoom-in duration-300">
              <img src={currentSong.cover} alt="Cover" className="w-full h-full object-cover" />
              {/* Expand Overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                 <Maximize2 size={20} className="text-white drop-shadow-md" />
              </div>
            </div>
            <div className="flex flex-col justify-center overflow-hidden">
              <span className="text-sm font-medium truncate group-hover:text-rose-500 transition-colors">{currentSong.title}</span>
              <span className="text-xs text-gray-400 truncate group-hover:text-gray-300">{currentSong.artist}</span>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-4 opacity-50 pl-2">
             <div className="text-xs text-gray-500 font-medium">未播放</div>
          </div>
        )}
      </div>

      {/* Center Controls */}
      <div className="flex flex-col items-center w-1/3 max-w-xl">
        <div className="flex items-center gap-6 mb-1">
          <button 
            onClick={(e) => { e.stopPropagation(); onToggleShuffle(); }}
            className={`transition-colors ${isShuffle ? 'text-rose-500' : 'text-gray-400 hover:text-white'}`}
            title={isShuffle ? "关闭随机播放" : "开启随机播放"}
          >
            <Shuffle size={16} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onPrev(); }} className="text-gray-200 hover:text-white transition-colors hover:scale-110">
            <SkipBack size={24} fill="currentColor" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onTogglePlay(); }}
            className="w-8 h-8 flex items-center justify-center text-white hover:scale-110 transition-transform active:scale-95"
          >
            {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" />}
          </button>
          <button onClick={(e) => { e.stopPropagation(); onNext(); }} className="text-gray-200 hover:text-white transition-colors hover:scale-110">
            <SkipForward size={24} fill="currentColor" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onToggleRepeat(); }}
            className={`transition-colors ${repeatMode !== RepeatMode.OFF ? 'text-rose-500' : 'text-gray-400 hover:text-white'}`}
            title="切换循环模式"
          >
            {repeatMode === RepeatMode.ONE ? <Repeat1 size={16} /> : <Repeat size={16} />}
          </button>
        </div>
        
        {/* Scrubber */}
        <div 
          className="w-full flex items-center gap-2 text-[10px] text-gray-500 font-mono group"
          onClick={(e) => e.stopPropagation()} 
        >
           <span className="w-8 text-right">{formatTime(progress)}</span>
           
           <div className="relative flex-1 h-4 flex items-center cursor-pointer">
             <div className="absolute w-full h-1 bg-[#3a3a3c] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gray-400 group-hover:bg-rose-500 transition-colors" 
                  style={{ width: `${progressPercent}%` }}
                />
             </div>
             <input 
               type="range" 
               min={0} 
               max={duration || 100} 
               value={progress || 0}
               onChange={(e) => onSeek(Number(e.target.value))}
               className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
             />
             <div 
                className="absolute w-3 h-3 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                style={{ left: `${progressPercent}%`, transform: 'translateX(-50%)' }}
              />
           </div>

           <span className="w-8 text-left">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Right Volume & Extras */}
      <div 
        className="flex items-center justify-end w-1/3 gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        
         <button 
            className={`transition-colors ${isQueueOpen ? 'text-rose-500' : 'text-gray-400 hover:text-rose-500'}`}
            onClick={onToggleQueue}
            title="播放队列"
         >
             <ListMusic size={18} />
        </button>
        <div className="flex items-center gap-2 w-24 group">
          <Volume2 size={18} className="text-gray-400 group-hover:text-white transition-colors" />
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={volume}
            onChange={(e) => onVolumeChange(Number(e.target.value))}
            className="w-full h-1 bg-[#3a3a3c] rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:opacity-0 hover:[&::-webkit-slider-thumb]:opacity-100"
          />
        </div>
      </div>
    </div>
  );
};

export default PlayerBar;
