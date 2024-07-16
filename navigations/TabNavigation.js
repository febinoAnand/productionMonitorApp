import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/Ionicons';
import DashboardScreen from '../screens/AppScreens/DashboardScreen';
import LiveReportScreen from '../screens/AppScreens/LiveReportScreen';
import ReportScreen from '../screens/AppScreens/ReportScreen';
import SettingsScreen from '../screens/AppScreens/SettingScreen';
import DownloadScreen from '../screens/AppScreens/DownloadScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const MainStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ headerShown: false }} />
    <Stack.Screen name="WORK CENTER" component={LiveReportScreen} />
    <Stack.Screen name="ReportScreen" component={ReportScreen} />
    <Stack.Screen name="SettingsScreen" component={SettingsScreen} />
    <Stack.Screen name="DownloadScreen" component={DownloadScreen} />
  </Stack.Navigator>
);

export function TabGroup() {
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
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="PRODUCTION MONITOR" component={MainStack} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="REPORT" component={ReportScreen} options={{ tabBarLabel: 'Reports' }} />
      <Tab.Screen name='DOWNLOAD' component={DownloadScreen} options={{ tabBarLabel: 'Download' }} />
      <Tab.Screen name='SETTINGS' component={SettingsScreen} options={{ tabBarLabel: 'Settings' }} />
    </Tab.Navigator>
  );
}
