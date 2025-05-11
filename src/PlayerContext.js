import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import TrackPlayer, { 
  Capability, 
  useProgress, 
  useTrackPlayerEvents,
  RepeatMode,
  Event
} from 'react-native-track-player';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import RNFS from 'react-native-fs';
import { PermissionsAndroid } from 'react-native';


const PlayerContext = createContext();

const DEFAULT_PLAYLISTS = [
  { id: '0', name: 'All', data: [] },
  { id: '1', name: 'Favorites', data: [] }
];

export const PlayerProvider = ({ children }) => {
  const [playlists, setPlaylists] = useState([]);
  const [currentPlaylistId, setCurrentPlaylistId] = useState(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [repeatMode, setRepeatMode] = useState(RepeatMode.Off);
  const [shuffleMode, setShuffleMode] = useState(false);
  const [scannedFolders, setScannedFolders] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isPlayerReady) return;
  
    const setupPlayerEvents = async () => {
      // Set up listeners to keep our state in sync with TrackPlayer events
      const playerEvents = [
        Event.PlaybackTrackChanged,
        Event.PlaybackState,
        Event.PlaybackProgressUpdated, // Add this to track progress updates
      ];
      
      const subscription = usePlayerEvents(playerEvents, async (event) => {
        if (event.type === Event.PlaybackTrackChanged && event.nextTrack !== undefined) {
          // Update current track index when the track changes
          setCurrentTrackIndex(event.nextTrack);
        } 
        else if (event.type === Event.PlaybackProgressUpdated) {
          // This event fires when progress updates, including after seeks
          // You can use this to update UI if needed
          // The progress is already handled by useProgress() hook
        }
      });
      
      return () => {
        // Clean up subscription when component unmounts
        if (subscription) {
          subscription.remove();
        }
      };
    };
    
    setupPlayerEvents();
  }, [isPlayerReady]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [storedPlaylists, storedCurrentPlaylist, storedCurrentTrackIndex] = await Promise.all([
          AsyncStorage.getItem('playlists'),
          AsyncStorage.getItem('currentPlaylistId'),
          AsyncStorage.getItem('currentTrackIndex'),
        ]);

        let loadedPlaylists = DEFAULT_PLAYLISTS;
        if (storedPlaylists) {
          const stored = JSON.parse(storedPlaylists);
          loadedPlaylists = [
            ...DEFAULT_PLAYLISTS.map(defaultPlaylist => {
              const storedPlaylist = stored.find(p => p.id === defaultPlaylist.id);
              return storedPlaylist ? { ...defaultPlaylist, data: storedPlaylist.data } : defaultPlaylist;
            }),
            ...stored.filter(p => !DEFAULT_PLAYLISTS.some(dp => dp.id === p.id))
          ];
        }

        setPlaylists(loadedPlaylists);
        if (storedCurrentPlaylist) setCurrentPlaylistId(JSON.parse(storedCurrentPlaylist));
        if (storedCurrentTrackIndex) setCurrentTrackIndex(JSON.parse(storedCurrentTrackIndex));

        if (!isPlayerReady) {
          await setupPlayer();
        }
        
        const allPlaylist = loadedPlaylists.find(p => p.id === '0');
        if (!allPlaylist || allPlaylist.data.length === 0) {
          await scanDeviceForMusic();
        } else {
          await verifySongs();
        }
      } catch (error) {
        console.error('Failed to load player data:', error);
        setError('Failed to load player data: ' + error.message);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    const saveData = async () => {
      try {
        await AsyncStorage.multiSet([
          ['playlists', JSON.stringify(playlists)],
          ['currentPlaylistId', JSON.stringify(currentPlaylistId)],
          ['currentTrackIndex', JSON.stringify(currentTrackIndex)],
        ]);
      } catch (error) {
        console.error('Failed to save player data:', error);
        setError('Failed to save player data: ' + error.message);
      }
    };

    saveData();
  }, [playlists, currentPlaylistId, currentTrackIndex]);

  const enhancedSeekTo = async (position) => {
    try {
      await TrackPlayer.seekTo(position);
      return true;
    } catch (error) {
      console.error('Error seeking to position:', error);
      setError('Error seeking to position: ' + error.message);
      return false;
    }
  };

  const setupPlayer = async () => {
    try {
      const playerState = await TrackPlayer.getState().catch(() => null);
      
      if (playerState !== null) {
        console.log('Player is already initialized');
        setIsPlayerReady(true);
        return;
      }
      
      await TrackPlayer.setupPlayer({
        // Optional options for better audio quality
        maxCacheSize: 1024 * 5, // 5mb
      });
      
      await TrackPlayer.updateOptions({
        // Android specific options
        android: {
          appKilledPlaybackBehavior: 'StopPlaybackAndRemoveNotification',
        },
        // Capabilities that will show up in the notification
        capabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.SkipToNext,
          Capability.SkipToPrevious,
          Capability.SeekTo,
          Capability.Stop,
        ],
        // Capabilities when notification is in compact mode
        compactCapabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.SkipToNext,
          Capability.SkipToPrevious,
        ],
        // Notification icon customization (optional)
        notificationCapabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.SkipToNext,
          Capability.SkipToPrevious,
          Capability.SeekTo,
          Capability.Stop,
        ],
        // Progress update interval in seconds (smaller value = more responsive slider)
        progressUpdateEventInterval: 0.5,
      });
      
      setIsPlayerReady(true);
    } catch (error) {
      console.error('Failed to setup player:', error);
      setError('Failed to setup player: ' + error.message);
    }
  };

  const requestStoragePermission = async () => {
    if (Platform.OS !== 'android') {
      return true;
    }
  
    try {
      console.log('Requesting storage permission...');
      let grantedPermissions = {};
  
      if (Platform.Version >= 33) { 
        console.log('Requesting media permissions for Android 13+');
        grantedPermissions = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_AUDIO,
        ]);
  
        if (
          grantedPermissions['android.permission.READ_MEDIA_IMAGES'] === PermissionsAndroid.RESULTS.GRANTED &&
          grantedPermissions['android.permission.READ_MEDIA_VIDEO'] === PermissionsAndroid.RESULTS.GRANTED &&
          grantedPermissions['android.permission.READ_MEDIA_AUDIO'] === PermissionsAndroid.RESULTS.GRANTED
        ) {
          console.log('All media permissions granted');
          return true;
        } else {
          console.log('One or more media permissions denied');
          return false;
        }
      } else { 
        console.log('Requesting READ_EXTERNAL_STORAGE permission for Android 10-12');
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission',
            message: 'App needs access to your storage to load music.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('Storage permission granted');
          return true;
        } else {
          console.log('Storage permission denied');
          return false;
        }
      }
    } catch (err) {
      console.warn('Error requesting storage permission:', err);
      return false;
    }
  };


  const findAudioFiles = async (dirPath, foundFiles = []) => {
  try {
    const files = await RNFS.readDir(dirPath);
    setScannedFolders(prev => prev + 1);

    // Skip known recording directories
    const skipDirs = [
      'Android/data',
      'Android/obb',
      'DCIM/.thumbnails',
      'Call',
      'CallRecordings',
      'Recordings',
      'Voice Recorder',
      'Recorder',
      'WhatsApp',
      'WhatsApp Audio',
      'WhatsApp Media',
      'WhatsApp Voice Notes',
      'Notifications',
      'Ringtones',
      'Alarms',
      'Audio/Recordings'
    ];

    for (const file of files) {
      if (file.name.startsWith('.')) continue;

      if (file.isDirectory()) {
        if (skipDirs.some(dir => file.path.includes(dir))) continue;
        await findAudioFiles(file.path, foundFiles);
      } else {
        const ext = file.name.split('.').pop().toLowerCase();
        const supportedFormats = [
          'mp3',
          'wav',
          'aac',
          'm4a',
          'flac',
          'ogg',
          'opus',
          'opec',
          'oga',
          'wma',
          'alac',
          'aiff',
        ];

        if (supportedFormats.includes(ext)) {
          // Skip very small files (likely not actual songs)
          if (file.size < 100 * 1024) { // Skip files smaller than 100KB
            continue;
          }

          // For supported formats, we'll add them now and verify duration later
          foundFiles.push(file);
          setTotalFiles(prev => prev + 1);
        }
      }
    }

    return foundFiles;
  } catch (err) {
    console.warn(`Error reading directory ${dirPath}:`, err);
    return foundFiles;
  }
};

 const scanDeviceForMusic = async () => {
  if (!(await requestStoragePermission())) return [];

  setIsScanning(true);
  setScanProgress(0);
  setScannedFolders(0);
  setTotalFiles(0);
  setError(null);

  try {
    let directories = [];

    if (Platform.OS === 'android') {
      directories = [
        RNFS.ExternalStorageDirectoryPath + '/Music',
        RNFS.ExternalStorageDirectoryPath + '/Download/Music',
        RNFS.ExternalStorageDirectoryPath + '/Media/Music',
        RNFS.ExternalStorageDirectoryPath + '/Documents/Music',
      ];

      // Only scan these additional directories if no music was found in standard locations
      if (directories.every(dir => !RNFS.exists(dir))) {
        directories.push(
          RNFS.ExternalStorageDirectoryPath,
          RNFS.ExternalStorageDirectoryPath + '/Download',
          RNFS.ExternalStorageDirectoryPath + '/Documents'
        );
      }

      try {
        const extDirs = await RNFS.getAllExternalFilesDirs();
        if (extDirs && extDirs.length > 1) {
          for (let i = 1; i < extDirs.length; i++) {
            const sdPath = extDirs[i].path.split('/Android')[0];
            directories.push(sdPath + '/Music');
          }
        }
      } catch (e) {
        console.warn("Could not get external dirs:", e);
      }
    } else {
      directories = [
        RNFS.DocumentDirectoryPath + '/Music',
        RNFS.LibraryDirectoryPath + '/Music',
        RNFS.MusicDirectoryPath,
      ];
    }

    directories = [...new Set(directories)];
    
    let allAudioFiles = [];
    let processedDirectories = 0;
    const totalDirectories = directories.length;
    
    for (const dir of directories) {
      try {
        console.log(`Scanning directory: ${dir}`);
        const filesInDir = await findAudioFiles(dir);
        allAudioFiles = [...allAudioFiles, ...filesInDir];
        
        processedDirectories++;
        setScanProgress((processedDirectories / totalDirectories) * 100);
      } catch (e) {
        console.warn(`Error scanning directory ${dir}:`, e);
      }
    }

    console.log(`Found ${allAudioFiles.length} audio files`);
    
    // Filter out duplicates and non-music files
    const uniqueFiles = new Map();
    allAudioFiles.forEach(file => {
      if (!uniqueFiles.has(file.path)) {
        uniqueFiles.set(file.path, file);
      }
    });

    const songList = [];
    const filesArray = Array.from(uniqueFiles.values());
    
    for (let i = 0; i < filesArray.length; i++) {
      const file = filesArray[i];
      try {
        // Skip files that are likely recordings
        if (isLikelyRecording(file)) {
          continue;
        }

        const uniqueId = file.path.replace(/[^a-zA-Z0-9]/g, '_');

        // Get basic metadata
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
        const parts = nameWithoutExt.split(' - ');
        const hasArtistAndTitle = parts.length >= 2 && parts[1].trim();

        const title = hasArtistAndTitle ? parts[1].trim() : nameWithoutExt;
        const artist = hasArtistAndTitle ? parts[0].trim() : 'Unknown Artist';

        // Skip files with common recording patterns in their names
        if (isRecordingFileName(title)) {
          continue;
        }

        // Get duration (you'll need to implement getAudioDuration)
        let duration = 0;
        try {
          duration = await getAudioDuration(file.path);
          // Skip files shorter than 30 seconds
          if (duration > 0 && duration < 30) {
            continue;
          }
        } catch (e) {
          console.warn(`Couldn't get duration for ${file.name}:`, e);
        }

        // Get artwork
        let artwork = null;
        try {
          const coverPath = file.path.replace(/\.[^/.]+$/, '.jpg');
          const coverExists = await RNFS.exists(coverPath);
          if (coverExists) {
            artwork = Platform.OS === 'android' ? `file://${coverPath}` : coverPath;
          } else {
            const pngPath = file.path.replace(/\.[^/.]+$/, '.png');
            const pngExists = await RNFS.exists(pngPath);
            if (pngExists) {
              artwork = Platform.OS === 'android' ? `file://${pngPath}` : pngPath;
            } else {
              const dirPath = file.path.substring(0, file.path.lastIndexOf('/'));
              const dirFiles = await RNFS.readDir(dirPath);
              const coverFile = dirFiles.find(f => 
                f.name.toLowerCase().includes('cover') || 
                f.name.toLowerCase().includes('album') ||
                f.name.toLowerCase().includes('artwork') ||
                f.name.toLowerCase() === 'folder.jpg'
              );
              if (coverFile) {
                artwork = Platform.OS === 'android' ? `file://${coverFile.path}` : coverFile.path;
              }
            }
          }
        } catch (e) {
          console.warn(`Error getting artwork for ${file.name}:`, e);
        }

        songList.push({
          id: uniqueId,
          url: Platform.OS === 'android' ? `file://${file.path}` : file.path,
          title: title,
          artist: artist,
          artwork: artwork,
          duration: duration,  
          size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
          date: file.mtime ? file.mtime.toISOString() : new Date().toISOString(),
        });

        // Update progress
        setScanProgress(((processedDirectories / totalDirectories) * 50) + 
                       ((i / filesArray.length) * 50));
      } catch (e) {
        console.warn(`Error processing file ${file.name}:`, e);
      }
    }

    console.log(`Processed ${songList.length} music files`);
    
    setPlaylists(prev => prev.map(playlist => 
      playlist.id === '0' 
        ? { ...playlist, data: songList } 
        : playlist
    ));

    return songList;
  } catch (error) {
    console.error('Failed to scan device:', error);
    setError('Failed to scan device: ' + error.message);
    return [];
  } finally {
    setIsScanning(false);
  }
};

