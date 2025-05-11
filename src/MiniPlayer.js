import React, { useState, useEffect, useCallback } from 'react';
import {
  Text,
  TouchableOpacity,
  View,
  Modal,
  FlatList,
} from 'react-native';
import { Slider } from 'react-native-awesome-slider';
import { useSharedValue } from 'react-native-reanimated';
import Entypo from 'react-native-vector-icons/Entypo';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from './ThemeContext';
import { useNavigation } from '@react-navigation/native';
import TrackPlayer, {
  State,
  usePlaybackState,
  useTrackPlayerEvents,
  Event,
} from 'react-native-track-player';
import { BlurView } from '@react-native-community/blur';

const MiniPlayer = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const playbackState = usePlaybackState(); 
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [queue, setQueue] = useState([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(null);
  const [trackDetails, setTrackDetails] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const sliderProgress = useSharedValue(0);
  const sliderMin = useSharedValue(0);
  const sliderMax = useSharedValue(1);

  const fetchTrackDetails = useCallback(async () => {
    try {
      const index = await TrackPlayer.getCurrentTrack();
      if (index !== null) {
        setCurrentTrackIndex(index);
        const track = await TrackPlayer.getTrack(index);
        // console.log("Current track data:", JSON.stringify(track));
        
        if (track) {
          setTrackDetails({
            title: typeof track.title === 'string' ? track.title : 'Unknown',
            artist: typeof track.artist === 'string' ? track.artist : 'Unknown',
          });
        } else {
          setTrackDetails({
            title: 'Unknown',
            artist: 'Unknown',
          });
        }
      }
    } catch (error) {
      // console.log('Error fetching track details:', error);
      setTrackDetails({
        title: 'Unknown',
        artist: 'Unknown',
      });
    }
  }, []);

  const updatePlaybackState = useCallback(async () => {
    try {
      const state = await TrackPlayer.getState();
      setIsPlaying(state === State.Playing);
      await fetchTrackDetails();
    } catch (error) {
      // console.log('Error updating playback state:', error);
    }
  }, [fetchTrackDetails]);

  useEffect(() => {
    updatePlaybackState();
  }, [playbackState, updatePlaybackState]);

  useTrackPlayerEvents([Event.PlaybackActiveTrackChanged, Event.PlaybackState], async (event) => {
    // console.log("Track player event:", event.type);
    await fetchTrackDetails();
    updatePlaybackState();
  });

  useEffect(() => {
    const updateQueue = async () => {
      try {
        const tracks = await TrackPlayer.getQueue();
        // console.log(`Queue updated: ${tracks.length} tracks`);
        setQueue(tracks);
        await fetchTrackDetails();
        await updatePlaybackState();
      } catch (error) {
        // console.log('Error updating queue:', error);
      }
    };

    updateQueue();
  }, [fetchTrackDetails, updatePlaybackState, showPlaylistModal]);

  useEffect(() => {
    const updateProgress = async () => {
      try {
        const position = await TrackPlayer.getPosition();
        const duration = await TrackPlayer.getDuration();
        sliderProgress.value = position || 0;
        sliderMax.value = duration || 1;
        await updatePlaybackState();
      } catch (error) {
        // console.log('Error updating progress:', error);
      }
    };

    const interval = setInterval(updateProgress, 1000);
    return () => clearInterval(interval);
  }, []);

  const togglePlayback = async () => {
    try {
      const state = await TrackPlayer.getState();
      if (state === State.Playing) {
        await TrackPlayer.pause();
        setIsPlaying(false);
      } else {
        await TrackPlayer.play();
        setIsPlaying(true);
        setTimeout(fetchTrackDetails, 300);
      }
    } catch (error) {
      // console.log('Error toggling playback:', error);
    }
  };

  const skipToNext = async () => {
    try {
      await TrackPlayer.skipToNext();
      await TrackPlayer.play();
      setIsPlaying(true);
      setTimeout(fetchTrackDetails, 300);
    } catch (error) {
      // console.log('Error skipping to next:', error);
    }
  };

  const skipToIndex = async (index) => {
    try {
      await TrackPlayer.skip(index);
      setCurrentTrackIndex(index);
      
      if (queue[index]) {
        setTrackDetails({
          title: typeof queue[index].title === 'string' ? queue[index].title : 'Unknown',
          artist: typeof queue[index].artist === 'string' ? queue[index].artist : 'Unknown',
        });
      }
      
      await TrackPlayer.play();
      setIsPlaying(true);
      setShowPlaylistModal(false);
      
      setTimeout(fetchTrackDetails, 300);
    } catch (error) {
      // console.log('Error skipping to index:', error);
    }
  };

  const renderPlaylistItem = ({ item, index }) => {
    const isCurrent = index === currentTrackIndex;
    
    const trackTitle = typeof item?.title === 'function' ? 'Unknown' : 
                       typeof item?.title === 'string' ? item.title : 'Unknown';
                       
    const trackArtist = typeof item?.artist === 'function' ? 'Unknown Artist' : 
                        typeof item?.artist === 'string' ? item.artist : 'Unknown Artist';
    
    return (
      <TouchableOpacity
        style={
          {
            backgroundColor: isCurrent
              ? theme.colors.bgSecondary
              : theme.colors.bgPrimary,
            padding: theme.yard
          }
        }
        onPress={() => skipToIndex(index)}
      >
        <Text
          style={[
            { fontSize:theme.fontSizes.m + 2,
              color: isCurrent
                ? theme.colors.accent
                : theme.colors.tPrimary,
              letterSpacing: theme.yard * 0.05
            }
          ]}
          numberOfLines={1}
        >
          {trackTitle}
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
          numberOfLines={1}
        >
          {trackArtist}
        </Text>
      </TouchableOpacity>
    );
  };

  useEffect(() => {
    fetchTrackDetails();
  }, [fetchTrackDetails]);

  useEffect(() => {
    const setupPlayer = async () => {
      try {
        // console.log("Setting up the player...");
        const state = await TrackPlayer.getState();
        // console.log("Initial player state:", state);
        if (state !== State.None) {
          await fetchTrackDetails();
        }
      } catch (error) {
        // console.log("Player setup error:", error);
      }
    };
    
    setupPlayer();
  }, [fetchTrackDetails]);
  
  return (
    <View style={{ backgroundColor: theme.colors.bgSecondary }}>
      <Slider 
        sliderHeight={4} 
        bubbleContainerStyle={{display: 'none'}} 
        thumbWidth={0}
        style={{ zIndex: 1 }}
        theme={{
          disableMinTrackTintColor: theme.colors.bgPrimary,
          maximumTrackTintColor: theme.colors.bgSecondary,
          minimumTrackTintColor: theme.colors.accent,
        }}
        progress={sliderProgress}
        minimumValue={sliderMin}
        maximumValue={sliderMax}
        onSlidingComplete={async (value) => {
          try {
            await TrackPlayer.seekTo(value);
          } catch (error) {
            // console.log("Error seeking:", error);
          }
        }}
      />

      <TouchableOpacity
        style={{ width: '100%', alignItems: 'center' }}
        activeOpacity={0.5}
        onPress={() => navigation.navigate('Player')}
      >
        <View
          style={{
            flexDirection: 'row',
            padding: theme.yard,
            alignItems: 'center',
            paddingLeft: 0,
            backgroundColor: theme.colors.bgPrimary,
          }}
        >
          <View style={{ flex: 1.5, justifyContent: 'center', alignItems: 'center' }}>
            <MaterialCommunityIcon
              name="music-circle"
              size={theme.fontSizes.m * 3}
              color={theme.colors.tPrimary}
            />
          </View>

          <View style={{ flex: 5 }}>
            <Text
              style={{
                fontSize: theme.fontSizes.m + 2,
                color: theme.colors.tPrimary, letterSpacing: theme.yard * 0.05,
              }}
              ellipsizeMode="tail"
              numberOfLines={1}
            >
              {trackDetails ? getTrackTitle(trackDetails) : 'Unknown'}
            </Text>
            <Text
              style={{
                fontSize: theme.fontSizes.s + 2,
                color: theme.colors.tSecondary, letterSpacing: theme.yard * 0.05,
              }}
              ellipsizeMode="tail"
              numberOfLines={1}
            >
              {trackDetails ? getTrackArtist(trackDetails) : 'Unknown Artist'}
            </Text>
          </View>

          <View
            style={{
              flex: 3.5,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingLeft: theme.yard,
            }}
          >
            <TouchableOpacity activeOpacity={0.5} onPress={togglePlayback}>
              <MaterialCommunityIcon
                name={isPlaying ? 'pause' : 'play'}
                size={theme.fontSizes.xxxl}
                color={theme.colors.tPrimary}
              />
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.5} onPress={skipToNext}>
              <MaterialCommunityIcon
                name="skip-next"
                size={theme.fontSizes.xxxl + 5}
                color={theme.colors.tPrimary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.5}
              onPress={() => setShowPlaylistModal(true)}
            >
              <MaterialCommunityIcon
                name="playlist-music"
                size={theme.fontSizes.xxxl}
                color={theme.colors.tPrimary}
              />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>

      <Modal 
        statusBarTranslucent
        visible={showPlaylistModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPlaylistModal(false)}
      >
        <BlurView
            style={{ position: "absolute", top: 0, left: 0, bottom: 0, right: 0 }}
              blurType="dark"
              blurAmount={10}
            />
        <View style={{flex: 1, flexDirection: 'column', justifyContent: 'flex-end'}}>
            <View
            style={{ backgroundColor: theme.colors.bgPrimary,  paddingTop: theme.yard, height: theme.yard * 45, borderTopRightRadius: theme.yard * 2, borderTopLeftRadius: theme.yard * 2 }}
          >
            <View
              style={
                { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: theme.yard, borderBottomWidth: theme.yard * 0.1, borderBottomColor: theme.colors.bgSecondary }
              }
            >
              <Text style={[ { color: theme.colors.tPrimary, fontSize: theme.fontSizes.xl, fontWeight: 'bold' }]}>
                Current Playlist
              </Text>
              <TouchableOpacity onPress={() => setShowPlaylistModal(false)}>
                <MaterialCommunityIcon
                  name="close"
                  size={theme.fontSizes.xxl}
                  color={theme.colors.tPrimary}
                />
              </TouchableOpacity>
            </View>

            <FlatList
              data={queue}
              keyExtractor={(item, index) => `${item.id || ''}-${index}`}
              renderItem={renderPlaylistItem}
              contentContainerStyle={{paddingBottom: theme.yard}}
              ListEmptyComponent={
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', }}>
                  <Text style={{ color: theme.colors.tSecondary, marginTop: theme.yard * 2 }}>
                    No songs in playlist
                  </Text>
                </View>
              }
            />
            <View
              style={
                { padding: theme.yard * 1.5, borderTopWidth: theme.yard * 0.1, alignItems: 'center',borderTopColor: theme.colors.bgSecondary  }
              }
            >
              <Text style={{ color: theme.colors.tSecondary }}>
                Now Playing: {typeof trackDetails?.title === 'function' ? 'Unknown' : trackDetails?.title || 'Unknown'}
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const getTrackTitle = (track) => {
  if (!track) return 'Unknown';
  if (typeof track.title === 'function') return 'Unknown';
  if (typeof track.title === 'string') return track.title;
  return 'Unknown';
};

const getTrackArtist = (track) => {
  if (!track) return 'Unknown Artist';
  if (typeof track.artist === 'function') return 'Unknown Artist';
  if (typeof track.artist === 'string') return track.artist;
  return 'Unknown Artist';
};


export default MiniPlayer;