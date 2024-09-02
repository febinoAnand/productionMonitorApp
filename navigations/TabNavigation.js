import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/Ionicons';
import DashboardScreen from '../screens/AppScreens/DashboardScreen';
import LiveReportScreen from '../screens/AppScreens/LiveReportScreen';
import ReportScreen from '../screens/AppScreens/ReportScreen';
import SettingsScreen from '../screens/AppScreens/SettingScreen';
import DownloadScreen from '../screens/AppScreens/DownloadScreen';
import ProductionScreen from '../screens/AppScreens/ProductionScreen';
// import DashboardScreen from '../screens/AuthScreens/testdashboard';

const BottomTab = createBottomTabNavigator();
// const Stack = createStackNavigator();

// const MainStack = () => (
//   <Stack.Navigator>
//     {/* <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ headerShown: false }} /> */}
//     {/* <Stack.Screen name="WORK CENTER" component={LiveReportScreen} options={{ headerShown: false }}/>
//     <Stack.Screen name="ProductionScreen" component={ProductionScreen} />
//     <Stack.Screen name="ReportScreen" component={ReportScreen} />
//     <Stack.Screen name="SettingsScreen" component={SettingsScreen} />
//     <Stack.Screen name="DownloadScreen" component={DownloadScreen} /> */}
//     <Stack.Screen name="TestDashboard" component={DashboardScreen}/>
//   </Stack.Navigator>
// );

export function TabGroup() {

  return (
    <BottomTab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'PRODUCTION MONITOR') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'WORK CENTER') {
            iconName = focused ? 'bar-chart' : 'bar-chart-outline';
          } else if (route.name === 'PRODUCTION') {
            iconName = focused ? 'analytics' : 'analytics-outline';
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
      <BottomTab.Screen name="PRODUCTION MONITOR" component={DashboardScreen} options={{ tabBarLabel: 'Home' }} />
      {/* <BottomTab.Screen name="WORK CENTER" component={LiveReportScreen} options={{ tabBarLabel: 'Work Center' }}/> */}
      <BottomTab.Screen name="PRODUCTION" component={ProductionScreen} options={{ tabBarLabel: 'Production' }} />
      <BottomTab.Screen name="REPORT" component={ReportScreen} options={{ tabBarLabel: 'Reports' }} />
      <BottomTab.Screen name="DOWNLOAD" component={DownloadScreen} options={{ tabBarLabel: 'Download' }} />
      <BottomTab.Screen name="SETTINGS" component={SettingsScreen} />
    </BottomTab.Navigator>
  );
}

export default function TabNavigation() {
  return (
    <NavigationContainer>
      <TabGroup />
    </NavigationContainer>
  );
}