// Helper functions
const isLikelyRecording = (file) => {
  const recordingPaths = [
    '/Call',
    '/CallRecordings',
    '/Recordings',
    '/Voice Recorder',
    '/Recorder',
    '/WhatsApp',
    '/WhatsApp Audio',
    '/WhatsApp Media',
    '/WhatsApp Voice Notes',
    '/Notifications',
    '/Ringtones',
    '/Alarms',
    '/Audio/Recordings'
  ];

  return recordingPaths.some(path => file.path.includes(path));
};

const isRecordingFileName = (filename) => {
  const recordingPatterns = [
    /^Recording/i,
    /^Voice Note/i,
    /^Call/i,
    /^Memo/i,
    /^\d{8}_\d{6}/, // Dates like 20230101_120000
    /^[A-Z]{2}_\d+/ // Patterns like WA_1234
  ];

  return recordingPatterns.some(pattern => pattern.test(filename));
};

// You'll need to implement this using a native module
const getAudioDuration = async (filePath) => {
  // Implement this using a native module
  // For Android: MediaMetadataRetriever
  // For iOS: AVFoundation
  return 0; // Return 0 if you can't get duration
};

  const verifySongs = async () => {
    const allPlaylist = playlists.find(p => p.id === '0');
    if (!allPlaylist || allPlaylist.data.length === 0) return [];
    
    setIsScanning(true);
    setScanProgress(0);
    
    try {
      const verifiedSongs = [];
      let processedSongs = 0;
      const totalSongs = allPlaylist.data.length;
      
      for (const song of allPlaylist.data) {
        try {
          const filePath = song.url.replace('file://', '');
          const exists = await RNFS.exists(filePath);
          if (exists) {
            verifiedSongs.push(song);
          }
          
          processedSongs++;
          setScanProgress((processedSongs / totalSongs) * 100);
        } catch (e) {
          console.warn(`Error verifying song ${song.title}:`, e);
        }
      }
    
      console.log(`Verified ${verifiedSongs.length}/${totalSongs} songs`);
      
      if (verifiedSongs.length !== allPlaylist.data.length) {
        setPlaylists(prev => prev.map(playlist => 
          playlist.id === '0' 
            ? { ...playlist, data: verifiedSongs } 
            : playlist.id === '1'
              ? { ...playlist, data: playlist.data.filter(song => 
                  verifiedSongs.some(s => s.id === song.id)
                )}
              : playlist
        ));
      }
    
      return verifiedSongs;
    } catch (error) {
      console.error('Failed to verify songs:', error);
      setError('Failed to verify songs: ' + error.message);
      return [];
    } finally {
      setIsScanning(false);
    }
  };

  const createPlaylist = async (name) => {
    if (!name || !name.trim()) {
      setError('Playlist name cannot be empty');
      return null;
    }
    
    if (playlists.some(p => p.name.toLowerCase() === name.trim().toLowerCase())) {
      setError('A playlist with this name already exists');
      return null;
    }
    
    const newPlaylist = {
      id: Date.now().toString(),
      name: name.trim(),
      data: [],
    };
    
    setPlaylists([...playlists, newPlaylist]);
    return newPlaylist;
  };

  const renamePlaylist = (playlistId, newName) => {
    if (!newName.trim()) {
      setError('Playlist name cannot be empty');
      return false;
    }
    
    if (DEFAULT_PLAYLISTS.some(p => p.id === playlistId)) {
      setError('Cannot rename default playlists');
      return false;
    }
    
    if (playlists.some(p => p.id !== playlistId && p.name.toLowerCase() === newName.trim().toLowerCase())) {
      setError('A playlist with this name already exists');
      return false;
    }

    setPlaylists(playlists.map(playlist => 
      playlist.id === playlistId 
        ? { ...playlist, name: newName.trim() }
        : playlist
    ));
    
    return true;
  };

  const deletePlaylist = (playlistId) => {
    if (DEFAULT_PLAYLISTS.some(p => p.id === playlistId)) {
      setError('Cannot delete default playlists');
      return false;
    }

    const updatedPlaylists = playlists.filter(p => p.id !== playlistId);
    setPlaylists(updatedPlaylists);
    
    if (currentPlaylistId === playlistId) {
      setCurrentPlaylistId(null);
      TrackPlayer.reset();
    }
    
    return true;
  };

