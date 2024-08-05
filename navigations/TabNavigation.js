import React, { useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/Ionicons';
import DashboardScreen from '../screens/AppScreens/DashboardScreen';
import LiveReportScreen from '../screens/AppScreens/LiveReportScreen';
import ReportScreen from '../screens/AppScreens/ReportScreen';
import SettingsScreen from '../screens/AppScreens/SettingScreen';
import DownloadScreen from '../screens/AppScreens/DownloadScreen';
import ProductionScreen from '../screens/AppScreens/ProductionScreen';
import * as ScreenOrientation from 'expo-screen-orientation';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const MainStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ headerShown: false }} />
    <Stack.Screen name="WORK CENTER" component={LiveReportScreen} options={{ headerShown: false }}/>
    <Stack.Screen name="ProductionScreen" component={ProductionScreen} />
    <Stack.Screen name="ReportScreen" component={ReportScreen} />
    <Stack.Screen name="SettingsScreen" component={SettingsScreen} />
    <Stack.Screen name="DownloadScreen" component={DownloadScreen} />
  </Stack.Navigator>
);

export function TabGroup() {
  const [orientation, setOrientation] = useState(ScreenOrientation.Orientation.UNKNOWN);

  useEffect(() => {
    const orientationChangeListener = ({ orientationInfo }) => {
      setOrientation(orientationInfo.orientation);
    };

    const subscription = ScreenOrientation.addOrientationChangeListener(orientationChangeListener);
    return () => {
      ScreenOrientation.removeOrientationChangeListener(subscription);
    };
  }, []);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'PRODUCTION MONITOR') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'REPORT') {
            iconName = focused ? 'documents' : 'documents-outline';
          } else if (route.name === 'DOWNLOAD') {
            iconName = focused ? 'download' : 'download-outline';
          } else if (route.name === 'SETTINGS') {
            iconName = focused ? 'settings' : 'settings-outline';
          } else if (route.name === 'PRODUCTION') {
            iconName = focused ? 'analytics' : 'analytics-outline';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarStyle: {
          display: orientation === ScreenOrientation.Orientation.LANDSCAPE_LEFT || orientation === ScreenOrientation.Orientation.LANDSCAPE_RIGHT ? 'none' : 'flex',
        },
      })}
    >
      <Tab.Screen name="PRODUCTION MONITOR" component={MainStack} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="PRODUCTION" component={ProductionScreen} options={{ tabBarLabel: 'Production' }} />
      <Tab.Screen name="REPORT" component={ReportScreen} options={{ tabBarLabel: 'Reports' }} />
      <Tab.Screen name="DOWNLOAD" component={DownloadScreen} options={{ tabBarLabel: 'Download' }} />
      <Tab.Screen name="SETTINGS" component={SettingsScreen} options={{ tabBarLabel: 'Settings' }} />
    </Tab.Navigator>
  );
}