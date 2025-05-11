import { View, Text, FlatList, TouchableOpacity, Alert, TextInput } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useTheme } from './ThemeContext';
import { usePlayer } from './PlayerContext';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Feather from 'react-native-vector-icons/Feather';

const Lists = () => {
  const { theme } = useTheme();
  const { 
    playlists, 
    createPlaylist, 
    deletePlaylist, 
    renamePlaylist, 
    isDefaultPlaylist,
  } = usePlayer();
  const navigation = useNavigation();
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [editingPlaylistId, setEditingPlaylistId] = useState(null);
  const [editName, setEditName] = useState('');

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) {
      Alert.alert('Error', 'Please enter a playlist name');
      return;
    }
    await createPlaylist(newPlaylistName);
    setNewPlaylistName('');
  };

  const handleRename = async (playlistId) => {
    if (!editName.trim()) {
      Alert.alert('Error', 'Please enter a playlist name');
      return;
    }
    await renamePlaylist(playlistId, editName);
    setEditingPlaylistId(null);
    setEditName('');
  };

  const handleDelete = (playlistId) => {
    Alert.alert(
      'Delete Playlist',
      'Are you sure you want to delete this playlist?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', onPress: () => deletePlaylist(playlistId) }
      ]
    );
  };

  const navigateToPlaylist = (playlist) => {
    navigation.navigate('Playlist', { playlist });
  };

  const renderPlaylistItem = ({ item }) => (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: theme.yard,
    }}>
      {editingPlaylistId === item.id ? (
        <View style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.yard * 2,
        }}>
          <TextInput cursorColor={theme.colors.accent}
            style={{
              flex: 1,
              fontSize: theme.fontSizes.m,
              color: theme.colors.tPrimary, letterSpacing: theme.yard * 0.1
            }}
            value={editName}
            onChangeText={setEditName}
            autoFocus
            placeholder="New playlist name"
            placeholderTextColor={theme.colors.tSecondary}
          />
          <TouchableOpacity onPress={() => handleRename(item.id)}>
            <Feather name="check" size={theme.fontSizes.xl} color={theme.colors.accent} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setEditingPlaylistId(null)}>
            <Feather name="x" size={theme.fontSizes.xl} color={theme.colors.tSecondary} />
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <TouchableOpacity 
            style={{ flex: 1 }} 
            onPress={() => navigateToPlaylist(item)}
          >
            <Text style={{
              fontSize: theme.fontSizes.m,
              color: theme.colors.tPrimary, letterSpacing: theme.yard * 0.1
            }}>
              {item.name}
            </Text>
            <Text style={{
              fontSize: theme.fontSizes.m,
              color: theme.colors.tSecondary,
            }}>
              {item.data.length} {item.data.length === 1 ? 'song' : 'songs'}
            </Text>
          </TouchableOpacity>
          <View style={{
            flexDirection: 'row',
            gap: theme.fontSizes.xl,
          }}>
            {!isDefaultPlaylist(item.id) && (
              <>
                <TouchableOpacity onPress={() => {
                  setEditingPlaylistId(item.id);
                  setEditName(item.name);
                }}>
                  <Feather name="edit-2" size={theme.fontSizes.l} color={theme.colors.tSecondary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item.id)}>
                  <Feather name="trash-2" size={theme.fontSizes.l} color={theme.colors.tSecondary} />
                </TouchableOpacity>
              </>
            )}
          </View>
        </>
      )}
    </View>
  );

  return (
    <View style={{
      flex: 1,
      padding: theme.yard * 1.5,
      backgroundColor: theme.colors.bgPrimary,
    }}>
      <View style={{
        flexDirection: 'row',
        marginBottom: theme.yard,
      }}>
        <TextInput cursorColor={theme.colors.accent}
          style={{
            flex: 1,
            height: theme.yard * 3.5,
            borderWidth: theme.yard * 0.1,
            borderRadius: theme.yard * 4,
            paddingHorizontal: theme.yard * 1.5,
            marginRight: theme.yard,
            color: theme.colors.tPrimary,
            backgroundColor: theme.colors.bgPrimary,
            borderColor: theme.colors.accent,
          }}
          placeholder="New playlist name"
          placeholderTextColor={theme.colors.tSecondary}
          value={newPlaylistName}
          onChangeText={setNewPlaylistName}
        />
        <TouchableOpacity 
          style={{
            width: theme.yard * 3.5,
            height: theme.yard * 3.5,
            borderRadius: theme.yard * 4,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: theme.colors.accent, marginRight: theme.yard / 2
          }}
          onPress={handleCreatePlaylist}
        >
          <Icon name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={playlists.filter(playlist => playlist.id > 0)}
        keyExtractor={item => item.id}
        renderItem={renderPlaylistItem}
        contentContainerStyle={{
          paddingBottom: theme.yard,
        }}
        ListEmptyComponent={
          <Text style={{
            textAlign: 'center',
            marginTop: theme.yard,
            color: theme.colors.tSecondary,
          }}>
            No playlists yet
          </Text>
        }
      />
    </View>
  );
};

export default Lists;