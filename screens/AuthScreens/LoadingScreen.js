import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';

const LoadingScreen = ({ navigation, route }) => {
  const { nextScreen, params } = route.params;

  useEffect(() => {
    setTimeout(() => {
      navigation.replace(nextScreen, params);
    }, 2000);
  }, []);

  return (
    <View style={styles.container}>
      <LottieView
        source={require('../../assets/Animation.json')}
        autoPlay
        loop
        style={styles.animation}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  animation: {
    width: 200,
    height: 200,
  },
});

export default LoadingScreen;