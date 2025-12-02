import React, { useState } from 'react';
import { Album, Song, View } from '../types';
import { MOCK_ALBUMS, MOCK_HITS } from '../constants';
import AlbumCard from './AlbumCard';
import SongRow from './SongRow';
import { generateSmartPlaylist } from '../services/geminiService';
import { ChevronRight, Sparkles, Loader } from 'lucide-react';

interface MainViewProps {
  currentView: View;
  activeAlbum: Album | null;
  currentSong: Song | null;
  isPlaying: boolean;
  onPlaySong: (song: Song) => void;
  onAlbumClick: (album: Album) => void;
  onBack: () => void;
}

const MainView: React.FC<MainViewProps> = ({ 
  currentView, 
  activeAlbum, 
  currentSong, 
  isPlaying, 
  onPlaySong, 
  onAlbumClick,
  onBack 
}) => {
  // AI DJ State
  const [prompt, setPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPlaylist, setAiPlaylist] = useState<Song[]>([]);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    
    setAiLoading(true);
    setAiError(null);
    try {
      const songs = await generateSmartPlaylist(prompt);
      setAiPlaylist(songs);
    } catch (err) {
      setAiError('Something went wrong. Please check your API key or try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const SectionHeader = ({ title, showAll = true }: { title: string; showAll?: boolean }) => (
    <div className="flex items-center justify-between mb-4 mt-8 px-2 border-b border-white/5 pb-2">
      <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>
      {showAll && <button className="text-xs font-medium text-rose-500 hover:underline flex items-center">See All <ChevronRight size={14} /></button>}
    </div>
  );

  // VIEW: ALBUM DETAILS
  if (currentView === View.ALBUM_DETAILS && activeAlbum) {
    return (
      <div className="pb-32 animate-in fade-in duration-300">
        <button onClick={onBack} className="text-sm text-gray-400 hover:text-white mb-6 hover:underline flex items-center gap-1">
          &larr; Back
        </button>
        <div className="flex flex-col md:flex-row gap-8 mb-8 items-end">
          <div className="w-64 h-64 shadow-2xl rounded-lg overflow-hidden flex-shrink-0">
             <img src={activeAlbum.cover} alt={activeAlbum.title} className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col gap-2 pb-2">
            <h4 className="text-sm font-bold text-rose-500 uppercase tracking-widest">Album</h4>
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">{activeAlbum.title}</h1>
            <div className="flex items-center gap-2 text-gray-300 font-medium text-lg mt-2">
               <span>{activeAlbum.artist}</span>
               <span className="text-gray-500">•</span>
               <span className="text-gray-400 text-sm">{activeAlbum.year} • {activeAlbum.songs.length} songs</span>
            </div>
          </div>
        </div>

        <div className="bg-[#1c1c1e]/50 rounded-xl p-2 md:p-6 backdrop-blur-sm">
           {activeAlbum.songs.map((song, idx) => (
             <SongRow 
               key={song.id} 
               song={song} 
               index={idx} 
               isActive={currentSong?.id === song.id}
               isPlaying={isPlaying}
               onPlay={onPlaySong} 
             />
           ))}
        </div>
      </div>
    );
  }

  // VIEW: AI DJ
  if (currentView === View.AI_DJ) {
    return (
      <div className="max-w-3xl mx-auto pt-10 pb-32 animate-in slide-in-from-bottom-4 duration-500">
         <div className="text-center mb-10">
           <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-tr from-rose-500 to-purple-600 mb-4 shadow-lg shadow-rose-500/20">
              <Sparkles className="text-white" size={32} />
           </div>
           <h1 className="text-3xl font-bold text-white mb-2">Gemini AI DJ</h1>
           <p className="text-gray-400">Describe your vibe, and let AI curate the perfect mix.</p>
         </div>

         <form onSubmit={handleAiSubmit} className="relative mb-12 group">
            <div className="absolute inset-0 bg-gradient-to-r from-rose-500 to-purple-600 rounded-lg blur opacity-25 group-hover:opacity-50 transition-opacity"></div>
            <input 
              type="text" 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. 'Upbeat 80s pop for a road trip' or 'Sad songs for a rainy Sunday'..."
              className="relative w-full bg-[#2c2c2c] text-white p-4 pl-6 pr-14 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-rose-500 placeholder-gray-500 shadow-xl"
            />
            <button 
              type="submit" 
              disabled={aiLoading}
              className="absolute right-2 top-2 bottom-2 bg-rose-600 text-white px-4 rounded-md font-medium hover:bg-rose-500 disabled:opacity-50 transition-colors"
            >
              {aiLoading ? <Loader className="animate-spin" size={20} /> : 'Go'}
            </button>
         </form>

         {aiError && (
           <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-center mb-8">
             {aiError}
           </div>
         )}

         {aiPlaylist.length > 0 && (
           <div className="bg-[#1c1c1e] rounded-xl overflow-hidden border border-white/5">
              <div className="p-4 border-b border-white/5 bg-white/5">
                 <h3 className="font-semibold text-white">Generated Playlist</h3>
              </div>
              <div className="p-2">
                {aiPlaylist.map((song, idx) => (
                  <SongRow 
                    key={song.id} 
                    song={song} 
                    index={idx} 
                    isActive={currentSong?.id === song.id}
                    isPlaying={isPlaying}
                    onPlay={onPlaySong} 
                  />
                ))}
              </div>
           </div>
         )}
      </div>
    );
  }

  // VIEW: HOME (Default)
  return (
    <div className="pb-32 animate-in fade-in duration-500">
      
      {/* Featured Banner */}
      <div className="w-full h-[300px] md:h-[400px] rounded-xl overflow-hidden relative mb-8 group cursor-pointer shadow-2xl">
        <img 
          src="https://picsum.photos/id/40/1200/600" 
          alt="Featured" 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8">
           <span className="text-xs font-bold text-rose-500 uppercase tracking-widest mb-2">New Release</span>
           <h2 className="text-4xl md:text-5xl font-bold text-white mb-2">Spatial Audio Experience</h2>
           <p className="text-gray-200 max-w-lg">Immerse yourself in sound with our curated collection of spatial audio tracks.</p>
        </div>
      </div>

      <SectionHeader title="Top Picks For You" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {MOCK_ALBUMS.map(album => (
          <AlbumCard key={album.id} album={album} onClick={onAlbumClick} />
        ))}
      </div>

      <SectionHeader title="New Music" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {MOCK_ALBUMS.slice().reverse().map(album => (
          <AlbumCard key={`new-${album.id}`} album={album} onClick={onAlbumClick} />
        ))}
      </div>

      <SectionHeader title="Hit Songs" showAll={false} />
      <div className="bg-[#1c1c1e] rounded-xl p-2 border border-white/5">
        {MOCK_HITS.slice(0, 5).map((song, idx) => (
           <SongRow 
             key={song.id} 
             song={song} 
             index={idx} 
             isActive={currentSong?.id === song.id}
             isPlaying={isPlaying}
             onPlay={onPlaySong} 
           />
        ))}
      </div>

    </div>
  );
};

export default MainView;
