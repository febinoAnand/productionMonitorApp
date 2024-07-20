import React, { useState } from 'react';
import { View, StyleSheet, Keyboard, TouchableWithoutFeedback, Image } from 'react-native';
import { Input, Button, Icon } from 'react-native-elements';
import LoadingScreen from './loadingscreen';

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      if (username === '' && password === '') {
        navigation.navigate('TabScreen');
      } else {
        alert('Invalid username or password');
      }
      setIsLoading(false);
    }, 2000);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      {isLoading ? (
          <LoadingScreen />
        ) : (
      <View style={styles.container}>
        <Image
          source={require('../../assets/hlmando.png')}
          style={styles.image}
          resizeMode="contain"
        />
        <Input
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          leftIcon={<Icon name="user" type="font-awesome" size={24} color="dodgerblue" />}
          inputStyle={styles.inputStyle}
        />
        <Input
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          leftIcon={<Icon name="lock" type="font-awesome" size={24} color="dodgerblue" />}
          inputStyle={styles.inputStyle}
        />
        <Button
          title="Login"
          onPress={handleLogin}
          buttonStyle={styles.ovalButton}
          disabled={isLoading}
        />
      </View>
        )}
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    bottom:50
  },
  image: {
    bottom:40,
    width: 250,
    height: 100,
    marginBottom: 20,
  },
  inputStyle: {
    paddingLeft: 20,
  },
  ovalButton: {
    borderRadius: 50,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
});
export default LoginScreen;