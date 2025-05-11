import TrackPlayer, { Event } from 'react-native-track-player';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SHUFFLE_MODE_STORAGE_KEY = '@music_app_shuffle_mode';

function getRandomTrackIndex(currentIndex, queueLength) {
  let newIndex;
  do {
    newIndex = Math.floor(Math.random() * queueLength);
  } while (newIndex === currentIndex && queueLength > 1);
  return newIndex;
}

module.exports = async function () {
  // Remote Play & Pause
  TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
  TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());

  // Remote Next
  TrackPlayer.addEventListener(Event.RemoteNext, async () => {
    try {
      const queue = await TrackPlayer.getQueue();
      const currentIndex = await TrackPlayer.getCurrentTrack();
      const savedShuffleMode = await AsyncStorage.getItem(SHUFFLE_MODE_STORAGE_KEY);
      const shuffleMode = savedShuffleMode === 'true';

      if (shuffleMode) {
        const newIndex = getRandomTrackIndex(currentIndex, queue.length);
        await TrackPlayer.skip(newIndex);
      } else {
        if (currentIndex < queue.length - 1) {
          await TrackPlayer.skipToNext();
        } else {
          await TrackPlayer.skip(0); // Loop to beginning
        }
      }
    } catch (error) {
      console.error('Error handling remote next:', error);
    }
  });

  // Remote Previous
  TrackPlayer.addEventListener(Event.RemotePrevious, async () => {
    try {
      const queue = await TrackPlayer.getQueue();
      const currentIndex = await TrackPlayer.getCurrentTrack();
      const position = await TrackPlayer.getPosition();
      const savedShuffleMode = await AsyncStorage.getItem(SHUFFLE_MODE_STORAGE_KEY);
      const shuffleMode = savedShuffleMode === 'true';

      if (shuffleMode) {
        const newIndex = getRandomTrackIndex(currentIndex, queue.length);
        await TrackPlayer.skip(newIndex);
      } else {
        if (position > 3) {
          await TrackPlayer.seekTo(0);
        } else if (currentIndex > 0) {
          await TrackPlayer.skipToPrevious();
        } else {
          await TrackPlayer.skip(queue.length - 1); // Loop to end
        }
      }
    } catch (error) {
      console.error('Error handling remote previous:', error);
    }
  });

  // Remote Seek
  TrackPlayer.addEventListener(Event.RemoteSeek, async (event) => {
    try {
      if (typeof event.position === 'number') {
        await TrackPlayer.seekTo(event.position);
      }
    } catch (error) {
      console.error('Error handling remote seek:', error);
    }
  });

  // Remote Stop
  TrackPlayer.addEventListener(Event.RemoteStop, async () => {
    try {
      await TrackPlayer.reset();
    } catch (error) {
      console.error('Error handling remote stop:', error);
    }
  });

  // Jump Forward
  TrackPlayer.addEventListener(Event.RemoteJumpForward, async (event) => {
    try {
      const position = await TrackPlayer.getPosition();
      const jumpAmount = event.interval || 10;
      await TrackPlayer.seekTo(position + jumpAmount);
    } catch (error) {
      console.error('Error handling jump forward:', error);
    }
  });

  // Jump Backward
  TrackPlayer.addEventListener(Event.RemoteJumpBackward, async (event) => {
    try {
      const position = await TrackPlayer.getPosition();
      const jumpAmount = event.interval || 10;
      const newPosition = Math.max(0, position - jumpAmount);
      await TrackPlayer.seekTo(newPosition);
    } catch (error) {
      console.error('Error handling jump backward:', error);
    }
  });
};
