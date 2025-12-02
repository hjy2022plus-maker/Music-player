import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import PlayerBar from './components/PlayerBar';
import MainView from './components/MainView';
import { Song, Album, View, PlayerState } from './types';
import { BG_COLOR } from './constants';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.HOME);
  const [activeAlbum, setActiveAlbum] = useState<Album | null>(null);
  
  const [playerState, setPlayerState] = useState<PlayerState>({
    currentSong: null,
    isPlaying: false,
    volume: 50,
    progress: 0,
    queue: []
  });

  // Simple progress ticker
  useEffect(() => {
    let interval: number;
    if (playerState.isPlaying && playerState.currentSong) {
      interval = window.setInterval(() => {
        setPlayerState(prev => {
          if (prev.progress >= 200) { // Simulate song end (mock duration)
            return { ...prev, isPlaying: false, progress: 0 };
          }
          return { ...prev, progress: prev.progress + 1 };
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [playerState.isPlaying, playerState.currentSong]);

  const handlePlaySong = (song: Song) => {
    // If playing same song, toggle play/pause
    if (playerState.currentSong?.id === song.id) {
      setPlayerState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
    } else {
      // New song
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
    // Reset specific states if needed when leaving views
    if (view !== View.ALBUM_DETAILS) {
      setActiveAlbum(null);
    }
  };

  return (
    <div className={`flex h-screen ${BG_COLOR} text-white overflow-hidden font-sans selection:bg-rose-500 selection:text-white`}>
      <Sidebar 
        currentView={currentView} 
        onChangeView={handleNavChange} 
        onSearch={(term) => console.log('Searching', term)} 
      />
      
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative scroll-smooth no-scrollbar">
        <div className="max-w-7xl mx-auto px-6 md:px-12 pt-6">
          <MainView 
            currentView={currentView}
            activeAlbum={activeAlbum}
            currentSong={playerState.currentSong}
            isPlaying={playerState.isPlaying}
            onPlaySong={handlePlaySong}
            onAlbumClick={handleAlbumClick}
            onBack={() => setCurrentView(View.HOME)}
          />
        </div>
      </main>

      <PlayerBar 
        playerState={playerState}
        onTogglePlay={handleTogglePlay}
        onNext={() => console.log('Next')}
        onPrev={() => console.log('Prev')}
        onVolumeChange={(vol) => setPlayerState(p => ({ ...p, volume: vol }))}
      />
    </div>
  );
};

export default App;
