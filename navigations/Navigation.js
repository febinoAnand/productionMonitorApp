import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/AuthScreens/LoginScreen';
import TabNavigation, { TabGroup } from './TabNavigation';
import SignUpScreen from '../screens/AuthScreens/SignupScreen';
import OTPScreen from '../screens/AuthScreens/OTPScreen';
import RegistrationScreen from '../screens/AuthScreens/RegistrationScreen';
import TestDashboard from '../screens/AuthScreens/testdashboard';

// import { TabGroup } from './TabNavigation';
import Splash from '../screens/AuthScreens/splash';

const Stack = createNativeStackNavigator();

export default function Navigation() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name='Splash' component={Splash} options={{headerShown: false}}/>
        <Stack.Screen name="SignUp" component={SignUpScreen} options={{ headerShown: false }} />
        <Stack.Screen name="OTP" component={OTPScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Registration" component={RegistrationScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="TestDashboard" component={TestDashboard} options={{ headerShown: false }} />
        <Stack.Screen name="TabScreen" component={TabGroup} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
