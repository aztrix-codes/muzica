import { Text, View, FlatList, TouchableOpacity} from 'react-native';
import React, {useEffect, useState} from 'react';
import {useTheme} from './ThemeContext';
import {usePlayer} from './PlayerContext';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Octicons from 'react-native-vector-icons/Octicons';
import TrackPlayer, { RepeatMode } from 'react-native-track-player';

const Songs = () => {
  const {theme} = useTheme();
  const {
    playlists,
    isScanning,
    isInFavorites,
    addToFavorites,
    removeFromFavorites,
  } = usePlayer();
  const [songs, setSongs] = useState([]);
  const [sortBy, setSortBy] = useState('title'); 
  const [direction, setDirection] = useState('ascending');
  const [currentTrackId, setCurrentTrackId] = useState(null);

  useEffect(() => {
    const updateCurrentTrack = async () => {
      const trackIndex = await TrackPlayer.getCurrentTrack();
      if (trackIndex !== null) {
        const track = await TrackPlayer.getTrack(trackIndex);
        setCurrentTrackId(track?.id || null);
      }
    };

    const listener = TrackPlayer.addEventListener('playback-track-changed', updateCurrentTrack);

    updateCurrentTrack();

    return () => {
      listener.remove();
    };
  }, []);


  useEffect(() => {
    const allPlaylist = playlists.find(playlist => playlist.id === '0');
    if (allPlaylist) {
      const playlistSongs = [...(allPlaylist.data || [])];
  
       if (sortBy === 'title') {
        if (direction === "ascending") {
          playlistSongs.sort((a, b) => a.title.localeCompare(b.title));
        } else {
          playlistSongs.sort((a, b) => a.title.localeCompare(b.title)).reverse();
        }
      } else {
        if (direction === "ascending") {
          playlistSongs.sort((a, b) => (b.dateAdded || 0) - (a.dateAdded || 0)).reverse();
        } else {
          playlistSongs.sort((a, b) => (b.dateAdded || 0) - (a.dateAdded || 0));
        }
      }
  
      setSongs(playlistSongs);
    }
  }, [playlists, sortBy, direction]);


  const playSongAtIndex = async (index) => {
    try {
      const currentSongs = [...songs];    

      await TrackPlayer.reset();      
      await TrackPlayer.add(currentSongs);
      await TrackPlayer.setRepeatMode(RepeatMode.Queue);      
      await TrackPlayer.skip(index);      
      await TrackPlayer.play();

      setCurrentTrackId(currentSongs[index].id);

    } catch (error) {
      console.error('Error playing song:', error);
    }
  };

  const toggleSortMode = () => {
    setSortBy(sortBy === 'added' ? 'title' : 'added');
  };

  const toggleDirection = () => {
    setDirection(direction === 'ascending' ? 'descending' : 'ascending');
  };

  const toggleFavorite = songId => {
    if (isInFavorites(songId)) {
      removeFromFavorites([songId]);
    } else {
      addToFavorites([songId]);
    }
  };

  const renderSongItem = ({item, index}) => (
    <TouchableOpacity
      style={
        { backgroundColor: theme.colors.bgPrimary, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: theme.yard, borderBottomWidth: theme.yard * 0.1, borderBottomColor: theme.colors.bgSecondary }
      }
      onPress={() => playSongAtIndex(index)}>
      <View style={{ flex: 1, marginRight: theme.yard, overflow: 'hidden', }}>
        <Text
          style={[
            {color: theme.colors.tPrimary, fontSize: theme.fontSizes.xxl * 0.6, fontWeight: "500"},
            item.id === currentTrackId && {color: theme.colors.accent}
          ]}
          numberOfLines={1}>
          {item.title}
        </Text>
        <Text
          style={
            {color: theme.colors.tSecondary,fontSize: theme.fontSizes.m, marginTop: theme.yard - 8}
          }
          numberOfLines={1}>
          {item.artist || 'Unknown Artist'}
        </Text>
      </View>
      <View>
        <TouchableOpacity onPress={() => toggleFavorite(item.id)}>
          <Icon
            name={isInFavorites(item.id) ? 'favorite' : 'favorite-border'}
            size={24}
            color={theme.colors.accent}
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View
      style={{backgroundColor: theme.colors.bgPrimary, flex: 1, padding: theme.yard * 1.5}}>
      <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: theme.yard,}}>
        <Text style={{color: theme.colors.tPrimary, fontSize: theme.fontSizes.l}}>
          {songs.length} {songs.length === 1 ? 'Song' : 'Songs'}
        </Text>
        <View style={{flexDirection: "row"}}>
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: theme.yard, borderRadius: theme.yard * 2, marginHorizontal: theme.yard }} onPress={toggleSortMode}>
            <Icon
              name={sortBy === 'title' ? 'sort-by-alpha' : 'access-time'}
              size={theme.fontSizes.xxl - 2}
              color={theme.colors.accent}
            />
          </TouchableOpacity>
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', padding: theme.yard, borderRadius: theme.yard * 2, paddingRight: 0 }} onPress={toggleDirection}>
            <Octicons
              name={direction === 'ascending' ? 'sort-desc' : 'sort-asc'}
              size={theme.fontSizes.xxl - 2}
              color={theme.colors.accent}
            />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={songs}
        keyExtractor={item => item.id}
        renderItem={renderSongItem}
        contentContainerStyle={{paddingBottom: theme.yard}}
        ListEmptyComponent={
          <Text
            style={{color: theme.colors.tSecondary, textAlign: "center", marginTop: theme.yard}}>
            {isScanning ? 'Scanning for songs...' : 'No songs found'}
          </Text>
        }
      />
    </View>
  );
};


export default Songs;