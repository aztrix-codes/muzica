import React, { useState, useEffect, useRef } from 'react';
import { 
  Text, 
  View, 
  TouchableOpacity, 
  Modal,
  ScrollView,
  Animated,
  AppState
} from 'react-native';
import BackgroundTimer from 'react-native-background-timer';
import { useTheme } from './ThemeContext';
import { usePlayer } from './PlayerContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const hexToRgb = (hex) => {
  hex = hex.replace(/^#/, '');

  const bigint = parseInt(hex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;

  return [r, g, b];
};

const SleepMode = () => {
  const { theme } = useTheme();
  const { pause } = usePlayer();
  
  const [endTime, setEndTime] = useState(null);
  const [remainingTime, setRemainingTime] = useState(1800); 
  const [timerActive, setTimerActive] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerType, setPickerType] = useState('minutes');
  const [timerCompleted, setTimerCompleted] = useState(false);
  
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const glowAnimation = useRef(new Animated.Value(0)).current;
  
  const timerRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);

  const hours = Math.floor(remainingTime / 3600);
  const minutes = Math.floor((remainingTime % 3600) / 60);
  const seconds = remainingTime % 60;

  useEffect(() => {
    const loadTimer = async () => {
      try {
        const savedTimer = await AsyncStorage.getItem('sleepTimer');
        if (savedTimer) {
          const { endTime: savedEndTime, isActive, remainingTime: savedRemaining, timerCompleted: savedCompleted } = JSON.parse(savedTimer);
          
          if (isActive && savedEndTime && savedEndTime > Date.now()) {
            const newRemaining = Math.floor((savedEndTime - Date.now()) / 1000);
            if (newRemaining > 0) {
              setRemainingTime(newRemaining);
              setTimerActive(true);
              setEndTime(savedEndTime);
              
              requestAnimationFrame(() => {
                startAnimations();
                setTimeout(() => {
                  startBackgroundTimer(savedEndTime);
                }, 50);
              });
            } else {
              handleTimerEnd();
            }
          } else if (savedRemaining && !isActive) {
            setRemainingTime(savedRemaining);
          }
          
          if (savedCompleted) {
            setTimerCompleted(true);
          }
        }
      } catch (error) {
        console.error('Failed to load timer:', error);
      }
    };

    loadTimer();

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
      stopBackgroundTimer();
    };
  }, []);

  const handleAppStateChange = (nextAppState) => {
    if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
      if (timerActive && endTime) {
        const currentTime = Date.now();
        if (endTime > currentTime) {
          const newRemaining = Math.floor((endTime - currentTime) / 1000);
          setRemainingTime(newRemaining);
          
          stopBackgroundTimer();
          updateRemainingTime(endTime);
          timerRef.current = BackgroundTimer.setInterval(() => {
            updateRemainingTime(endTime);
          }, 1000);
        } else {
          handleTimerEnd();
        }
      }
    } else if (nextAppState.match(/inactive|background/) && appStateRef.current === 'active') {
      if (timerActive && endTime) {
        saveTimerState(endTime, true);
      }
    }
    appStateRef.current = nextAppState;
  };

  const startBackgroundTimer = (targetEndTime) => {
    stopBackgroundTimer();
    
    let newEndTime;
    
    if (targetEndTime) {
      newEndTime = targetEndTime;
    } else {
      newEndTime = Date.now() + (remainingTime * 1000);
    }
    
    const initialRemaining = Math.floor((newEndTime - Date.now()) / 1000);
    
    if (initialRemaining <= 0) {
      handleTimerEnd();
      return;
    }
    
    setTimerActive(true);
    setTimerCompleted(false);
    setEndTime(newEndTime);
    setRemainingTime(initialRemaining);
    
    startAnimations();
    
    updateRemainingTime(newEndTime);
    
    setTimeout(() => {
      timerRef.current = BackgroundTimer.setInterval(() => {
        updateRemainingTime(newEndTime);
      }, 1000);
    }, 100);
    
    saveTimerState(newEndTime, true, initialRemaining, false);
  };

  const startAnimations = () => {
    pulseAnimation.setValue(1);
    glowAnimation.setValue(0);
    
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
    
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnimation, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnimation, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const updateRemainingTime = (currentEndTime) => {
    const timeToUse = currentEndTime || endTime;
    if (!timeToUse) return;
    
    const now = Date.now();
    const newRemaining = Math.floor((timeToUse - now) / 1000);
    
    if (newRemaining <= 0) {
      handleTimerEnd();
    } else {
      setRemainingTime(newRemaining);
    }
  };

  const stopBackgroundTimer = () => {
    if (timerRef.current) {
      BackgroundTimer.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    pulseAnimation.stopAnimation();
    glowAnimation.stopAnimation();
  };

  const handleTimerEnd = () => {
    stopBackgroundTimer();
    setTimerActive(false);
    setEndTime(null);
    setRemainingTime(0);
    setTimerCompleted(true);
    pause();
    saveTimerState(null, false, 0, true);
  };

  const saveTimerState = async (endTimestamp, isActive, timeRemaining = remainingTime, completed = timerCompleted) => {
    try {
      await AsyncStorage.setItem('sleepTimer', JSON.stringify({
        endTime: endTimestamp,
        isActive,
        remainingTime: timeRemaining,
        timerCompleted: completed
      }));
    } catch (error) {
      console.error('Failed to save timer:', error);
    }
  };

  const startTimer = () => {
    if (remainingTime > 0) {
      requestAnimationFrame(() => {
        startBackgroundTimer(); 
      });
    }
  };

  const pauseTimer = () => {
    stopBackgroundTimer();
    setTimerActive(false);
    saveTimerState(null, false);
  };


  const resetTimer = () => {
    stopBackgroundTimer();
    setTimerActive(false);
    setEndTime(null);
    setTimerCompleted(false);
    setRemainingTime(1800); 
    saveTimerState(null, false, 1800, false);
  };

  const openPicker = (type) => {
    setPickerType(type);
    setShowPicker(true);
  };

  const setTime = (value, type) => {
    let newRemaining = 0;
    
    if (type === 'hours') {
      newRemaining = (value * 3600) + (minutes * 60) + seconds;
    } else if (type === 'minutes') {
      newRemaining = (hours * 3600) + (value * 60) + seconds;
    } else if (type === 'seconds') {
      newRemaining = (hours * 3600) + (minutes * 60) + value;
    }
    
    setRemainingTime(newRemaining);
    setTimerCompleted(false);
    
    if (timerActive) {
      const targetEndTime = Date.now() + (newRemaining * 1000);
      setEndTime(targetEndTime);
      saveTimerState(targetEndTime, true, newRemaining, false);
    } else {
      saveTimerState(null, false, newRemaining, false);
    }
  };

  const setPresetTime = (seconds) => {
    setRemainingTime(seconds);
    setTimerCompleted(false);
    saveTimerState(null, false, seconds, false);
  };

  const TimeDisplay = () => {

    return (
      <Animated.View 
        style={{
          borderRadius: theme.yard * 2,
          padding: theme.yard,
          marginBottom: theme.yard * 2,
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          overflow: 'hidden',
          position: 'relative',
          backgroundColor: theme.colors.bgSecondary,
          transform: [{ scale: pulseAnimation }],
          shadowColor: theme.colors.accent,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: timerActive ? 0.8 : 0,
          shadowRadius: timerActive ? 20 : 0,
        }}
      >
        <Animated.View 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: theme.yard *  2,
          }}
        />
        
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
          <TouchableOpacity 
            style={{ alignItems: 'center', justifyContent: 'center', paddingHorizontal: theme.yard }}
            onPress={() => !timerActive && openPicker('hours')}
            disabled={timerActive}
          >
            <Text style={{ fontSize: theme.fontSizes.xxxl + 10, fontWeight: 'bold', color: theme.colors.tPrimary }}>
              {hours.toString().padStart(2, '0')}
            </Text>
            <Text style={{ fontSize: theme.fontSizes.s  + 3, letterSpacing: theme.yard * 0.1, fontWeight: '500', color: theme.colors.tSecondary }}>
              HOURS
            </Text>
          </TouchableOpacity>
          
          <Text style={{ fontSize: theme.fontSizes.xxxl + 10, fontWeight: 'bold', marginHorizontal: theme.yard * 0.1, color: theme.colors.tPrimary }}>:</Text>
          
          <TouchableOpacity 
            style={{ alignItems: 'center', justifyContent: 'center', paddingHorizontal: theme.yard }}
            onPress={() => !timerActive && openPicker('minutes')}
            disabled={timerActive}
          >
            <Text style={{ fontSize: theme.fontSizes.xxxl + 10, fontWeight: 'bold', color: theme.colors.tPrimary }}>
              {minutes.toString().padStart(2, '0')}
            </Text>
            <Text style={{ fontSize: theme.fontSizes.s  + 3, letterSpacing: theme.yard * 0.1, fontWeight: '500', color: theme.colors.tSecondary }}>
              MINUTES
            </Text>
          </TouchableOpacity>
          
          <Text style={{ fontSize: theme.fontSizes.xxxl + 10, fontWeight: 'bold', marginHorizontal: theme.yard * 0.1, color: theme.colors.tPrimary }}>:</Text>
          
          <TouchableOpacity 
            style={{ alignItems: 'center', justifyContent: 'center', paddingHorizontal: theme.yard }}
            onPress={() => !timerActive && openPicker('seconds')}
            disabled={timerActive}
          >
            <Text style={{ fontSize: theme.fontSizes.xxxl + 10, fontWeight: 'bold', color: theme.colors.tPrimary }}>
              {seconds.toString().padStart(2, '0')}
            </Text>
            <Text style={{ fontSize: theme.fontSizes.s  + 3, letterSpacing: theme.yard * 0.1, fontWeight: '500', color: theme.colors.tSecondary }}>
              SECONDS
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  const TimePicker = () => {
    const values = 
      pickerType === 'hours' ? Array.from({ length: 24 }, (_, i) => i) :
      Array.from({ length: 60 }, (_, i) => i);
    
    const currentValue = 
      pickerType === 'hours' ? hours :
      pickerType === 'minutes' ? minutes : seconds;
    
    return (
      <Modal
        visible={showPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPicker(false)}
      >
        <TouchableOpacity 
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' }} 
          activeOpacity={1}
          onPress={() => setShowPicker(false)}
        >
          <View style={{ width: '80%', maxHeight: '70%', borderRadius: theme.yard * 2, overflow: 'hidden', backgroundColor: theme.colors.bgSecondary }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: theme.yard, borderBottomWidth: theme.yard * 0.1, borderBottomColor: 'rgba(0, 0, 0, 0.1)' }}>
              <Text style={{ fontSize: theme.fontSizes.l, fontWeight: '600', color: theme.colors.tPrimary }}>
                Select {pickerType}
              </Text>
              <TouchableOpacity 
                onPress={() => setShowPicker(false)}
              >
                <Icon name="close" size={theme.fontSizes.xxl} color={theme.colors.tPrimary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              style={{ maxHeight: theme.yard * 45 }}
              contentContainerStyle={{ paddingVertical: theme.yard }}
              showsVerticalScrollIndicator={false}
            >
              {values.map((value) => (
                <TouchableOpacity
                  key={value}
                  style={{
                    padding: theme.yard,
                    borderRadius: theme.yard,
                    marginHorizontal: theme.yard,
                    backgroundColor: value === currentValue ? theme.colors.accent + '40' : 'transparent'
                  }}
                  onPress={() => {
                    setTime(value, pickerType);
                    setShowPicker(false);
                  }}
                >
                  <Text style={{
                    fontSize: theme.fontSizes.l,
                    textAlign: 'center',
                    color: value === currentValue ? theme.colors.accent : theme.colors.tPrimary,
                    fontWeight: value === currentValue ? 'bold' : 'normal'
                  }}>
                    {value.toString().padStart(2, '0')}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  const Presets = () => {
    const presets = [
      { label: '5 min', value: 300 },
      { label: '15 min', value: 900 },
      { label: '30 min', value: 1800 },
      { label: '45 min', value: 2700 },
      { label: '60 min', value: 3600 },
      { label: '90 min', value: 5400 },
      { label: '2 hour', value: 7200 },
      { label: '4 hour', value: 14400 },
    ];

    return (
      <View style={{ width: '100%', marginBottom: theme.yard }}>
        <Text style={{ fontSize: theme.fontSizes.l, marginBottom: theme.yard, color: theme.colors.tSecondary }}>
          Quick presets
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          {presets.map((preset) => (
            <TouchableOpacity
              key={preset.value}
              style={{
                width: '48%',
                padding: theme.yard,
                borderRadius: theme.yard,
                marginBottom: theme.yard,
                borderWidth: theme.yard * 0.05,
                alignItems: 'center',
                backgroundColor: remainingTime === preset.value && !timerActive 
                  ? theme.colors.accent 
                  : theme.colors.bgSecondary,
                borderColor: theme.colors.accent
              }}
              onPress={() => !timerActive && setPresetTime(preset.value)}
              disabled={timerActive}
            >
              <Text style={{
                fontSize: theme.fontSizes.m + 2,
                fontWeight: '500',
                color: remainingTime === preset.value && !timerActive
                  ? theme.colors.bgPrimary
                  : theme.colors.tPrimary
              }}>
                {preset.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const Controls = () => {
    return (
      <View style={{ width: '100%', marginBottom: theme.yard * 3 }}>
        {!timerActive ? (
          timerCompleted ? (
            <TouchableOpacity
              style={{
                width: '100%',
                paddingVertical: theme.yard,
                borderRadius: theme.yard,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: theme.colors.accent
              }}
              onPress={resetTimer}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="refresh" size={theme.fontSizes.xl} color={theme.colors.bgPrimary} />
                <Text style={{ fontSize: theme.fontSizes.l, fontWeight: '600', marginLeft: theme.yard / 2, color: theme.colors.bgPrimary }}>
                  Reset Timer
                </Text>
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={{
                width: '100%',
                paddingVertical: theme.yard,
                borderRadius: theme.yard,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: theme.colors.accent,
                opacity: remainingTime === 0 ? 0.5 : 1
              }}
              onPress={startTimer}
              disabled={remainingTime === 0}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="play" size={theme.fontSizes.xl} color={theme.colors.bgPrimary} />
                <Text style={{ fontSize: theme.fontSizes.l, fontWeight: '600', marginLeft: theme.yard / 2, color: theme.colors.bgPrimary }}>
                  Start Timer
                </Text>
              </View>
            </TouchableOpacity>
          )
        ) : (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <TouchableOpacity
              style={{
                width: '48%',
                paddingVertical: theme.yard,
                borderRadius: theme.yard,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: theme.yard * 0.1,
                borderColor: theme.colors.accent
              }}
              onPress={pauseTimer}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="pause" size={theme.fontSizes.xl} color={theme.colors.tPrimary} />
                <Text style={{ fontSize: theme.fontSizes.l, fontWeight: '600', marginLeft: theme.yard / 2, color: theme.colors.tPrimary }}>
                  Pause
                </Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={{
                width: '48%',
                paddingVertical: theme.yard,
                borderRadius: theme.yard,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: theme.colors.accent
              }}
              onPress={resetTimer}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="refresh" size={theme.fontSizes.xl} color={theme.colors.tPrimary} />
                <Text style={{ fontSize: theme.fontSizes.l, fontWeight: '600', marginLeft: theme.yard / 2, color: theme.colors.tPrimary }}>
                  Reset
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: theme.yard + 5, backgroundColor: theme.colors.bgPrimary, flexDirection: 'column' }}>
      <View style={{flex: 1,  alignItems: 'center', marginTop: theme.yard * 15}}>
        <TimeDisplay />
        {timerCompleted && !timerActive && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.yard }}>
              <Icon name="check-circle" size={theme.fontSizes.xl} color={theme.colors.accent} />
              <Text style={{ marginLeft: theme.yard / 2, fontSize: theme.fontSizes.l, fontWeight: '600', color: theme.colors.accent }}>
                Timer completed
              </Text>
            </View>
          )}
      </View>
      {showPicker && <TimePicker />}
      <Presets />
      <Controls />
    </View>
  );
};


export default SleepMode;