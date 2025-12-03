import React, { useEffect, useRef } from 'react';
import { Song } from '../types';
import { Play, BarChart2 } from 'lucide-react';

interface QueueListProps {
  isOpen: boolean;
  library: Song[];
  currentSong: Song | null;
  isPlaying: boolean;
  onPlay: (song: Song) => void;
  onClose: () => void;
}

const QueueList: React.FC<QueueListProps> = ({ isOpen, library, currentSong, isPlaying, onPlay, onClose }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && currentSong && scrollRef.current) {
        // Find the active element and scroll to it
        const activeEl = document.getElementById(`queue-item-${currentSong.id}`);
        if (activeEl) {
            activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
  }, [isOpen, currentSong]);

  return (
    <div 
      className={`fixed top-0 right-0 bottom-20 w-80 bg-[#1c1c1e]/95 backdrop-blur-xl border-l border-white/10 z-30 transform transition-transform duration-300 ease-in-out shadow-2xl ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="p-6 border-b border-white/5 flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">待播清单</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-white text-sm">关闭</button>
      </div>
      
      <div className="overflow-y-auto h-[calc(100%-80px)] p-2 space-y-1 no-scrollbar" ref={scrollRef}>
        {library.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-500 text-sm gap-2">
                <span>暂无歌曲</span>
            </div>
        ) : (
            library.map((song) => {
                const isActive = currentSong?.id === song.id;
                return (
                    <div 
                        key={song.id}
                        id={`queue-item-${song.id}`}
                        onClick={() => onPlay(song)}
                        className={`flex items-center gap-3 p-2 rounded-md cursor-pointer group transition-colors ${
                            isActive ? 'bg-white/10' : 'hover:bg-white/5'
                        }`}
                    >
                        <div className="relative w-10 h-10 rounded overflow-hidden flex-shrink-0 bg-[#333]">
                            <img src={song.cover} alt="" className="w-full h-full object-cover" />
                            <div className={`absolute inset-0 bg-black/40 flex items-center justify-center ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                {isActive && isPlaying ? (
                                    <BarChart2 size={16} className="text-rose-500 animate-pulse" />
                                ) : (
                                    <Play size={16} className="text-white" fill="currentColor" />
                                )}
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className={`text-sm font-medium truncate ${isActive ? 'text-rose-500' : 'text-white'}`}>
                                {song.title}
                            </h4>
                            <p className="text-xs text-gray-400 truncate">{song.artist}</p>
                        </div>
                    </div>
                );
            })
        )}
      </div>
    </div>
  );
};

export default QueueList;