const addToPlaylist = (playlistId, songIds) => {
  if (playlistId === '0') {
    setError('Cannot add to the "All" playlist directly');
    return false;
  }
  
  const allPlaylist = playlists.find(p => p.id === '0');
  if (!allPlaylist) {
    setError('All songs playlist not found');
    return false;
  }
  
  const targetPlaylist = playlists.find(p => p.id === playlistId);
  if (!targetPlaylist) {
    setError('Target playlist not found');
    return false;
  }
  
  const songsToAdd = songIds.map(id => 
    allPlaylist.data.find(song => song.id === id)
  ).filter(Boolean);
  
  const newSongs = songsToAdd.filter(song => 
    !targetPlaylist.data.some(existingSong => existingSong.id === song.id)
  );
  
  if (newSongs.length === 0) return false;
  
  const updatedPlaylists = playlists.map(playlist => {
    if (playlist.id === playlistId) {
      return {
        ...playlist,
        data: [...playlist.data, ...newSongs],
      };
    }
    return playlist;
  });
  
  setPlaylists(updatedPlaylists);
  return true;
};

  const removeFromPlaylist = (playlistId, songIds) => {
    if (playlistId === '0') {
      setError('Cannot remove from the "All" playlist');
      return false;
    }

    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist) {
      setError('Playlist not found');
      return false;
    }
    
    const updatedPlaylists = playlists.map(playlist => {
      if (playlist.id === playlistId) {
        return {
          ...playlist,
          data: playlist.data.filter(song => !songIds.includes(song.id)),
        };
      }
      return playlist;
    });
    
    setPlaylists(updatedPlaylists);
    return true;
  };

  const playPlaylistTrack = async (playlistId, trackIndex = 0) => {
    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist || !playlist.data.length) {
      setError('No songs found in playlist');
      return false;
    }
    
    if (trackIndex < 0 || trackIndex >= playlist.data.length) {
      trackIndex = 0;
    }
    
    const songsToPlay = shuffleMode && playlistId !== '0' ? 
      [...playlist.data].sort(() => Math.random() - 0.5) : 
      playlist.data;
      
    if (songsToPlay.length === 0) {
      setError('No songs to play');
      return false;
    }
  
    try {
      setCurrentPlaylistId(playlistId);
      setCurrentTrackIndex(trackIndex);
  
      await TrackPlayer.reset();
      await TrackPlayer.add(songsToPlay);
      
      // Set the repeat mode on the player to match our state
      await TrackPlayer.setRepeatMode(repeatMode);
      
      // Set the shuffle mode on the player to match our state
      await TrackPlayer.setShuffleModeEnabled(shuffleMode);
      
      await TrackPlayer.skip(trackIndex);
      await TrackPlayer.play();
      return true;
    } catch (error) {
      console.error('Error playing track:', error);
      setError('Error playing track: ' + error.message);
      return false;
    }
  };

  const playNext = async () => {
    if (currentPlaylistId === null) {
      setError('No playlist is currently active');
      return false;
    }

    const playlist = playlists.find(p => p.id === currentPlaylistId);
    if (!playlist) {
      setError('Current playlist not found');
      return false;
    }

    let nextIndex = currentTrackIndex + 1;
    
    if (nextIndex >= playlist.data.length) {
      if (repeatMode === RepeatMode.Queue) {
        nextIndex = 0;
      } else {
        setError('End of playlist reached');
        return false;
      }
    }

    return await playPlaylistTrack(currentPlaylistId, nextIndex);
  };

  const playPrevious = async () => {
    if (currentPlaylistId === null) {
      setError('No playlist is currently active');
      return false;
    }

    const playlist = playlists.find(p => p.id === currentPlaylistId);
    if (!playlist) {
      setError('Current playlist not found');
      return false;
    }

    let prevIndex = currentTrackIndex - 1;
    
    if (prevIndex < 0) {
      if (repeatMode === RepeatMode.Queue) {
        prevIndex = playlist.data.length - 1;
      } else {
        setError('Beginning of playlist reached');
        return false;
      }
    }

    return await playPlaylistTrack(currentPlaylistId, prevIndex);
  };

  const toggleRepeatMode = async () => {
    const modes = [RepeatMode.Off, RepeatMode.Track, RepeatMode.Queue];
    const currentIndex = modes.indexOf(repeatMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    
    try {
      setRepeatMode(modes[nextIndex]);
      await TrackPlayer.setRepeatMode(modes[nextIndex]);
      return true;
    } catch (error) {
      console.error('Error setting repeat mode:', error);
      setError('Error setting repeat mode: ' + error.message);
      return false;
    }
  };

  const toggleShuffle = async () => {
    const newShuffleMode = !shuffleMode;
    
    try {
      setShuffleMode(newShuffleMode);
      
      if (currentPlaylistId) {
        await TrackPlayer.setShuffleModeEnabled(newShuffleMode);
        
        if (newShuffleMode && currentPlaylistId !== '0') {
          await playPlaylistTrack(currentPlaylistId, 0);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error setting shuffle mode:', error);
      setError('Error setting shuffle mode: ' + error.message);
      return false;
    }
  };

  const getCurrentTrack = () => {
    if (currentPlaylistId === null) return null;
    
    const playlist = playlists.find(p => p.id === currentPlaylistId);
    if (!playlist || !playlist.data[currentTrackIndex]) return null;

    return playlist.data[currentTrackIndex];
  };

  const getCurrentPlaylist = () => {
    if (currentPlaylistId === null) return null;
    return playlists.find(p => p.id === currentPlaylistId);
  };

  const isDefaultPlaylist = (playlistId) => {
    return DEFAULT_PLAYLISTS.some(p => p.id === playlistId);
  };

  const getAllSongsFromPlaylists = () => {
    const allPlaylist = playlists.find(p => p.id === '0');
    return allPlaylist ? allPlaylist.data : [];
  };

  const addToFavorites = (songIds) => {
    return addToPlaylist('1', songIds);
  };

  const removeFromFavorites = (songIds) => {
    return removeFromPlaylist('1', songIds);
  };

  const isInFavorites = (songId) => {
    const favoritesPlaylist = playlists.find(p => p.id === '1');
    if (!favoritesPlaylist) return false;
    return favoritesPlaylist.data.some(song => song.id === songId);
  };

  const clearError = () => {
    setError(null);
  };

  console.warn(playlists)
  const value = {
    isPlayerReady,
    isScanning,
    scanProgress,
    scannedFolders,
    totalFiles,
    error,
    playlists,
    currentPlaylistId,
    currentTrackIndex,
    repeatMode,
    shuffleMode,
    currentTrack: getCurrentTrack(),
    currentPlaylist: getCurrentPlaylist(),
    setupPlayer,
    scanDeviceForMusic,
    verifySongs,
    createPlaylist,
    renamePlaylist,
    deletePlaylist,
    addToPlaylist,
    removeFromPlaylist,
    playPlaylistTrack,
    playNext,
    playPrevious,
    toggleRepeatMode,
    toggleShuffle,
    getCurrentTrack,
    getCurrentPlaylist,
    isDefaultPlaylist,
    getAllSongs: getAllSongsFromPlaylists,
    addToFavorites,
    removeFromFavorites,
    isInFavorites,
    clearError,
    play: TrackPlayer.play,
    pause: TrackPlayer.pause,
    seekTo: enhancedSeekTo,
    setVolume: TrackPlayer.setVolume,
    getState: TrackPlayer.getState,
    getPosition: TrackPlayer.getPosition,
    getDuration: TrackPlayer.getDuration,
  };

  return (
    <PlayerContext.Provider value={value}>
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};

export const usePlayerProgress = () => {
  return useProgress();
};

export const usePlayerEvents = (events, handler) => {
  return useTrackPlayerEvents(events, handler);
};