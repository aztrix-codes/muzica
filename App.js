import {
  Modal,
  Pressable,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  FlatList,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import React, {useState, useEffect, useMemo} from 'react';
import {NavigationContainer, useNavigation} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import Home from './src/Home';
import Player from './src/Player';
import Theme from './src/Theme';
import SleepMode from './src/SleepMode';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import Feather from 'react-native-vector-icons/Feather';
import Entypo from 'react-native-vector-icons/Entypo';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {ThemeProvider, useTheme} from './src/ThemeContext';
import Orientation from 'react-native-orientation-locker';
import Playlist from './src/Playlist';
import {PlayerProvider, usePlayer} from './src/PlayerContext';
import TrackPlayer, { RepeatMode, Event } from 'react-native-track-player';
import { BlurView } from '@react-native-community/blur';

Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.allowFontScaling = false;

TextInput.defaultProps = TextInput.defaultProps || {};
TextInput.defaultProps.allowFontScaling = false;

Orientation.lockToPortrait();

const Stack = createNativeStackNavigator();

const HeaderRight = () => {
  const [searchModal, setSearchModal] = useState(false);
  const [miniMenuModal, setMiniMenuModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const {theme} = useTheme();
  const navigation = useNavigation();
  const [songs, setSongs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const {
    playlists, 
  } = usePlayer();

  useEffect(() => {
    const allPlaylist = playlists.find(playlist => playlist.id === '0');
    if (allPlaylist) {
      const playlistSongs = [...(allPlaylist.data || [])];
      playlistSongs.sort((a, b) => a.title.localeCompare(b.title));
      setSongs(playlistSongs);
    }
  }, [playlists]);

  const filteredSongs = useMemo(() => {
    if (typeof searchQuery !== 'string' || searchQuery.trim() === '') {
      return songs.sort((a, b) => a.title.localeCompare(b.title));
    }

    const query = searchQuery.toLowerCase();
    return songs.filter(
      song =>
        song.title?.toLowerCase().includes(query) ||
        song.artist?.toLowerCase().includes(query)
    );
  }, [searchQuery, songs]);

  const handleSongSelect = async item => {
    try {
      setIsLoading(true);
      setSearchModal(false);
      
      await TrackPlayer.reset();
      
      const validatedSong = {
        ...item,
        duration: item.duration || 0,  
        url: item.url || '',  
        artist: item.artist || 'Unknown Artist',
        title: item.title || 'Unknown Title',
      };
      
      await TrackPlayer.add(validatedSong);
      await TrackPlayer.setRepeatMode(RepeatMode.Queue);
      await TrackPlayer.play();
      
      navigation.navigate('Player');
    } catch (error) {
      // console.error('Error playing song:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderSongItem = ({item}) => (
    <TouchableOpacity
      style={{
        padding: theme.yard,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.bgSecondary,
      }}
      onPress={() => handleSongSelect(item)}
      disabled={isLoading}>
      <Text style={{color: theme.colors.tPrimary, fontSize: theme.fontSizes.m}}>
        {item.title}
      </Text>
      <Text style={{color: theme.colors.tSecondary, fontSize: theme.fontSizes.s}}>
        {item.artist}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={{flexDirection: 'row', alignItems: 'center'}}>
      <Pressable 
        style={{marginHorizontal: theme.yard * 2}} 
        onPress={() => setSearchModal(true)}>
        <Feather name="search" size={theme.fontSizes.xxl} color={theme.colors.tPrimary} />
      </Pressable>
      <Pressable onPress={() => setMiniMenuModal(true)}>
        <Entypo name="dots-three-vertical" size={theme.fontSizes.xl} color={theme.colors.tPrimary} />
      </Pressable>

      <Modal
        backdropColor={theme.colors.bgPrimary}
        statusBarTranslucent
        animationType="fade"
        visible={searchModal}
        onRequestClose={() => setSearchModal(false)}>
        <View
          style={{
            flex: 1,
            marginTop: theme.yard * 4,
            marginHorizontal: theme.yard,
            backgroundColor: theme.colors.bgPrimary,
          }}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <Pressable onPress={() => setSearchModal(false)}>
              <Ionicons
                name="chevron-back"
                size={theme.fontSizes.xxl}
                color={theme.colors.tPrimary}
              />
            </Pressable>
            <TextInput
              autoFocus cursorColor={theme.colors.accent}
              placeholder="Search songs"
              placeholderTextColor={theme.colors.tSecondary}
              style={{
                width: "92%",
                borderRadius: theme.yard * 2,
                backgroundColor: theme.colors.bgSecondary,
                paddingHorizontal: theme.yard * 2,
                color: theme.colors.tPrimary,
                fontSize: theme.fontSizes.l - 1
              }}
              value={searchQuery}
              onChangeText={text => setSearchQuery(text)}
            />
          </View>

          {isLoading ? (
            <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
              <ActivityIndicator size="large" color={theme.colors.accent} />
            </View>
          ) : (
            <FlatList
              data={filteredSongs}
              renderItem={renderSongItem}
              keyExtractor={item => item.id}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{paddingVertical: theme.yard}}
              ListEmptyComponent={
                <Text
                  style={{
                    color: theme.colors.tSecondary,
                    textAlign: 'center',
                    marginTop: theme.yard,
                  }}>
                  {searchQuery ? 'No songs found' : 'Search for songs'}
                </Text>
              }
            />
          )}
        </View>
      </Modal>

      <Modal 
        statusBarTranslucent 
        animationType="fade" 
        transparent 
        visible={miniMenuModal}
        onRequestClose={() => setMiniMenuModal(false)}>
        <Pressable style={{flex: 1}} onPress={() => setMiniMenuModal(false)}>
          <View
            style={{
              backgroundColor: theme.colors.bgSecondary,
              paddingHorizontal: theme.yard,
              width: theme.yard * 12,
              borderRadius: theme.yard * 2,
              position: 'absolute',
              top: theme.yard * 6,
              right: theme.yard * 2,
              paddingVertical: theme.yard,
              borderWidth: theme.yard * 0.1,
              borderColor: theme.colors.bgSecondary,
              elevation: 5,
            }}>
            <TouchableOpacity
              style={{marginVertical: theme.yard }}
              onPress={() => {
                navigation.navigate('Sleep mode');
                setMiniMenuModal(false);
              }}>
              <Text style={{fontSize: theme.fontSizes.m + 3, color: theme.colors.tPrimary}}>
                Sleep mode
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{marginVertical: theme.yard }}
              onPress={() => {
                navigation.navigate('Theme');
                setMiniMenuModal(false);
              }}>
              <Text style={{fontSize: theme.fontSizes.m + 3, color: theme.colors.tPrimary}}>
                Theme
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const App = () => {
  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <ThemeProvider>
        <PlayerProvider>
          <NavigationContainer>
            <AppContent />
          </NavigationContainer>
        </PlayerProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
};

const AppContent = () => {
  const {theme: navTheme} = useTheme();
  const barStyle = navTheme.type === 'light' ? 'dark-content' : 'light-content';

  return (
    <>
      <StatusBar barStyle={barStyle} />
      <Stack.Navigator
        screenOptions={{
          headerTitleStyle: {
            fontSize: Math.floor(navTheme.fontSizes.xxl),
            color: navTheme.colors.tPrimary,
          },
          headerStyle: {
            backgroundColor: navTheme.colors.bgPrimary,
          },
          headerTintColor: navTheme.colors.tPrimary,
        }}>
        <Stack.Screen
          name="Home"
          component={Home}
          options={{
            headerTitle: 'Muzica',
            headerRight: () => <HeaderRight />,
          }}
        />
        <Stack.Screen
          name="Player"
          component={Player}
          options={{animation: 'fade_from_bottom', headerShown: false}}
        />
        <Stack.Screen name="Theme" component={Theme} options={{animation: 'ios_from_right'}} />
        <Stack.Screen name="Sleep mode" component={SleepMode} options={{animation: 'ios_from_right'}} />
        <Stack.Screen name="Playlist" component={Playlist} options={{animation: 'ios_from_right'}} />
      </Stack.Navigator>
    </>
  );
};

export default App;

