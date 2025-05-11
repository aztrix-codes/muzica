import { View } from 'react-native'
import React from 'react'
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useTheme } from './ThemeContext'; 
import MiniPlayer from './MiniPlayer';
import Lists from './Lists';
import Songs from './Songs';

const Tab = createMaterialTopTabNavigator();

const Home = () => {
  const { theme } = useTheme(); 
  
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bgPrimary}}>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: theme.colors.accent, 
          tabBarInactiveTintColor: theme.colors.tSecondary, 
          tabBarStyle: {
            backgroundColor: theme.colors.bgPrimary,
          },
          tabBarLabelStyle: {
            fontSize: theme.fontSizes.m,
            color: theme.colors.tPrimary,
            letterSpacing: theme.yard * 0.1
          },
          tabBarIndicatorStyle: {
            backgroundColor: theme.colors.tPrimary,
            height: theme.yard * 0.25,
            borderRadius: theme.yard * 2,
          },
        }}>
        <Tab.Screen name="Lists" component={Lists} />
        <Tab.Screen name="Songs" component={Songs} />
      </Tab.Navigator>
      <MiniPlayer />
    </View>
  )
}

export default Home

