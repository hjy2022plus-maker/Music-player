import React from 'react';
import { Play } from 'lucide-react';
import { Album } from '../types';

interface AlbumCardProps {
  album: Album;
  onClick: (album: Album) => void;
}

const AlbumCard: React.FC<AlbumCardProps> = ({ album, onClick }) => {
  return (
    <div 
      className="group flex flex-col gap-2 cursor-pointer w-full p-3 rounded-lg hover:bg-white/5 transition-colors"
      onClick={() => onClick(album)}
    >
      <div className="relative aspect-square w-full rounded-md overflow-hidden shadow-lg bg-[#2c2c2c]">
        <img 
          src={album.cover} 
          alt={album.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3 pb-4 pl-4">
           <div className="w-10 h-10 rounded-full bg-rose-500 flex items-center justify-center text-white shadow-xl translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
             <Play size={20} fill="currentColor" className="ml-1" />
           </div>
        </div>
      </div>
      <div>
        <h3 className="text-sm font-medium text-white truncate">{album.title}</h3>
        <p className="text-xs text-gray-400 truncate">{album.artist}</p>
      </div>
    </div>
  );
};

export default AlbumCard;
