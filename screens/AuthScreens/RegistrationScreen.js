import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableWithoutFeedback, Keyboard, Image } from 'react-native';
import { Input, Button, Icon } from 'react-native-elements';
import LoadingScreen from './loadingscreen';

const RegistrationScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegistration = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      navigation.navigate('Login');
    }, 2000);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      {isLoading ? (
          <LoadingScreen />
        ) : (
      <View style={styles.container}>
        <View style={styles.header}>
          <Image
            source={require('../../assets/hlmando.png')}
            style={styles.image}
          />
        </View>
        <Input
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          leftIcon={<Icon name="user" type="font-awesome" size={24} color="dodgerblue" />}
          inputStyle={styles.inputStyle}
        />
        <Input
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          leftIcon={<Icon name="envelope" type="font-awesome" size={24} color="dodgerblue" />}
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
        <Input
          placeholder="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoCapitalize="none"
          leftIcon={<Icon name="lock" type="font-awesome" size={24} color="dodgerblue" />}
          inputStyle={styles.inputStyle}
        />
        <Button
          title={isLoading ? "Registering..." : "Register"}
          onPress={handleRegistration}
          buttonStyle={styles.button}
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
  button: {
    borderRadius: 50,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
});

export default RegistrationScreen;