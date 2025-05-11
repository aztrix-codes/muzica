import { Text, View, FlatList, TouchableOpacity, Modal, SafeAreaView, Alert } from 'react-native';
import React, { useState, useEffect, useLayoutEffect } from 'react';
import { useTheme } from './ThemeContext';
import { usePlayer } from './PlayerContext';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Octicons from 'react-native-vector-icons/Octicons';
import TrackPlayer, { RepeatMode } from 'react-native-track-player';
import MiniPlayer from './MiniPlayer';

const Playlist = ({ route, navigation }) => {
  const { theme } = useTheme();
  const {
    playlists,
    isInFavorites,
    addToFavorites,
    removeFromFavorites,
    addToPlaylist,
    removeFromPlaylist,
  } = usePlayer();
  const { playlist: initialPlaylist } = route.params;
  const [playlist, setPlaylist] = useState(initialPlaylist);
  const [songs, setSongs] = useState([]);
  const [sortBy, setSortBy] = useState('title');
  const [modalVisible, setModalVisible] = useState(false);
  const [allSongs, setAllSongs] = useState([]);
  const [selectedSongs, setSelectedSongs] = useState([]);
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

    const listeners = [
      TrackPlayer.addEventListener('playback-track-changed', updateCurrentTrack),
      TrackPlayer.addEventListener('playback-state', updateCurrentTrack),
    ];

    updateCurrentTrack();

    return () => {
      listeners.forEach(listener => listener.remove());
    };
  }, []);

  useEffect(() => {
    const updatedPlaylist = playlists.find(p => p.id === playlist.id);
    if (updatedPlaylist) {
      setPlaylist(updatedPlaylist);
    }
  }, [playlists]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: playlist.name,
    });
  }, [navigation, playlist]);

  useEffect(() => {
    if (playlist.data) {
      const sortedSongs = [...playlist.data];

      if (sortBy === 'title') {
        if (direction === "ascending") {
          sortedSongs.sort((a, b) => a.title.localeCompare(b.title));
        } else {
          sortedSongs.sort((a, b) => a.title.localeCompare(b.title)).reverse();
        }
      } else {
        if (direction === "ascending") {
          sortedSongs.sort((a, b) => (b.dateAdded || 0) - (a.dateAdded || 0)).reverse();
        } else {
          sortedSongs.sort((a, b) => (b.dateAdded || 0) - (a.dateAdded || 0));
        }
      }

      setSongs(sortedSongs);
    } else {
      setSongs([]);
    }
  }, [playlist.data, sortBy, direction]);

  useEffect(() => {
    const allPlaylist = playlists.find(p => p.id === '0');
    if (allPlaylist && allPlaylist.data) {
      const existingSongIds = new Set(playlist.data?.map(song => song.id) || []);
      const availableSongs = allPlaylist.data.filter(
        song => !existingSongIds.has(song.id)
      );
      setAllSongs(availableSongs);
    }
  }, [playlists, playlist.data]);

  const playSongAtCurrentIndex = async (index) => {
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

  const handleRemoveSong = (songId) => {
    Alert.alert(
      'Remove Song',
      'Are you sure you want to remove this song from the playlist?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          onPress: () => {
            removeFromPlaylist(playlist.id, [songId]);
            setPlaylist(prev => ({
              ...prev,
              data: prev.data.filter(song => song.id !== songId)
            }));
          }
        }
      ]
    );
  };

  const toggleSongSelection = songId => {
    setSelectedSongs(prevSelected => {
      if (prevSelected.includes(songId)) {
        return prevSelected.filter(id => id !== songId);
      } else {
        return [...prevSelected, songId];
      }
    });
  };

  const addSelectedSongsToPlaylist = async () => {
    if (selectedSongs.length === 0) return;
    
    try {
      const success = await addToPlaylist(playlist.id, selectedSongs);
      if (success) {
        const allPlaylist = playlists.find(p => p.id === '0');
        if (allPlaylist) {
          const addedSongs = allPlaylist.data.filter(song => 
            selectedSongs.includes(song.id)
          );
          setPlaylist(prev => ({
            ...prev,
            data: [...prev.data, ...addedSongs]
          }));
        }
        
        setSelectedSongs([]);
        setModalVisible(false);
      }
    } catch (error) {
      console.error('Failed to add songs:', error);
    }
  };

  const renderSongItem = ({ item, index }) => (
    <TouchableOpacity
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: theme.yard,
        backgroundColor: theme.colors.bgPrimary,
      }}
      onPress={() => playSongAtCurrentIndex(index)}>
      <View style={{ flex: 1, marginRight: 16 }}>
        <Text
          numberOfLines={1}
          style={{
            fontSize: theme.fontSizes.l - 1,
            fontWeight: '400',
            color: item.id === currentTrackId ? theme.colors.accent : theme.colors.tPrimary,
          }}>
          {item.title}
        </Text>
        <Text 
          style={{
            fontSize: theme.fontSizes.m - 1,
            marginTop: theme.yard * 0.2,
            color: theme.colors.tSecondary,
          }}>
          {item.artist}
        </Text>
      </View>
      <View>
        {playlist.id === '1' ? (
          <TouchableOpacity onPress={() => toggleFavorite(item.id)}>
            <Icon
              name={isInFavorites(item.id) ? 'favorite' : 'favorite-border'}
              size={theme.fontSizes.xxl}
              color={theme.colors.accent}
            />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => handleRemoveSong(item.id)}>
            <MaterialCommunityIcons
              name="playlist-remove"
              size={theme.fontSizes.xxl}
              color={theme.colors.accent}
            />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderModalSongItem = ({ item }) => (
    <TouchableOpacity
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: theme.yard,
        paddingHorizontal: theme.yard,
        ...(selectedSongs.includes(item.id) && {
          backgroundColor: theme.colors.bgSecondary,
        }),
      }}
      onPress={() => toggleSongSelection(item.id)}>
      <View style={{ flex: 1, marginRight: theme.yard }}>
        <Text
          numberOfLines={1}
          style={{
            fontSize: theme.fontSizes.l - 2,
            fontWeight: '500',
            color: theme.colors.tPrimary,
          }}>
          {item.title}
        </Text>
        <Text style={{
          fontSize: theme.fontSizes.m - 1,
          marginTop: theme.yard * 0.3,
          color: theme.colors.tSecondary,
        }}>
          {item.artist}
        </Text>
      </View>
      <Icon
        name={selectedSongs.includes(item.id) ? 'check-circle' : 'radio-button-unchecked'}
        size={theme.fontSizes.xxl}
        color={theme.colors.accent}
      />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bgPrimary }}>
      <View style={{ flex: 1, padding: theme.yard * 1.5, backgroundColor: theme.colors.bgPrimary }}>
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: theme.yard,
        }}>
          <Text style={{
            fontSize: theme.fontSizes.l,
            fontWeight: '600',
            color: theme.colors.tPrimary,
          }}>
            {songs.length} {songs.length === 1 ? 'Song' : 'Songs'}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity 
              onPress={toggleSortMode}
            >
              <Icon
                name={sortBy === 'title' ? 'sort-by-alpha' : 'access-time'}
                size={theme.fontSizes.xl}
                color={theme.colors.accent}
              />
            </TouchableOpacity>
            <TouchableOpacity 
              style={{ marginHorizontal: theme.yard * 2}}
              onPress={toggleDirection}
            >
              <Octicons
                name={direction === 'ascending' ? 'sort-desc' : 'sort-asc'}
                size={theme.fontSizes.xl}
                color={theme.colors.accent}
              />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setModalVisible(true)}
            >
              <Icon
                name="playlist-add"
                size={theme.fontSizes.xxl}
                color={theme.colors.accent}
              />
            </TouchableOpacity>
          </View>
        </View>

        <FlatList
          data={songs}
          keyExtractor={item => item.id}
          renderItem={renderSongItem}
          contentContainerStyle={{ paddingBottom: theme.yard }}
          ListEmptyComponent={
            <Text style={{
              textAlign: 'center',
              marginTop: theme.yard,
              color: theme.colors.tSecondary,
            }}>
              No songs in this playlist
            </Text>
          }
        />
        
        <Modal statusBarTranslucent
          animationType="slide"
          transparent={false}
          visible={modalVisible}
          onRequestClose={() => {
            setModalVisible(false);
            setSelectedSongs([]);
          }}>
          <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bgPrimary }}>
            <View style={{ flex: 1, paddingTop: theme.yard * 2.5, backgroundColor: theme.colors.bgPrimary }}>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: theme.yard * 1.5,
                borderBottomWidth: theme.yard * 0.1,
                borderBottomColor: theme.colors.tSecondary,
              }}>
                <TouchableOpacity
                  style={{ paddingHorizontal: theme.yard - 5 }}
                  onPress={() => {
                    setModalVisible(false);
                    setSelectedSongs([]);
                  }}>
                  <Icon name="close" size={theme.fontSizes.xxl} color={theme.colors.tPrimary} />
                </TouchableOpacity>
                <Text style={{
                  fontSize: theme.fontSizes.l,
                  fontWeight: '600',
                  flex: 1,
                  textAlign: 'center',
                  color: theme.colors.tPrimary,
                }}>
                  Add to {playlist.name}
                </Text>
                <TouchableOpacity
                  style={{
                    paddingHorizontal: theme.yard,
                    opacity: selectedSongs.length > 0 ? 1 : 0.5,
                  }}
                  disabled={selectedSongs.length === 0}
                  onPress={addSelectedSongsToPlaylist}>
                  <Text style={{
                    fontWeight: '600',
                    color: theme.colors.accent,
                  }}>
                    Add ({selectedSongs.length})
                  </Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={allSongs.sort((a, b) => a.title.localeCompare(b.title))}
                keyExtractor={item => item.id}
                renderItem={renderModalSongItem}
                contentContainerStyle={{ padding: 16 }}
                ListEmptyComponent={
                  <Text style={{
                    textAlign: 'center',
                    marginTop: theme.yard,
                    color: theme.colors.tSecondary,
                  }}>
                    No songs available to add
                  </Text>
                }
              />
            </View>
          </SafeAreaView>
        </Modal>
      </View>
      <MiniPlayer />
    </SafeAreaView>
  );
};

export default Playlist;