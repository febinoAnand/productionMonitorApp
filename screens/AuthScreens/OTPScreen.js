import React, { useRef, useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Keyboard,TouchableWithoutFeedback} from 'react-native';
import NetInfo from "@react-native-community/netinfo";
import LoadingScreen from './screenloading';
import CustomAlert from './customalert';
import { BaseURL, serverTimeoutSeconds } from '../../config/appconfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

export default function OTPpage({ navigation, route }) {
  const { otp_resend_interval, mobileNo } = route.params;
  const [isLoading, setIsLoading] = useState(false);
  const [showResendAlert, setShowResendAlert] = useState(false);
  const inputRefs = [...Array(5)].map(() => useRef(null));
  const [showConnectAlert, setShowConnectAlert] = useState(false);
  const [showOtpAlert, setShowOtpAlert] = useState(false);
  const [showresAlert, setShowresAlert] = useState(false);
  const [showInValidAlert, setShowInValidAlert] = useState(false);
  const [resendInterval, setResendInterval] = useState(null);
  const [OTP, setEnteredOTP] = useState('');
  const [showPopmessage, setShowPopmessage] = useState(false);
  const countdownRef = useRef(null);
  const [resendFocus,setResendFocus] = useState(false);

  useEffect(() => {
    checkInternetConnection();
    updateResendInterval();
  }, []);

  const updateResendInterval = () =>{
    setResendFocus(false);
    let i = otp_resend_interval;
    var intervalID = setInterval(()=>{
      i = i - 1;
      setResendInterval(i);
      if(i<=0){
        clearInterval(intervalID);
        setResendFocus(true);
        setResendInterval(null);
      }
    },1000)
  }

 

  const checkInternetConnection = async () => {
    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      setShowConnectAlert(true);
      return false;
    }
    return true;
  };

  const compareOTPWithServer = async () => {
    if (OTP.length === 5) {
      const isConnected = await checkInternetConnection();
      if (isConnected) {
        setIsLoading(true);
        try {
          const deviceID = await SecureStore.getItemAsync('deviceID');
          const appToken = await AsyncStorage.getItem('appToken');
          const sessionID = await AsyncStorage.getItem('sessionID');

            let timeout = false;
            const timeoutAlert = setTimeout(() => {
                setIsLoading(false);
                setShowresAlert(true);   
                timeout=true;
            }, serverTimeoutSeconds);


          const response = await fetch(BaseURL + "app/userverify/", {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              OTP,
              sessionID,
              appToken,
              deviceID,
            }),
          });

          if (timeout===true) return;
          clearTimeout(timeoutAlert);

          setEnteredOTP("");

          if (response.ok) {
            const responseData = await response.json();
            const { status } = responseData;
            if (status === "INVALID") {
              setShowInValidAlert(true);
              const { message } = responseData;
              if (message) {
                  setShowPopmessage(message);
              }
              setIsLoading(false);
            } 
            else if (status === "OK") {
              const { session_id, verification_id, Application_id } = responseData;
              await AsyncStorage.multiSet([
                  ['sessionID', session_id],
                  ['verificationID', verification_id.toString()],
                  ['applicationID', Application_id.toString()],
              ]);

              
              setTimeout(() => {
                navigation.replace('Registration');
              }, 2000);
            }
            else {
              setIsLoading(false);
              setShowresAlert(true);
            }
          } else {
            setIsLoading(false);
            setShowresAlert(true);
          }
        } catch (error) {
          console.error('Error:', error);
          setIsLoading(false);
          setShowOtpAlert(true);
        }
      } else {
        setIsLoading(false);
      }
    }
  };

  const handleInputChange = (value, index) => {
    if (value !== '') {
      setEnteredOTP(prevOTP => prevOTP + value);
      focusNextInput(index);
    } else {
      setEnteredOTP(prevOTP => prevOTP.slice(0, -1));
      inputRefs[index].current.focus();
    }
  };  

  const focusNextInput = (index) => {
    if (index < inputRefs.length - 1) {
      inputRefs[index + 1].current.focus();
    }
  };

  const focusPreviousInput = (index) => {
    if (index > 0) {
      inputRefs[index - 1].current.focus();
    }
  };

  const showAlertForResend = async () => {
    const isConnected = await checkInternetConnection();
    if (isConnected) {
      
      setShowResendAlert(true);
      
      let interval = otp_resend_interval;

      setResendInterval(interval);

      const sessionID = await AsyncStorage.getItem('sessionID');
      const deviceID = await SecureStore.getItemAsync('deviceID');
      const appToken = await AsyncStorage.getItem('appToken');

      let timeout = false;
      const timeoutAlert = setTimeout(() => {
          setIsLoading(false);
          setShowresAlert(true);   
          timeout=true;
      }, serverTimeoutSeconds);
  
      const response = await fetch(BaseURL + "app/resendotp/", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            appToken,
            sessionID,
            deviceID
        }),
      });

      if (timeout===true) return;
      clearTimeout(timeoutAlert);

      if (response.ok) {
        const responseData = await response.json();
        const { status, otp_resend_interval } = responseData;
 
        if (status === "INVALID") {
            setShowResendAlert(false);
            setShowInValidAlert(true);
            const { message } = responseData;
            if (message) {
                setShowPopmessage(message);
            }
        } else if (status === "OK") {
            const { session_id, otp_resend_interval, otp_expiry_time } = responseData;
            await AsyncStorage.multiSet([
                ['sessionID', session_id],
                ['otp_resend_interval', otp_resend_interval.toString()],
                ['otp_expiry_time', otp_expiry_time.toString()],
            ]);
        } else {
            setShowValidAlert(true);
        }
    } else {
        console.error('Server request failed');
    }

      updateResendInterval();
    }
  };  

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
    <View style={styles.container}>
      {isLoading ? (
        <LoadingScreen />
      ) : (
        <>
          <View style={styles.textContainer}>
            <Text style={styles.baseText}>OTP was sent to +91-{mobileNo}</Text>
            <Text style={styles.innerText}>Click back to change mobile no</Text>
          </View>
          
            <View style={styles.otpContainer}>
              {[...Array(5)].map((_, index) => (
                <TextInput
                  key={index}
                  ref={inputRefs[index]}
                  style={styles.otpInput}
                  maxLength={1}
                  keyboardType="numeric"
                  onChangeText={(value) => handleInputChange(value, index)}
                  onKeyPress={({ nativeEvent }) => {
                    if (nativeEvent.key === 'Backspace') {
                      focusPreviousInput(index);
                    }
                  }}
                />
              ))}
            </View>
            <View style={{ height: 20 }}></View>
          <View style={styles.resendContainer}>
            {resendInterval !== null && (
              <Text>Resend in {resendInterval} sec....</Text>
            )}
            <View style={{ height: 20 }}></View>
            <View style={styles.buttonContainer}>
              <Button title="Resend" disabled={!resendFocus} color="#59adff" onPress={showAlertForResend} />
            </View>
            <View style={styles.buttonContainer}>
              
              <Button title="Back" color="#59adff" onPress={()=>{
                navigation.navigate("SignUp")}
                 }/>
            </View>
            <View style={styles.buttonContainer}>
            <Button title="Verify" color="#59adff" onPress={compareOTPWithServer} />
          </View>
          </View>
        </>
      )}
      <CustomAlert
        visible={showResendAlert}
        onClose={() => setShowResendAlert(false)}
        message="OTP Resend Successfull"
      />
      <CustomAlert
        visible={showConnectAlert}
        onClose={() => setShowConnectAlert(false)}
        message="Connect to the internet or exit the app"
      />
      <CustomAlert
        visible={showOtpAlert}
        onClose={() => setShowOtpAlert(false)}
        message="Entered OTP is incorrect. Please try again."
      />
      <CustomAlert
        visible={showresAlert}
        onClose={() => setShowresAlert(false)}
        message="Something went wrong !"
      />
      <CustomAlert
          visible={showInValidAlert}
          onClose={() => setShowInValidAlert(false)}
          message={showPopmessage}
      />
    </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resendContainer: {
    alignItems: 'center',
  },
  buttonContainer: {
    borderRadius: 25,
    width: 200,
    overflow: "hidden",
    alignSelf: 'stretch',
    shadowColor: '#000',
    marginBottom: 15,
    marginTop: 5,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.1,
    shadowRadius: 5.84,
    elevation: 5,
  },
  otpInput: {
    width: 50,
    height: 50,
    borderWidth: 3,
    borderRadius: 10,
    fontSize: 20,
    textAlign: 'center',
    marginHorizontal: 5,
    borderColor: '#59adff',
    backgroundColor: 'transparent',
  },
  circle: {
    width: 70,
    height: 70,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 200,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 5,
  },
});