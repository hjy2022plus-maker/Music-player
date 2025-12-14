import React from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, ListMusic, MessageSquare, Star, MoreHorizontal, ChevronDown, Shuffle, Repeat, Repeat1 } from 'lucide-react';
import { PlayerState, RepeatMode } from '../types';

interface FullScreenPlayerProps {
  playerState: PlayerState;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onVolumeChange: (val: number) => void;
  onSeek: (time: number) => void;
  onToggleFullScreen: () => void;
  onToggleShuffle?: () => void;
  onToggleRepeat?: () => void;
}

const FullScreenPlayer: React.FC<FullScreenPlayerProps> = ({ 
  playerState, 
  onTogglePlay, 
  onNext, 
  onPrev, 
  onVolumeChange, 
  onSeek,
  onToggleFullScreen,
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

  if (!currentSong) return null;

  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-end pb-12 md:pb-16 px-8 md:px-24 h-full animate-in slide-in-from-bottom duration-500">
      
      {/* Top Bar (Close Button) */}
      <div className="absolute top-6 left-6 md:top-10 md:left-10 z-50">
        <button 
          onClick={onToggleFullScreen}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white transition-colors"
        >
          <ChevronDown size={24} />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 w-full max-w-7xl flex flex-col md:flex-row items-center md:items-end gap-8 md:gap-16 mb-12 min-h-0">
         
         {/* Album Art (Center/Top) */}
         <div className="flex-1 w-full h-full flex items-center justify-center p-4 min-h-0">
            <div className="relative aspect-square max-h-[60vh] md:max-h-[70vh] w-auto shadow-2xl rounded-xl overflow-hidden">
               <img 
                 src={currentSong.cover} 
                 alt={currentSong.title} 
                 className="w-full h-full object-cover"
               />
            </div>
         </div>

         {/* Right Side Lyrics/Visual Placeholder (Hidden on mobile for now to match screenshot 2 simpler view) */}
      </div>

      {/* Bottom Controls Area - Replicating Screenshot 2 Layout */}
      <div className="w-full max-w-5xl flex flex-col gap-6 select-none">
        
        {/* Title Row */}
        <div className="flex items-end justify-between w-full">
           <div className="flex flex-col gap-1">
              <h1 className="text-2xl md:text-4xl font-bold text-white tracking-tight drop-shadow-md">
                 {currentSong.title}
              </h1>
              <h2 className="text-lg md:text-xl text-white/80 font-medium drop-shadow-sm">
                 {currentSong.artist} — <span className="text-white/60">{currentSong.album}</span>
              </h2>
           </div>
           <div className="flex items-center gap-4 mb-2">
              <button className="text-white/50 hover:text-rose-400 transition-colors"><Star size={24} /></button>
              <button className="text-white/50 hover:text-white transition-colors"><MoreHorizontal size={24} /></button>
           </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full group">
           <div className="relative h-1 md:h-2 bg-white/20 rounded-full cursor-pointer overflow-hidden backdrop-blur-sm">
              <div 
                className="absolute top-0 left-0 h-full bg-white/80 group-hover:bg-rose-500 shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all duration-100"
                style={{ width: `${progressPercent}%` }}
              />
              <input 
               type="range" 
               min={0} 
               max={duration || 100} 
               value={progress || 0}
               onChange={(e) => onSeek(Number(e.target.value))}
               className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
             />
           </div>
           <div className="flex justify-between text-xs font-medium text-white/50 mt-2 font-mono">
              <span>{formatTime(progress)}</span>
              <span>{formatTime(duration)}</span>
           </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center justify-between w-full mt-2">
           {/* Shuffle / Repeat */}
           <div className="flex-1 flex justify-start gap-6">
              {onToggleShuffle && (
                 <button 
                    onClick={onToggleShuffle}
                    className={`transition-colors ${isShuffle ? 'text-rose-500' : 'text-white/50 hover:text-white'}`}
                 >
                    <Shuffle size={24} />
                 </button>
              )}
              {onToggleRepeat && (
                 <button 
                    onClick={onToggleRepeat}
                    className={`transition-colors ${repeatMode !== RepeatMode.OFF ? 'text-rose-500' : 'text-white/50 hover:text-white'}`}
                 >
                    {repeatMode === RepeatMode.ONE ? <Repeat1 size={24} /> : <Repeat size={24} />}
                 </button>
              )}
           </div>

           {/* Center Big Controls */}
           <div className="flex-1 flex items-center justify-center gap-8 md:gap-12">
              <button 
                 onClick={onPrev}
                 className="text-white/70 hover:text-white hover:scale-110 transition-all"
              >
                 <SkipBack size={36} fill="currentColor" />
              </button>
              <button 
                 onClick={onTogglePlay} 
                 className="w-20 h-20 md:w-24 md:h-24 flex items-center justify-center bg-white text-black rounded-full hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/10"
              >
                 {isPlaying ? <Pause size={40} fill="currentColor" /> : <Play size={40} fill="currentColor" className="ml-2" />}
              </button>
              <button 
                 onClick={onNext}
                 className="text-white/70 hover:text-white hover:scale-110 transition-all"
              >
                 <SkipForward size={36} fill="currentColor" />
              </button>
           </div>

           {/* Right Volume & Tools */}
           <div className="flex-1 flex items-center justify-end gap-6">
              <div className="hidden md:flex items-center gap-3 bg-black/20 backdrop-blur-md rounded-full px-4 py-2">
                 <Volume2 size={18} className="text-white/70" />
                 <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={volume}
                    onChange={(e) => onVolumeChange(Number(e.target.value))}
                    className="w-24 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:scale-110 transition-all"
                 />
              </div>
              <button className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white/80 transition-colors backdrop-blur-md">
                 <MessageSquare size={20} />
              </button>
              <button className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white/80 transition-colors backdrop-blur-md">
                 <ListMusic size={20} />
              </button>
           </div>
        </div>

      </div>
    </div>
  );
};

export default FullScreenPlayer;
