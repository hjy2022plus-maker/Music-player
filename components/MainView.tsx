import React, { useRef, useMemo } from 'react';
import { Album, Song, View } from '../types';
import SongRow from './SongRow';
import AlbumCard from './AlbumCard';
import { ChevronRight, Upload, Music, Play, Clock, Disc, User } from 'lucide-react';

interface MainViewProps {
  currentView: View;
  activeAlbum: Album | null;
  currentSong: Song | null;
  isPlaying: boolean;
  library: Song[];
  onPlaySong: (song: Song, sourceList?: Song[]) => void;
  onAlbumClick: (album: Album) => void;
  onBack: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDeleteSong?: (song: Song) => void;
  searchTerm: string;
  searchResults: Song[];
}

const MainView: React.FC<MainViewProps> = ({
  currentView,
  activeAlbum,
  currentSong,
  isPlaying,
  library,
  onPlaySong,
  onAlbumClick,
  onBack,
  onImport,
  onDeleteSong,
  searchTerm,
  searchResults
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Group songs by Album for ALBUMS view
  const derivedAlbums = useMemo(() => {
    const albumsMap: Record<string, Album> = {};
    library.forEach(song => {
      const key = song.album || 'Unknown Album';
      if (!albumsMap[key]) {
        albumsMap[key] = {
          id: key,
          title: key,
          artist: song.artist,
          cover: song.cover,
          year: '',
          songs: []
        };
      }
      albumsMap[key].songs.push(song);
    });
    return Object.values(albumsMap);
  }, [library]);

  // Group songs by Artist for ARTISTS view
  // We treat an "Artist" entry like an Album object for re-use of the details view
  const derivedArtists = useMemo(() => {
    const artistsMap: Record<string, Album> = {};
    library.forEach(song => {
      const key = song.artist || 'Unknown Artist';
      if (!artistsMap[key]) {
        artistsMap[key] = {
          id: key,
          title: key,
          artist: 'Artist Collection', // Marker to distinguish
          cover: song.cover,
          year: '',
          songs: []
        };
      }
      artistsMap[key].songs.push(song);
    });
    return Object.values(artistsMap);
  }, [library]);

  const SectionHeader = ({ title, showAll = true }: { title: string; showAll?: boolean }) => (
    <div className="flex items-center justify-between mb-4 mt-8 px-2 border-b border-white/5 pb-2">
      <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>
      {showAll && library.length > 0 && <button className="text-xs font-medium text-rose-500 hover:underline flex items-center">View all <ChevronRight size={14} /></button>}
    </div>
  );

  // VIEW: ALBUM DETAILS (Re-used for Artists as well)
  if (currentView === View.ALBUM_DETAILS && activeAlbum) {
    const isArtistView = activeAlbum.artist === 'Artist Collection';
    return (
      <div className="pb-32 animate-in fade-in duration-300">
        <button onClick={onBack} className="text-sm text-gray-400 hover:text-white mb-6 hover:underline flex items-center gap-1">
          &larr; Back
        </button>
        <div className="flex flex-col md:flex-row gap-8 mb-8 items-end">
          <div className={`w-64 h-64 shadow-2xl overflow-hidden flex-shrink-0 ${isArtistView ? 'rounded-full' : 'rounded-lg'}`}>
             <img src={activeAlbum.cover} alt={activeAlbum.title} className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col gap-2 pb-2">
            <h4 className="text-sm font-bold text-rose-500 uppercase tracking-widest">
               {isArtistView ? 'Artist' : 'Album'}
            </h4>
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">{activeAlbum.title}</h1>
            <div className="flex items-center gap-2 text-gray-300 font-medium text-lg mt-2">
               {!isArtistView && (
                 <>
                   <span>{activeAlbum.artist}</span>
                   <span className="text-gray-500"> • </span>
                 </>
               )}
               <span className="text-gray-400 text-sm">{activeAlbum.songs.length} {activeAlbum.songs.length === 1 ? 'track' : 'tracks'}</span>
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
               onPlay={(s) => onPlaySong(s, activeAlbum.songs)}
               onDelete={onDeleteSong}
             />
           ))}
        </div>
      </div>
    );
  }

  // VIEW: RECENTLY ADDED
  if (currentView === View.RECENTLY_ADDED) {
     const recentSongs = library.slice().reverse();
     return (
        <div className="pb-32 animate-in fade-in duration-300">
            <SectionHeader title="最近添加" showAll={false} />
            {library.length > 0 ? (
                <div className="bg-[#1c1c1e] rounded-xl p-2 border border-white/5 mb-8">
                {recentSongs.map((song, idx) => (
                    <SongRow
                    key={song.id}
                    song={song}
                    index={idx}
                    isActive={currentSong?.id === song.id}
                    isPlaying={isPlaying}
                    onPlay={(s) => onPlaySong(s, recentSongs)}
                    onDelete={onDeleteSong}
                    />
                ))}
                </div>
            ) : (
                <div className="text-gray-500 text-center py-20 flex flex-col items-center gap-4">
                   <Clock size={48} className="opacity-20" />
                   <p>暂无最近添加的音乐</p>
                </div>
            )}
        </div>
     )
  }

  // VIEW: ALBUMS
  if (currentView === View.ALBUMS) {
      return (
          <div className="pb-32 animate-in fade-in duration-300">
              <SectionHeader title="专辑" showAll={false} />
              {derivedAlbums.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                      {derivedAlbums.map(album => (
                          <AlbumCard key={album.id} album={album} onClick={onAlbumClick} />
                      ))}
                  </div>
              ) : (
                <div className="text-gray-500 text-center py-20 flex flex-col items-center gap-4">
                   <Disc size={48} className="opacity-20" />
                   <p>暂无专辑信息</p>
                </div>
              )}
          </div>
      )
  }

  // VIEW: ARTISTS
  if (currentView === View.ARTISTS) {
    return (
        <div className="pb-32 animate-in fade-in duration-300">
            <SectionHeader title="艺人" showAll={false} />
            {derivedArtists.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {derivedArtists.map(artist => (
                        <div 
                            key={artist.id} 
                            onClick={() => onAlbumClick(artist)} // Reusing album click to show songs
                            className="group flex flex-col items-center gap-3 cursor-pointer p-4 rounded-xl hover:bg-white/5 transition-colors"
                        >
                            <div className="relative w-full aspect-square rounded-full overflow-hidden shadow-lg bg-[#2c2c2c]">
                                <img src={artist.cover} alt={artist.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Play size={32} fill="currentColor" className="text-white drop-shadow-lg" />
                                </div>
                            </div>
                            <div className="text-center">
                                <h3 className="text-base font-bold text-white truncate w-full">{artist.title}</h3>
                                <p className="text-xs text-gray-400">艺人</p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
              <div className="text-gray-500 text-center py-20 flex flex-col items-center gap-4">
                   <User size={48} className="opacity-20" />
                   <p>暂无艺人信息</p>
              </div>
            )}
        </div>
    )
  }

  // VIEW: SEARCH
  if (currentView === View.SEARCH) {
    const hasTerm = searchTerm.trim().length > 0;
    return (
      <div className="pb-32 animate-in fade-in duration-300">
        <SectionHeader title="搜索结果" showAll={false} />
        {!hasTerm ? (
          <div className="bg-[#1c1c1e] rounded-xl p-12 border border-white/5 mb-8 text-center text-gray-500">
            输入关键词以查找已上传的音频文件。
          </div>
        ) : searchResults.length > 0 ? (
          <div className="bg-[#1c1c1e] rounded-xl p-2 border border-white/5 mb-8">
            {searchResults.map((song, idx) => (
              <SongRow
                key={song.id}
                song={song}
                index={idx}
                isActive={currentSong?.id === song.id}
                isPlaying={isPlaying}
                onPlay={(s) => onPlaySong(s, searchResults)}
                onDelete={onDeleteSong}
              />
            ))}
          </div>
        ) : (
          <div className="bg-[#1c1c1e] rounded-xl p-12 border border-white/5 mb-8 text-center text-gray-500">
            未找到匹配的音频文件。
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
          src="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=2000&auto=format&fit=crop" 
          alt="Featured" 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 filter brightness-75" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8">
           <span className="text-xs font-bold text-rose-500 uppercase tracking-widest mb-2">本地音乐库</span>
           <h2 className="text-4xl md:text-5xl font-bold text-white mb-2">高品质音乐</h2>
           <p className="text-gray-200 max-w-lg">导入您的本地音频文件，享受无损播放体验。</p>
           
           <button 
             onClick={() => fileInputRef.current?.click()}
             className="mt-6 bg-rose-600 hover:bg-rose-500 text-white px-6 py-3 rounded-full font-medium transition-colors w-fit flex items-center gap-2 shadow-lg"
           >
             <Upload size={18} />
             导入音频文件
           </button>
           <input 
             type="file" 
             ref={fileInputRef} 
             onChange={onImport} 
             className="hidden" 
             multiple 
             accept="audio/*" 
           />
        </div>
      </div>

      <SectionHeader title="我的曲库" showAll={true} />
      
      {library.length > 0 ? (
        <div className="bg-[#1c1c1e] rounded-xl p-2 border border-white/5 mb-8">
          {library.map((song, idx) => (
             <SongRow
               key={song.id}
               song={song}
               index={idx}
               isActive={currentSong?.id === song.id}
               isPlaying={isPlaying}
               onPlay={(s) => onPlaySong(s, library)}
               onDelete={onDeleteSong}
             />
          ))}
        </div>
      ) : (
        <div className="bg-[#1c1c1e] rounded-xl p-12 border border-white/5 mb-8 flex flex-col items-center justify-center text-center text-gray-500 gap-4 border-dashed">
           <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-2">
             <Music size={32} className="opacity-50" />
           </div>
           <div>
             <h3 className="text-white font-medium text-lg mb-1">暂无曲目</h3>
             <p className="text-sm">点击上方的导入按钮添加本地音乐。</p>
           </div>
        </div>
      )}

    </div>
  );
};

export default MainView;
