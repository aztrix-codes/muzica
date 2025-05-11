import {
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  FlatList,
} from 'react-native';
import React, { useState, useEffect } from 'react';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Slider } from 'react-native-awesome-slider';
import { useTheme } from './ThemeContext';
import { useNavigation } from '@react-navigation/native';
import Entypo from 'react-native-vector-icons/Entypo';
import Ionicons from 'react-native-vector-icons/Ionicons';
import TrackPlayer, {
  RepeatMode,
  State,
  useTrackPlayerEvents,
  Event,
  useProgress,
} from 'react-native-track-player';
import { useSharedValue, useDerivedValue } from 'react-native-reanimated';
import { usePlayer } from './PlayerContext';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from '@react-native-community/blur';

const screenWidth = Dimensions.get('window').width;
const fontSize = screenWidth * 0.05;

const REPEAT_MODE_STORAGE_KEY = '@music_app_repeat_mode';
const SHUFFLE_MODE_STORAGE_KEY = '@music_app_shuffle_mode';

const Player = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const progress = useSharedValue(0);
  const min = useSharedValue(0);
  const max = useSharedValue(1);
  const { position, duration } = useProgress();

  const [track, setTrack] = useState(null);
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(null);
  const [playMode, setPlayMode] = useState(RepeatMode.Queue);
  const [playing, setPlaying] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [shuffleMode, setShuffleMode] = useState(false);

  const {
    isInFavorites,
    addToFavorites,
    removeFromFavorites,
    addToPlaylist,
    removeFromPlaylist,
    playlists,
  } = usePlayer();

  useEffect(() => {
    if (duration > 0) {
      progress.value = position;
      max.value = duration;
    }
  }, [position, duration]);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedMode = await AsyncStorage.getItem(REPEAT_MODE_STORAGE_KEY);
        if (savedMode !== null) {
          const modeValue = parseInt(savedMode, 10);
          setPlayMode(modeValue);
          await TrackPlayer.setRepeatMode(modeValue);
        }
        
        const savedShuffleMode = await AsyncStorage.getItem(SHUFFLE_MODE_STORAGE_KEY);
        if (savedShuffleMode !== null) {
          setShuffleMode(savedShuffleMode === 'true');
        }
      } catch (error) {
        console.error('Failed to load player settings:', error);
      }
    };
    
    loadSettings();
  }, []);

  useEffect(() => {
    const setup = async () => {
      const currentTrackIndex = await TrackPlayer.getCurrentTrack();
      if (currentTrackIndex !== null) {
        const currentTrack = await TrackPlayer.getTrack(currentTrackIndex);
        setTrack(currentTrack);
        setCurrentIndex(currentTrackIndex);
      }
      const queue = await TrackPlayer.getQueue();
      setQueue(queue);
      const state = await TrackPlayer.getState();
      setPlaying(state === State.Playing);
    };
    setup();
  }, []);

  useTrackPlayerEvents([Event.PlaybackActiveTrackChanged, Event.PlaybackState], async (event) => {
    if (event.type === Event.PlaybackActiveTrackChanged) {
      const currentTrack = await TrackPlayer.getTrack(event.index);
      setTrack(currentTrack);
      setCurrentIndex(event.index);
    }
    if (event.type === Event.PlaybackState) {
      const state = await TrackPlayer.getState();
      setPlaying(state === State.Playing);
    }
  });

  const togglePlayback = async () => {
    const state = await TrackPlayer.getState();
    if (state === State.Playing) {
      await TrackPlayer.pause();
      setPlaying(false);
    } else {
      await TrackPlayer.play();
      setPlaying(true);
    }
  };

  const getRandomTrackIndex = () => {
    return Math.floor(Math.random() * queue.length);
  };

  const skipToNext = async () => {
    try {
      if (shuffleMode) {
        let newIndex;
        do {
          newIndex = getRandomTrackIndex();
        } while (newIndex === currentIndex && queue.length > 1);
        
        await TrackPlayer.skip(newIndex);
        await TrackPlayer.play();
        setPlaying(true);
      } else {
        await TrackPlayer.skipToNext();
        await TrackPlayer.play();
        setPlaying(true);
      }
    } catch (e) {
      console.warn('Error skipping to next track:', e);
    }
  };
  
  const skipToPrev = async () => {
    try {
      if (shuffleMode) {
        let newIndex;
        do {
          newIndex = getRandomTrackIndex();
        } while (newIndex === currentIndex && queue.length > 1);
        
        await TrackPlayer.skip(newIndex);
        await TrackPlayer.play();
        setPlaying(true);
      } else {
        await TrackPlayer.skipToPrevious();
        await TrackPlayer.play();
        setPlaying(true);
      }
    } catch (e) {
      console.warn('Error skipping to previous track:', e);
    }
  };

  const modeSet = async () => {
    let newMode;
    if (playMode === RepeatMode.Queue) {
      newMode = RepeatMode.Track;
    } else if (playMode === RepeatMode.Track) {
      newMode = RepeatMode.Off;
    } else {
      newMode = RepeatMode.Queue;
    }
    
    if (newMode !== RepeatMode.Off && shuffleMode) {
      await handleToggleShuffle(false);
    }
    
    setPlayMode(newMode);
    await TrackPlayer.setRepeatMode(newMode);
    
    try {
      await AsyncStorage.setItem(REPEAT_MODE_STORAGE_KEY, newMode.toString());
    } catch (error) {
      console.error('Failed to save repeat mode:', error);
    }
  };

  const handleToggleShuffle = async (newValue = null) => {
    const newShuffleMode = newValue !== null ? newValue : !shuffleMode;
    
    if (newShuffleMode && playMode !== RepeatMode.Off) {
      setPlayMode(RepeatMode.Off);
      await TrackPlayer.setRepeatMode(RepeatMode.Off);
      try {
        await AsyncStorage.setItem(REPEAT_MODE_STORAGE_KEY, RepeatMode.Off.toString());
      } catch (error) {
        console.error('Failed to save repeat mode:', error);
      }
    }
    
    setShuffleMode(newShuffleMode);
    
    try {
      await AsyncStorage.setItem(SHUFFLE_MODE_STORAGE_KEY, newShuffleMode.toString());
    } catch (error) {
      console.error('Failed to save shuffle mode:', error);
    }
  };

  const formatTime = sec => {
    if (!sec || isNaN(sec)) return '00:00';
    const minutes = Math.floor(sec / 60);
    const seconds = Math.floor(sec % 60);
    return `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const skipToIndex = async index => {
    try {
      await TrackPlayer.skip(index);
      await TrackPlayer.play();
      setCurrentIndex(index);
      setShowPlaylistModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  const isInPlaylist = (playlistId, songId) => {
    if (!playlistId || !songId) return false;
    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist) return false;
    return playlist.data.some(song => song.id === songId);
  };

  const toggleSongInPlaylist = (playlistId, songId) => {
    if (!playlistId || !songId) return;
    if (isInPlaylist(playlistId, songId)) {
      removeFromPlaylist(playlistId, [songId]);
    } else {
      addToPlaylist(playlistId, [songId]);
    }
  };

  const renderPlaylistItem = ({ item, index }) => {
    const isCurrent = index === currentIndex;
    return (
      <TouchableOpacity
        style={{
          padding: theme.yard,
          backgroundColor: isCurrent ? theme.colors.bgSecondary : theme.colors.bgPrimary,
        }}
        onPress={() => skipToIndex(index)}>
        <Text
           style={[
            { fontSize:theme.fontSizes.m + 2,
              color: isCurrent
                ? theme.colors.accent
                : theme.colors.tPrimary,
              letterSpacing: theme.yard * 0.05
            }
          ]}
          numberOfLines={1}>
          {item.title}
        </Text>
        <Text
          style={
            {
              color: isCurrent
                ? theme.colors.accent
                : theme.colors.tSecondary,
              fontSize: theme.fontSizes.m, marginTop: theme.yard / 4, 
            }
          }
          numberOfLines={1}>
          {item.artist}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderPlaylistForToggle = ({ item }) => {
    if (item.id === '0') return null;
    const isActive = track?.id && isInPlaylist(item.id, track.id);
    
    return (
      <TouchableOpacity
        style={{
          padding: theme.yard * 1.5,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: isActive ? theme.colors.bgSecondary : theme.colors.bgPrimary
        }}
        onPress={() => {
          if (track?.id) {
            toggleSongInPlaylist(item.id, track.id);
          }
        }}
      >
        <Text style={{ 
          fontSize: theme.fontSizes.l, 
          color: isActive ? theme.colors.accent : theme.colors.tPrimary 
        }}>
          {item.name}
        </Text>
        {isActive && (
          <Icon name="check" size={fontSize + 2} color={theme.colors.accent} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bgPrimary }}>
      <View style={{ paddingLeft: theme.yard, paddingTop: theme.yard * 3}}>
        <Pressable onPress={() => navigation.goBack()}>
          <Feather name="chevron-down" size={theme.fontSizes.xxxl + 5} color={theme.colors.tPrimary} />
        </Pressable>
      </View>

      <View style={{ justifyContent: 'center', alignItems: 'center' }}>
        <MaterialCommunityIcon
          name="music-circle"
          size={theme.yard * 32}
          color={theme.colors.tPrimary}
        />
      </View>

      <View
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          flex: 1,
          paddingHorizontal: theme.yard,
        }}>
        <Text
          numberOfLines={1}
          style={{
            fontSize: theme.fontSizes.xxl,
            color: theme.colors.tPrimary,
            textAlign: 'center',
          }}>
          {track?.title || 'No song selected'}
        </Text>
        <Text
          numberOfLines={1}
          style={{
            fontSize: theme.fontSizes.l,
            color: theme.colors.tSecondary,
            textAlign: 'center', marginTop: theme.yard
          }}>
          {track?.artist || 'Unknown artist'}
        </Text>
      </View>

      <View style={{ paddingHorizontal: theme.yard * 2, paddingBottom: theme.yard }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingBottom: theme.yard,
          }}>
          <Text style={{ fontSize: theme.fontSizes.m, color: theme.colors.tPrimary }}>
            {formatTime(position)}
          </Text>
          <Text style={{ fontSize: theme.fontSizes.m, color: theme.colors.tPrimary }}>
            {formatTime(duration)}
          </Text>
        </View>
        <Slider
          containerStyle={{ borderRadius: theme.yard * 2 }}
          minimumValue={min}
          maximumValue={max}
          progress={progress}
          onSlidingComplete={val => TrackPlayer.seekTo(val)}
          theme={{
            disableMinTrackTintColor: theme.colors.bgPrimary,
            maximumTrackTintColor: theme.colors.bgSecondary,
            minimumTrackTintColor: theme.colors.accent,
          }}
          bubbleContainerStyle={{ display: 'none' }}
        />
      </View>

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-around',
          paddingVertical: theme.yard * 2,
          alignItems: 'center',
          paddingTop: theme.yard * 3,
        }}>
        <TouchableOpacity activeOpacity={0.5} style={{ width: theme.yard * 3 }} onPress={modeSet}>
          <MaterialCommunityIcon
            name={
              playMode === RepeatMode.Queue
                ? 'repeat'
                : playMode === RepeatMode.Track
                ? 'repeat-once'
                : 'repeat-off'
            }
            size={theme.fontSizes.xxxl}
            color={theme.colors.tPrimary}
          />
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.5} style={{ width: theme.yard * 3 }} onPress={skipToPrev}>
          <MaterialCommunityIcon
            name="skip-previous"
            size={theme.fontSizes.xxxl + 5}
            color={theme.colors.tPrimary}
          />
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.5} onPress={togglePlayback}>
          <MaterialCommunityIcon
            name={playing ? 'pause-circle' : 'play-circle'}
            size={theme.fontSizes.xxxl + 40}
            color={theme.colors.tPrimary}
          />
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.5} style={{ width: theme.yard * 3 }} onPress={skipToNext}>
          <MaterialCommunityIcon
            name="skip-next"
            size={theme.fontSizes.xxxl + 5}
            color={theme.colors.tPrimary}
          />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.5}
          style={{ width: theme.yard * 4 }}
          onPress={() => setShowPlaylistModal(true)}>
          <MaterialCommunityIcon
            name="playlist-music"
            size={theme.fontSizes.xxxl}
            color={theme.colors.tPrimary}
          />
        </TouchableOpacity>
      </View>

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-around',
          paddingVertical: theme.yard * 3,
          alignItems: 'center',
          paddingBottom: theme.yard * 3.5
        }}>
        <TouchableOpacity
          activeOpacity={0.5}
          style={{ width: theme.yard * 3  }}
          onPress={() => handleToggleShuffle()}
        >
          <MaterialCommunityIcon
            name={shuffleMode ? "shuffle-variant" : "shuffle-disabled"}
            size={theme.fontSizes.xxl + 5}
            color={shuffleMode ? theme.colors.accent : theme.colors.tPrimary}
          />
        </TouchableOpacity>

        <TouchableOpacity style={{width: theme.yard * 3 }}
          activeOpacity={0.5}
          onPress={() => {
            if (track?.id) {
              if (isInFavorites(track.id)) {
                removeFromFavorites([track.id]);
              } else {
                addToFavorites([track.id]);
              }
            }
          }}>
          <Icon
            name={track?.id && isInFavorites(track.id) ? 'favorite' : 'favorite-border'}
            size={theme.fontSizes.xxl}
            color={track?.id && isInFavorites(track.id) ? theme.colors.accent : theme.colors.tPrimary}
          />
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.5} style={{ width: theme.yard * 3  }} onPress={()=>navigation.navigate("Theme")}>
          <MaterialCommunityIcon
            name="palette-outline"
            size={theme.fontSizes.xxl}
            color={theme.colors.tPrimary}
          />
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.5} style={{width: theme.yard * 3 }} onPress={() => setShowAddModal(true)}>
          <MaterialCommunityIcon
            name="plus"
            size={theme.fontSizes.xxl + 5}
            color={theme.colors.tPrimary}
          />
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.5} style={{ width: theme.yard * 3  }} onPress={()=>navigation.navigate("Sleep mode")}>
          <Ionicons
            name="bed-outline"
            size={theme.fontSizes.xxxl - 3}
            color={theme.colors.tPrimary}
          />
        </TouchableOpacity>
      </View>

      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddModal(false)}
      >
        <BlurView
            style={{ position: "absolute", top: 0, left: 0, bottom: 0, right: 0 }}
              blurType="dark"
              blurAmount={10}
            />
        <View style={{flex: 1, flexDirection: 'column', justifyContent: 'flex-end'}}>
            <View style={{ backgroundColor: theme.colors.bgPrimary, height: theme.yard * 45, borderTopRightRadius: theme.yard * 2, borderTopLeftRadius: theme.yard * 2 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: theme.yard * 1.5, alignItems: 'center' }}>
            <Text style={{ fontSize: theme.fontSizes.xl, color: theme.colors.tPrimary, fontWeight: 'bold' }}>
              Toggle Playlists
            </Text>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Ionicons name="close" size={theme.fontSizes.xxl} color={theme.colors.tPrimary} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={playlists.filter(p => p.id > 1)} 
            keyExtractor={item => item.id}
            renderItem={renderPlaylistForToggle}
            contentContainerStyle={{ paddingBottom: theme.yard }}
          />
        </View>
        </View>
      </Modal>

      <Modal
        visible={showPlaylistModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPlaylistModal(false)}>
          <BlurView
                      style={{ position: "absolute", top: 0, left: 0, bottom: 0, right: 0 }}
                        blurType="dark"
                        blurAmount={10}
                      />
        <View style={{flex: 1, flexDirection: 'column', justifyContent: 'flex-end'}}>
            <View style={{  backgroundColor: theme.colors.bgPrimary, paddingTop: theme.yard, height: theme.yard * 45, borderTopRightRadius: theme.yard * 2, borderTopLeftRadius: theme.yard * 2  }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              padding: theme.yard * 1.5,
            }}>
            <Text style={{ fontSize: theme.fontSizes. xl, color: theme.colors.tPrimary, fontWeight: 'bold' }}>
              Current Playlist
            </Text>
            <TouchableOpacity onPress={() => setShowPlaylistModal(false)}>
              <Ionicons name="close" size={theme.fontSizes.xxl} color={theme.colors.tPrimary} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={queue}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            renderItem={renderPlaylistItem}
            contentContainerStyle={{ paddingBottom: theme.yard}}
          />
        </View>
        </View>
      </Modal>
    </View>
  );
};

export default Player;

const styles = StyleSheet.create({});