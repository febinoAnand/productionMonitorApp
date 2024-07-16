import React, { useState } from 'react';
import { View, StyleSheet, Text, Keyboard, TouchableWithoutFeedback, Image } from 'react-native';
import { Input, Button, Icon } from 'react-native-elements';

const SignUpScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');

  const handleSignUp = () => {
    navigation.navigate('Loading', { nextScreen: 'OTP', params: { email, mobile } });
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <Image
          source={require('../../assets/hlmando.png')}
          style={styles.image}
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
          placeholder="Mobile"
          value={mobile}
          onChangeText={setMobile}
          autoCapitalize="none"
          keyboardType="phone-pad"
          leftIcon={<Icon name="phone" type="font-awesome" size={24} color="dodgerblue" />}
          inputStyle={styles.inputStyle}
        />
        <Button
          title="Sign Up"
          onPress={handleSignUp}
          buttonStyle={styles.button}
        />
      </View>
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

export default SignUpScreen;