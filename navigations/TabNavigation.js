import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import DashboardScreen from '../screens/AppScreens/DashboardScreen';
import LiveReportScreen from '../screens/AppScreens/LiveReportScreen';
import ReportScreen from '../screens/AppScreens/ReportScreen';
import SettingsScreen from '../screens/AppScreens/SettingScreen';
import DownloadScreen from '../screens/AppScreens/DownloadScreen';
import ProductionScreen from '../screens/AppScreens/ProductionScreen';

const Tab = createBottomTabNavigator();
const ProductionMonitorStack = createStackNavigator();

function ProductionMonitorStackScreen() {
  return (
    <ProductionMonitorStack.Navigator>
      <ProductionMonitorStack.Screen 
        name="Dashboard" 
        component={DashboardScreen} 
        options={{ headerShown: false }} 
      />
      <ProductionMonitorStack.Screen 
        name="WORK CENTER" 
        component={LiveReportScreen} 
        options={{ headerShown: false }} 
      />
    </ProductionMonitorStack.Navigator>
  );
}

export function TabGroup() {
  return (
    <Tab.Navigator
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
      <Tab.Screen name="PRODUCTION MONITOR" component={ProductionMonitorStackScreen} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="PRODUCTION" component={ProductionScreen} options={{ tabBarLabel: 'Production' }} />
      <Tab.Screen name="REPORT" component={ReportScreen} options={{ tabBarLabel: 'Reports' }} />
      <Tab.Screen name="DOWNLOAD" component={DownloadScreen} options={{ tabBarLabel: 'Download' }} />
      <Tab.Screen name="SETTINGS" component={SettingsScreen} options={{ tabBarLabel: 'Settings' }} />
    </Tab.Navigator>
  );
}