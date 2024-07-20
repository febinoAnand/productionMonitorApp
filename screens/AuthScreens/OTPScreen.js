import React, { useState, useRef } from 'react';
import { View, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, Keyboard } from 'react-native';
import LoadingScreen from './loadingscreen';

const OTPScreen = ({ navigation }) => {
  const [otp, setOtp] = useState(['', '', '', '', '']);
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputs = useRef([]);

  const handleOtpInput = (index, value) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value.length === 0 && index > 0) {
      inputs.current[index - 1].focus();
    } else if (value.length === 1 && index < 4) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (index, key) => {
    if (key === 'Backspace' && index > 0 && !otp[index]) {
      inputs.current[index - 1].focus();
    }
  };

  const handleOTPVerify = async () => {
    setIsLoading(true);

    const enteredOtp = otp.join('');
    console.log(`Verifying OTP: ${enteredOtp} for ${phoneOrEmail}`);
    await new Promise(resolve => setTimeout(resolve, 2000));

    setIsLoading(false);
    navigation.navigate('Registration');
  };

  const handleResendOTP = () => {
    console.log('Resending OTP...');
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        {isLoading ? (
          <LoadingScreen />
        ) : (
          <>
            <View style={styles.textContainer}>
              <Text style={styles.baseText}>OTP was sent to +91-********56</Text>
              <Text style={styles.innerText}>Click back to change mobile no</Text>
            </View>
            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  style={styles.input}
                  value={digit}
                  onChangeText={(text) => handleOtpInput(index, text)}
                  maxLength={1}
                  keyboardType="number-pad"
                  ref={(ref) => (inputs.current[index] = ref)}
                  onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
                />
              ))}
            </View>
            <TouchableOpacity onPress={handleOTPVerify} style={[styles.button, styles.verifyButton]}>
              <Text style={styles.buttonText}>{isLoading ? 'Verifying...' : 'Verify OTP'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleResendOTP} style={[styles.button, styles.resendButton]}>
              <Text style={styles.buttonText}>Resend OTP</Text>
            </TouchableOpacity>
          </>
        )}
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
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    width: 50,
    height: 50,
    borderWidth: 3,
    borderRadius: 10,
    fontSize: 20,
    textAlign: 'center',
    marginHorizontal: 5,
    borderColor: 'dodgerblue',
    backgroundColor: 'transparent',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  baseText: {
    fontWeight: 'bold',
    fontSize: 15,
  },
  innerText: {
    textAlign: 'center',
  },
  button: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 50,
    width: '50%',
    maxWidth: 300,
  },
  verifyButton: {
    backgroundColor: 'dodgerblue',
    marginBottom: 10,
  },
  resendButton: {
    backgroundColor: 'gray',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
  },
});

export default OTPScreen;