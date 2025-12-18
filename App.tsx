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
  const LOCAL_PLAYER_STATE_KEY = 'local_player_state';
  const LOCAL_CURRENT_SONG_KEY = 'local_current_song';

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

    const loadLibrary = async () => {
      // 1. 从 localStorage 加载
      let localSongs: Song[] = [];
      try {
        const raw = localStorage.getItem(LOCAL_LIBRARY_KEY);
        console.log('[App] Restoring library from localStorage:', raw);
        if (raw) {
          const parsed: Song[] = JSON.parse(raw);
          console.log('[App] Parsed songs:', parsed.length, 'songs');
          localSongs = parsed.map(hydrateSong);
        } else {
          console.log('[App] No library data found in localStorage');
        }
      } catch (error) {
        console.warn('Failed to restore local uploads', error);
      }

      // 2. 从后端 API 获取已上传的歌曲列表
      try {
        // 尝试从开发环境 API 获取
        const apiUrl = MOCK_API_BASE ? `${MOCK_API_BASE}/uploaded-songs` : '/api/songs';
        console.log('[App] Fetching uploaded songs from:', apiUrl);

        const response = await fetch(apiUrl);
        if (response.ok) {
          const data = await response.json();
          const serverSongs: Song[] = (data.items || []).map(hydrateSong);
          console.log('[App] Fetched from server:', serverSongs.length, 'songs');

          // 3. 合并本地和服务器的歌曲列表（去重）
          const allSongs = [...localSongs];
          const existingUrls = new Set(localSongs.map(s => s.url));

          for (const song of serverSongs) {
            if (song.url && !existingUrls.has(song.url)) {
              allSongs.push(song);
            }
          }

          console.log('[App] Total songs after merge:', allSongs.length);
          setLibrary(allSongs);
        } else {
          console.warn('[App] Failed to fetch from server:', response.status);
          setLibrary(localSongs);
        }
      } catch (error) {
        console.warn('[App] Failed to fetch uploaded songs from server:', error);
        setLibrary(localSongs);
      }
    };

    loadLibrary();

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

    // Hydrate player state (current song, volume, repeat mode, shuffle)
    try {
      const rawPlayerState = localStorage.getItem(LOCAL_PLAYER_STATE_KEY);
      if (rawPlayerState) {
        const parsed = JSON.parse(rawPlayerState);
        console.log('[App] Restoring player state:', parsed);
        setPlayerState(prev => ({
          ...prev,
          volume: parsed.volume ?? prev.volume,
          repeatMode: parsed.repeatMode ?? prev.repeatMode,
          isShuffle: parsed.isShuffle ?? prev.isShuffle,
        }));
      }
    } catch (error) {
      console.warn('Failed to restore player state', error);
    }

    // Hydrate current song
    try {
      const rawCurrentSong = localStorage.getItem(LOCAL_CURRENT_SONG_KEY);
      if (rawCurrentSong) {
        const parsed: Song = JSON.parse(rawCurrentSong);
        console.log('[App] Restoring current song:', parsed.title);
        setPlayerState(prev => ({
          ...prev,
          currentSong: hydrateSong(parsed),
          isPlaying: false, // 不自动播放，用户需要手动点击
        }));
      }
    } catch (error) {
      console.warn('Failed to restore current song', error);
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

  const handleDeleteSong = async (song: Song) => {
    console.log('[Delete] Deleting song:', song.title, song.id);

    // 先从本地状态删除（乐观更新）
    const removeFromState = () => {
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
    };

    removeFromState();

    // 调用后端 API 删除文件
    try {
      // 尝试从 API 删除（生产环境或开发环境）
      const deleteUrl = MOCK_API_BASE
        ? `${MOCK_API_BASE}/delete?id=${encodeURIComponent(song.id)}`
        : `/api/delete?id=${encodeURIComponent(song.id)}`;

      console.log('[Delete] Calling delete API:', deleteUrl);

      const response = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('[Delete] File deleted from server:', result);
      } else {
        console.warn('[Delete] Failed to delete from server:', response.status);
      }
    } catch (error) {
      console.warn('[Delete] Error calling delete API:', error);
      // 不回滚本地删除，因为可能是离线状态
    }
  };

const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // 创建临时 Blob URL 用于即时播放
      const tempUrl = URL.createObjectURL(file);
      const tempId = `temp-${Date.now()}-${i}`;

      const newSong: Song = {
        id: tempId,
        title: file.name.replace(/\.[^/.]+$/, ''),
        artist: 'Unknown Artist',
        album: 'Unknown Album',
        cover: '/covers/109951163200234839 (1).jpg',
        duration: '0:00',
        url: tempUrl,
        accentColor: '#ff006e'
      };

      setLibrary(prev => [...prev, newSong]);

      // 上传文件到后端
      try {
        const uploadUrl = MOCK_API_BASE
          ? `${MOCK_API_BASE}/upload?filename=${encodeURIComponent(file.name)}`
          : `/api/upload?filename=${encodeURIComponent(file.name)}`;

        const response = await fetch(uploadUrl, {
          method: 'POST',
          body: file,
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        const data = await response.json();
        console.log('[Upload] Response:', data);

        // 使用服务器返回的完整元数据
        const fileMetadata = data.file || data;
        const serverSong: Song = {
          id: fileMetadata.id || tempId,
          title: fileMetadata.title || newSong.title,
          artist: fileMetadata.artist || newSong.artist,
          album: fileMetadata.album || newSong.album,
          cover: fileMetadata.cover || newSong.cover,
          duration: fileMetadata.duration || newSong.duration,
          url: fileMetadata.url || data.url,
          accentColor: fileMetadata.accentColor || newSong.accentColor
        };

        // 更新为服务器返回的元数据
        setLibrary(prev =>
          prev.map(song =>
            song.id === tempId ? serverSong : song
          )
        );

        // 释放临时 Blob URL
        URL.revokeObjectURL(tempUrl);

        // 读取 ID3 标签并更新元数据
        if ((window as any).jsmediatags) {
          (window as any).jsmediatags.read(file, {
            onSuccess: async (tag: any) => {
              const { title, artist, album, picture } = tag.tags;
              let coverUrl = serverSong.cover;

              if (picture) {
                const { data: picData, format } = picture;
                const blob = new Blob([new Uint8Array(picData)], { type: format });
                coverUrl = URL.createObjectURL(blob);
              }

              const id3Updates = {
                title: title || serverSong.title,
                artist: artist || serverSong.artist,
                album: album || serverSong.album,
                cover: coverUrl,
              };

              // 更新本地状态
              setLibrary(prev =>
                prev.map(song =>
                  song.id === serverSong.id
                    ? { ...song, ...id3Updates }
                    : song
                )
              );

              // 同步更新到服务器
              try {
                const updateUrl = MOCK_API_BASE
                  ? `${MOCK_API_BASE}/update?id=${encodeURIComponent(serverSong.id)}`
                  : `/api/update?id=${encodeURIComponent(serverSong.id)}`;

                await fetch(updateUrl, {
                  method: 'PATCH',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(id3Updates),
                });

                console.log('[ID3] Updated metadata on server:', id3Updates);
              } catch (updateError) {
                console.warn('[ID3] Failed to update metadata on server:', updateError);
              }
            },
            onError: (error: any) => {
              console.error('ID3 tag reading error:', error);
            }
          });
        }
      } catch (error) {
        console.error('Upload error:', error);
        // 保留临时 URL，允许本地播放
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
