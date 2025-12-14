import React, { useState, useEffect, useRef, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import PlayerBar from './components/PlayerBar';
import MainView from './components/MainView';
import FullScreenPlayer from './components/FullScreenPlayer';
import QueueList from './components/QueueList';
import { Song, Album, View, PlayerState, RepeatMode } from './types';
import { MOCK_API_BASE } from './constants';

const App: React.FC = () => {
  const LOCAL_LIBRARY_KEY = 'local_uploaded_library';
  const LOCAL_QUEUE_KEY = 'local_uploaded_queue';
  const [currentView, setCurrentView] = useState<View>(View.HOME);
  const [activeAlbum, setActiveAlbum] = useState<Album | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [library, setLibrary] = useState<Song[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasInitialized = useRef(false);

  const [playerState, setPlayerState] = useState<PlayerState>({
    currentSong: null,
    isPlaying: false,
    volume: 50,
    progress: 0,
    duration: 0,
    queue: [],
    repeatMode: RepeatMode.ALL,
    isShuffle: false
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

  useEffect(() => {
    const hydrateSong = (song: Song): Song => ({
      accentColor: '#d9775e',
      ...song
    });

    // Hydrate any previously uploaded songs that have stable URLs
    try {
      const raw = localStorage.getItem(LOCAL_LIBRARY_KEY);
      console.log('[App] Restoring library from localStorage:', raw);
      if (raw) {
        const parsed: Song[] = JSON.parse(raw);
        console.log('[App] Parsed songs:', parsed.length, 'songs');
        setLibrary(parsed.map(hydrateSong));
      } else {
        console.log('[App] No library data found in localStorage');
      }
    } catch (error) {
      console.warn('Failed to restore local uploads', error);
    }

    // Hydrate queue so playback list survives refresh
    try {
      const rawQueue = localStorage.getItem(LOCAL_QUEUE_KEY);
      if (rawQueue) {
        const parsedQueue: Song[] = JSON.parse(rawQueue);
        setPlayerState(prev => ({ ...prev, queue: parsedQueue.map(hydrateSong) }));
      }
    } catch (error) {
      console.warn('Failed to restore queue', error);
    }

    // Mark as initialized after a short delay to allow state to settle
    setTimeout(() => {
      hasInitialized.current = true;
      console.log('[App] Initialization complete');
    }, 100);
  }, []);

  useEffect(() => {
    // Persist all songs with stable URLs (http/https)
    // Filter out blob URLs as they cannot survive page refresh
    const persistable = library.filter(s => s.url && s.url.startsWith('http'));
    console.log('[App] Persisting library:', persistable.length, 'songs with stable URLs out of', library.length, 'total');

    // Don't persist if we haven't initialized yet (prevents StrictMode from clearing on remount)
    if (!hasInitialized.current) {
      console.log('[App] Skipping persist - not initialized yet');
      return;
    }

    // Only persist if we have songs to save
    if (persistable.length > 0) {
      try {
        localStorage.setItem(LOCAL_LIBRARY_KEY, JSON.stringify(persistable));
        console.log('[App] Successfully saved to localStorage');
      } catch (error) {
        console.warn('Failed to persist local uploads', error);
      }
    }
  }, [library]);

  useEffect(() => {
    // Persist queue with stable URLs so queue view survives refresh
    const persistableQueue = playerState.queue.filter(s => s.url && s.url.startsWith('http'));
    try {
      localStorage.setItem(LOCAL_QUEUE_KEY, JSON.stringify(persistableQueue));
    } catch (error) {
      console.warn('Failed to persist queue', error);
    }
  }, [playerState.queue]);

  const filteredLibrary = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return [];
    return library.filter(song => {
      const haystacks = [song.title, song.artist, song.album].map(v => v.toLowerCase());
      return haystacks.some(field => field.includes(term));
    });
  }, [searchTerm, library]);

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
    if (playerState.repeatMode === RepeatMode.ONE) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
      return;
    }
    handleNext();
  };

  const handleSeek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setPlayerState(prev => ({ ...prev, progress: time }));
    }
  };

  const handlePlaySong = (song: Song, sourceList?: Song[]) => {
    const queueSource = sourceList && sourceList.length
      ? sourceList
      : (library.length ? library : [song]);

    // If playing same song, toggle play/pause but refresh queue context
    if (playerState.currentSong?.id === song.id) {
      setPlayerState(prev => ({ ...prev, isPlaying: !prev.isPlaying, queue: queueSource }));
      return;
    }

    // New song - setting isPlaying true will trigger useEffect to play
    setPlayerState(prev => ({
      ...prev,
      currentSong: song,
      isPlaying: true,
      progress: 0,
      queue: queueSource
    }));
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

  const handleToggleShuffle = () => {
    setPlayerState(prev => ({ ...prev, isShuffle: !prev.isShuffle }));
  };

  const handleToggleRepeat = () => {
    setPlayerState(prev => {
      if (prev.repeatMode === RepeatMode.OFF) return { ...prev, repeatMode: RepeatMode.ALL };
      if (prev.repeatMode === RepeatMode.ALL) return { ...prev, repeatMode: RepeatMode.ONE };
      return { ...prev, repeatMode: RepeatMode.OFF };
    });
  };

  const handleNavChange = (view: View) => {
    setCurrentView(view);
    if (view !== View.ALBUM_DETAILS) {
      setActiveAlbum(null);
    }
  };

  const handleNext = () => {
    const playbackQueue = playerState.queue.length ? playerState.queue : library;
    if (!playerState.currentSong || playbackQueue.length === 0) return;
    const currentIndex = playbackQueue.findIndex(s => s.id === playerState.currentSong?.id);

    if (playerState.isShuffle) {
      if (playbackQueue.length === 1) {
        handlePlaySong(playbackQueue[0], playbackQueue);
        return;
      }

      let nextIndex = currentIndex;
      while (nextIndex === currentIndex) {
        nextIndex = Math.floor(Math.random() * playbackQueue.length);
      }
      handlePlaySong(playbackQueue[nextIndex], playbackQueue);
      return;
    }

    const isLastSong = currentIndex === playbackQueue.length - 1;
    if (isLastSong && playerState.repeatMode === RepeatMode.OFF) {
      setPlayerState(prev => ({ ...prev, isPlaying: false, progress: 0 }));
      return;
    }

    const nextIndex = isLastSong ? 0 : currentIndex + 1;
    handlePlaySong(playbackQueue[nextIndex], playbackQueue);
  };

  const handlePrev = () => {
    const playbackQueue = playerState.queue.length ? playerState.queue : library;
    if (!playerState.currentSong || playbackQueue.length === 0) return;
    const currentIndex = playbackQueue.findIndex(s => s.id === playerState.currentSong?.id);

    if (playerState.isShuffle) {
      if (playbackQueue.length === 1) {
        handlePlaySong(playbackQueue[0], playbackQueue);
        return;
      }

      let prevIndex = currentIndex;
      while (prevIndex === currentIndex) {
        prevIndex = Math.floor(Math.random() * playbackQueue.length);
      }
      handlePlaySong(playbackQueue[prevIndex], playbackQueue);
      return;
    }

    const prevIndex = (currentIndex - 1 + playbackQueue.length) % playbackQueue.length;
    handlePlaySong(playbackQueue[prevIndex], playbackQueue);
  };

  const handleDeleteSong = (song: Song) => {
    console.log('[Delete] Deleting song:', song.title, song.id);

    // Remove from library
    setLibrary(prev => {
      const updated = prev.filter(s => s.id !== song.id);
      console.log('[Delete] Updated library, now has', updated.length, 'songs');
      return updated;
    });

    // If the deleted song is currently playing, stop playback
    if (playerState.currentSong?.id === song.id) {
      setPlayerState(prev => ({
        ...prev,
        currentSong: null,
        isPlaying: false,
        progress: 0
      }));
    }

    // Remove from queue if present
    setPlayerState(prev => ({
      ...prev,
      queue: prev.queue.filter(s => s.id !== song.id)
    }));

    // Optionally: Delete from server if it's an uploaded file
    if (song.url && song.url.startsWith('http://localhost:4000/uploads/')) {
      const filename = song.url.split('/').pop();
      fetch(`${MOCK_API_BASE}/delete/${filename}`, { method: 'DELETE' })
        .then(() => console.log('[Delete] File deleted from server'))
        .catch(err => console.warn('[Delete] Failed to delete file from server:', err));
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (!files.length) return;

    const accentPalette = ['#d9775e', '#6b2c91', '#3d5a80', '#4a3b69'];

    for (const file of files) {
      const objectUrl = URL.createObjectURL(file);
      const fallbackTitle = file.name.replace(/\.[^/.]+$/, "");
      const tempId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const accentColor = accentPalette[Math.floor(Math.random() * accentPalette.length)];

      const newSong: Song = {
        id: tempId,
        title: fallbackTitle,
        artist: 'Unknown Artist',
        album: 'Local Import',
        cover: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=800&auto=format&fit=crop',
        duration: '--:--',
        url: objectUrl,
        accentColor
      };

      setLibrary(prev => [...prev, newSong]);

      const formData = new FormData();
      formData.append('file', file);

      try {
        console.log('[Upload] Uploading file to mock API:', file.name);
        const uploadRes = await fetch(`${MOCK_API_BASE}/upload`, {
          method: 'POST',
          body: formData
        });

        if (!uploadRes.ok) {
          throw new Error(`Upload failed with status ${uploadRes.status}`);
        }

        const payload = await uploadRes.json();
        console.log('[Upload] Upload successful, received URL:', payload?.url);
        if (payload?.url) {
          setLibrary(prev => prev.map(s => s.id === tempId ? { ...s, url: payload.url } : s));
        }
      } catch (error) {
        console.warn('[Upload] Upload to mock API failed; keeping local blob URL', error);
      }

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
    }

    e.target.value = '';
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (term.trim()) {
      setCurrentView(View.SEARCH);
    } else {
      setCurrentView(View.HOME);
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
        queue={playerState.queue.length ? playerState.queue : library} 
        currentSong={playerState.currentSong}
        isPlaying={playerState.isPlaying}
        onPlay={(song) => handlePlaySong(song, playerState.queue.length ? playerState.queue : library)}
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
          onToggleFullScreen={() => setIsFullScreen(false)}
          onToggleShuffle={handleToggleShuffle}
          onToggleRepeat={handleToggleRepeat}
        />
      ) : (
        <>
          <Sidebar 
            currentView={currentView} 
            onChangeView={handleNavChange} 
            onSearch={handleSearch} 
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
                onDeleteSong={handleDeleteSong}
                searchTerm={searchTerm}
                searchResults={filteredLibrary}
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
            onToggleShuffle={handleToggleShuffle}
            onToggleRepeat={handleToggleRepeat}
          />
        </>
      )}
    </div>
  );
};

export default App;
