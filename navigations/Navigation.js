import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/AuthScreens/LoginScreen';
import LoadingScreen from '../screens/AuthScreens/LoadingScreen';
import SignUpScreen from '../screens/AuthScreens/SignupScreen';
import OTPScreen from '../screens/AuthScreens/OTPScreen';
import RegistrationScreen from '../screens/AuthScreens/RegistrationScreen';
import { TabGroup } from './TabNavigation';

const Stack = createNativeStackNavigator();

export default function Navigation() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="SignUp">
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="OTP" component={OTPScreen} />
        <Stack.Screen name="Registration" component={RegistrationScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Loading" component={LoadingScreen} options={{ headerShown: false }} />
        <Stack.Screen name="TabScreen" component={TabGroup} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
