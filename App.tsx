import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import PlayerBar from './components/PlayerBar';
import MainView from './components/MainView';
import FullScreenPlayer from './components/FullScreenPlayer';
import QueueList from './components/QueueList';
import { Song, Album, View, PlayerState } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.HOME);
  const [activeAlbum, setActiveAlbum] = useState<Album | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [library, setLibrary] = useState<Song[]>([]);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [playerState, setPlayerState] = useState<PlayerState>({
    currentSong: null,
    isPlaying: false,
    volume: 50,
    progress: 0,
    duration: 0,
    queue: []
  });

  // Handle Audio Element Logic
  useEffect(() => {
    if (!audioRef.current) return;

    if (playerState.isPlaying) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log("Playback prevented:", error);
          setPlayerState(prev => ({ ...prev, isPlaying: false }));
        });
      }
    } else {
      audioRef.current.pause();
    }
  }, [playerState.isPlaying, playerState.currentSong]); // Trigger on song change too

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = playerState.volume / 100;
    }
  }, [playerState.volume]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setPlayerState(prev => ({
        ...prev,
        progress: audioRef.current?.currentTime || 0,
        // Duration is handled in onLoadedMetadata mostly, but keeping fallback here
      }));
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
       const dur = audioRef.current.duration;
       setPlayerState(prev => ({
         ...prev,
         duration: dur
       }));
       
       // Update duration in library if currently playing song matches
       if (playerState.currentSong) {
          const minutes = Math.floor(dur / 60);
          const seconds = Math.floor(dur % 60);
          const durationStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
          
          setLibrary(prev => prev.map(s => 
             s.id === playerState.currentSong?.id ? { ...s, duration: durationStr } : s
          ));
       }
    }
  };

  const handleSongEnd = () => {
    handleNext();
  };

  const handleSeek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setPlayerState(prev => ({ ...prev, progress: time }));
    }
  };

  const handlePlaySong = (song: Song) => {
    // If playing same song, toggle play/pause
    if (playerState.currentSong?.id === song.id) {
      setPlayerState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
    } else {
      // New song - setting isPlaying true will trigger useEffect to play
      setPlayerState(prev => ({
        ...prev,
        currentSong: song,
        isPlaying: true,
        progress: 0
      }));
    }
  };

  const handleAlbumClick = (album: Album) => {
    setActiveAlbum(album);
    setCurrentView(View.ALBUM_DETAILS);
  };

  const handleTogglePlay = () => {
    if (playerState.currentSong) {
      setPlayerState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
    }
  };

  const handleNavChange = (view: View) => {
    setCurrentView(view);
    if (view !== View.ALBUM_DETAILS) {
      setActiveAlbum(null);
    }
  };

  const handleNext = () => {
    if (!playerState.currentSong || library.length === 0) return;
    const currentIndex = library.findIndex(s => s.id === playerState.currentSong?.id);
    const nextIndex = (currentIndex + 1) % library.length;
    handlePlaySong(library[nextIndex]);
  };

  const handlePrev = () => {
    if (!playerState.currentSong || library.length === 0) return;
    const currentIndex = library.findIndex(s => s.id === playerState.currentSong?.id);
    const prevIndex = (currentIndex - 1 + library.length) % library.length;
    handlePlaySong(library[prevIndex]);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files) as File[];
      
      files.forEach(file => {
        const url = URL.createObjectURL(file);
        // Default to filename if tag reading fails
        const fallbackTitle = file.name.replace(/\.[^/.]+$/, "");
        const tempId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const newSong: Song = {
          id: tempId,
          title: fallbackTitle,
          artist: 'Unknown Artist',
          album: 'Local Import',
          cover: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=800&auto=format&fit=crop',
          duration: '--:--',
          url: url,
          accentColor: ['#d9775e', '#6b2c91', '#3d5a80', '#4a3b69'][Math.floor(Math.random() * 4)]
        };

        setLibrary(prev => [...prev, newSong]);

        // Read ID3 tags
        if ((window as any).jsmediatags) {
          (window as any).jsmediatags.read(file, {
            onSuccess: (tag: any) => {
              const { title, artist, album, picture } = tag.tags;
              
              let coverUrl = newSong.cover;
              if (picture) {
                const { data, format } = picture;
                let base64String = "";
                for (let i = 0; i < data.length; i++) {
                  base64String += String.fromCharCode(data[i]);
                }
                coverUrl = `data:${format};base64,${window.btoa(base64String)}`;
              }

              // Update this specific song in the library
              setLibrary(prev => prev.map(s => {
                if (s.id === tempId) {
                  return {
                    ...s,
                    title: title || fallbackTitle,
                    artist: artist || 'Unknown Artist',
                    album: album || 'Local Import',
                    cover: coverUrl
                  };
                }
                return s;
              }));
            },
            onError: (error: any) => {
              console.warn("Could not read tags for", file.name, error);
            }
          });
        }
      });
    }
  };

  return (
    <div className="relative flex h-screen text-white overflow-hidden font-sans selection:bg-rose-500 selection:text-white">
      
      {/* Hidden Real Audio Element */}
      <audio
        ref={audioRef}
        src={playerState.currentSong?.url}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleSongEnd}
        onLoadedMetadata={handleLoadedMetadata}
      />

      {/* Dynamic Animated Background Layer */}
      <div className="fixed inset-0 z-0 pointer-events-none">
         {/* Base Dark Layer that changes color */}
         <div 
            className="absolute inset-0 transition-colors duration-[1500ms] ease-in-out"
            style={{ 
              background: playerState.currentSong?.accentColor 
                ? `linear-gradient(to bottom, ${playerState.currentSong.accentColor}aa, #121212)` 
                : '#121212' 
            }} 
         />
         {/* Animated Blobs - Only visible when a song is loaded */}
         <div className={`absolute inset-0 transition-opacity duration-1000 ${playerState.currentSong ? 'opacity-100' : 'opacity-0'}`}>
            <div 
              className="absolute top-[-20%] left-[-20%] w-[80vw] h-[80vw] rounded-full mix-blend-overlay filter blur-[100px] opacity-60 animate-blob" 
              style={{ backgroundColor: playerState.currentSong?.accentColor || '#333' }} 
            />
            <div 
              className="absolute bottom-[-20%] right-[-20%] w-[80vw] h-[80vw] rounded-full mix-blend-overlay filter blur-[100px] opacity-60 animate-blob-2"
              style={{ backgroundColor: playerState.currentSong?.accentColor || '#333' }} 
            />
         </div>
          {/* Dark Overlay to ensure text readability */}
          <div className={`absolute inset-0 bg-black/40 backdrop-blur-[30px] transition-opacity duration-500 ${isFullScreen ? 'bg-black/20 backdrop-blur-[60px]' : ''}`} />
      </div>

      <QueueList 
        isOpen={isQueueOpen} 
        library={library} 
        currentSong={playerState.currentSong}
        isPlaying={playerState.isPlaying}
        onPlay={handlePlaySong}
        onClose={() => setIsQueueOpen(false)}
      />

      {isFullScreen ? (
        <FullScreenPlayer 
          playerState={playerState}
          onTogglePlay={handleTogglePlay}
          onNext={handleNext}
          onPrev={handlePrev}
          onVolumeChange={(vol) => setPlayerState(p => ({ ...p, volume: vol }))}
          onSeek={handleSeek}
          onToggleFullScreen={() => setIsFullScreen(true)}
        />
      ) : (
        <>
          <Sidebar 
            currentView={currentView} 
            onChangeView={handleNavChange} 
            onSearch={(term) => console.log('Searching', term)} 
          />
          
          <main className="flex-1 overflow-y-auto overflow-x-hidden relative scroll-smooth no-scrollbar z-10">
            <div className="max-w-7xl mx-auto px-6 md:px-12 pt-6">
              <MainView 
                currentView={currentView}
                activeAlbum={activeAlbum}
                currentSong={playerState.currentSong}
                isPlaying={playerState.isPlaying}
                library={library}
                onPlaySong={handlePlaySong}
                onAlbumClick={handleAlbumClick}
                onBack={() => setCurrentView(View.HOME)}
                onImport={handleImport}
              />
            </div>
          </main>

          <PlayerBar 
            playerState={playerState}
            onTogglePlay={handleTogglePlay}
            onNext={handleNext}
            onPrev={handlePrev}
            onVolumeChange={(vol) => setPlayerState(p => ({ ...p, volume: vol }))}
            onSeek={handleSeek}
            onToggleFullScreen={() => setIsFullScreen(true)}
            onToggleQueue={() => setIsQueueOpen(!isQueueOpen)}
            isQueueOpen={isQueueOpen}
          />
        </>
      )}
    </div>
  );
};

export default App;