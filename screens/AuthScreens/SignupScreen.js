// import React, { useState, useEffect } from 'react';
// import { View, StyleSheet, Keyboard, TouchableWithoutFeedback, Image, ToastAndroid } from 'react-native';
// import { Input, Button, Icon } from 'react-native-elements';
// import NetInfo from '@react-native-community/netinfo';
// import LoadingScreen from './loadingscreen'; 
// import CustomAlert from './customalert';
// import CustomAlertprompt from './customalertprompt';
// import * as SecureStore from 'expo-secure-store';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { BaseURL, serverTimeoutSeconds } from '../../config/appconfig';
// import { useIsFocused } from '@react-navigation/native';

// export default function SignUpScreen({ navigation }) {
//     const [isLoading, setIsLoading] = useState(false);
//     const [showConnectAlert, setShowConnectAlert] = useState(false);
//     const [showresAlert, setShowresAlert] = useState(false);
//     const [showValidAlert, setShowValidAlert] = useState(false);
//     const [showInValidAlert, setShowInValidAlert] = useState(false);
//     const [showPromptAlert, setShowPromptAlert] = useState(false);
//     const [showPopmessage, setShowPopmessage] = useState(false);
//     const [email, setEmail] = useState('');
//     const [mobileNo, setMobileNumber] = useState('');

//     const isFocused = useIsFocused();

//     useEffect(() => {
//         const unsubscribe = NetInfo.addEventListener(state => {
//             if (!state.isConnected) {
//                 setShowConnectAlert(true);
//             } else {
//                 setShowConnectAlert(false);
//             }
//         });
//         isFocused && setIsLoading(false);
//         return () => unsubscribe();
//     }, [isFocused]);

//     const showToast = (toastMessage,delayInSeconds)=> {
//         setTimeout(()=>{
//             ToastAndroid.show(toastMessage, ToastAndroid.LONG);
//         },delayInSeconds*1000)
        
//     }

//     const promptNavigation = async (prompt) =>{
//         try {
//             const isConnected = await NetInfo.fetch().then(state => state.isConnected);
//             setShowConnectAlert(!isConnected);
//             if (!isConnected) return;
//             const deviceID = await SecureStore.getItemAsync('deviceID');
//             const appToken = await AsyncStorage.getItem('appToken');
//             const sessionID = await AsyncStorage.getItem('sessionID');
//             const needtochange = prompt
//             setIsLoading(true);

//             let timeout = false;
//             const timeoutAlert = setTimeout(() => {
//                 setIsLoading(false);
//                 setShowresAlert(true);   
//                 timeout=true;
//             }, serverTimeoutSeconds);

//             const response = await fetch(BaseURL + "app/userprompt/", {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                 },
//                 body: JSON.stringify({
//                     deviceID,
//                     appToken,
//                     sessionID,
//                     needtochange,
//                 }),
//             });

//             if(timeout===true) return;
    
//             if (response.ok) {
//                 clearInterval(timeoutAlert);
//                 const responseData = await response.json();
//                 const { status } = responseData;
                
//                 if (status === "INVALID") {
//                     setShowInValidAlert(true);
//                     const { message } = responseData;
//                     if (message) {
//                         setShowPopmessage(message);
//                     }
//                     setIsLoading(false);
//                 } else if (status === "OK") {
//                     const { session_id, otp_resend_interval, otp_expiry_time } = responseData;
//                     await AsyncStorage.multiSet([
//                         ['sessionID', session_id],
//                         ['otp_resend_interval', otp_resend_interval.toString()],
//                         ['otp_expiry_time', otp_expiry_time.toString()],
//                         ['is_existing_user', "true"]
//                     ]);
    
                    
//                     setTimeout(() => {
//                         navigation.navigate("OTP", { otp_resend_interval,  mobileNo });
//                     }, 2000);
//                 } else {
//                     setShowValidAlert(true);
//                     setIsLoading(false);
//                 }
//             } else {
//                 console.error('Server request failed');
//                 setIsLoading(false);
//             }
//         } catch (error) {
//             console.error('Error checking internet connection:', error);
//             setIsLoading(false);
//         }
        


//     }

//     const navigateToOTP = async () => {
//         let i = 0;
//         try {
//             const isConnected = await NetInfo.fetch().then(state => state.isConnected);
//             setShowConnectAlert(!isConnected);
            
//             if (!isConnected) return;
            
//             const isEmailValid = validateEmail(email);
//             const isMobileValid = validateMobile(mobileNo);

//             if (!isEmailValid || !isMobileValid) {
//                 setShowValidAlert(true);
//                 return;
//             }

//             await AsyncStorage.setItem('emailID',email);
//             await AsyncStorage.setItem('mobileNo', mobileNo);

//             const deviceID = await SecureStore.getItemAsync('deviceID');
//             const appToken = await AsyncStorage.getItem('appToken');
            
    
//             const mobileno = "+91" + mobileNo;

//             SecureStore.setItemAsync('authState','0');
//             setIsLoading(true);

//             let timeout = false;
//             const timeoutAlert = setTimeout(() => {
//                 setIsLoading(false);
//                 setShowresAlert(true);   
//                 timeout=true;
//             }, serverTimeoutSeconds);

//             const response = await fetch(BaseURL + "app/userauth/", {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                 },
//                 body: JSON.stringify({
//                     deviceID,
//                     appToken,
//                     email,
//                     mobileno,
//                 }),
//             });

//             if (timeout===true) return;
//             clearTimeout(timeoutAlert);

//             if (response.ok) {
                
//                 const responseData = await response.json();
//                 const { status, otp_resend_interval } = responseData;

//                 if (status === "INVALID") {
//                     setShowInValidAlert(true);
//                     const { message } = responseData;
//                     if (message) {
//                         setShowPopmessage(message);
//                     }
//                     setIsLoading(false);
//                 } else if (status === "PROMPT") {
//                     setShowPromptAlert(true);
//                     const { message, session_id } = responseData;
//                     if (message) {
//                         setShowPopmessage(message);
//                     }
//                     if(session_id){
//                         await AsyncStorage.setItem('sessionID',session_id);
//                     }
//                     setIsLoading(false);
//                 } else if (status === "OK") {
//                     const { session_id, otp_resend_interval, otp_expiry_time, is_existing_user } = responseData;
//                     await AsyncStorage.multiSet([
//                         ['sessionID', session_id],
//                         ['otp_resend_interval', otp_resend_interval.toString()],
//                         ['otp_expiry_time', otp_expiry_time.toString()],
//                         ['is_existing_user', is_existing_user.toString()]
//                     ]);
    
                    
//                     setTimeout(() => {
//                         navigation.navigate("OTP", { otp_resend_interval,  mobileNo });
//                     }, 2000);
//                 } else {
//                     setShowValidAlert(true);
//                     setIsLoading(false);
//                 }
//             } else {
//                 showToast("Server Request Failed",i++);
//                 console.error('Server request failed');
//                 setIsLoading(false);
//             }
//         } catch (error) {
//             showToast("Error checking internet connection",i++);
//             console.error('Error checking internet connection:', error);
//             setIsLoading(false);
//         }
//     };    

//     const validateEmail = (email) => {
//         const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//         return emailRegex.test(email);
//     };

//     const validateMobile = (mobileNo) => {
//         const mobileRegex = /^\d{10}$/;
//         return mobileRegex.test(mobileNo);
//     };

//   return (
//     <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
//       <View style={styles.container}>
//         {isLoading ? (
//           <LoadingScreen />
//         ) : (
//           <>
//             <Image
//               source={require('../../assets/hlmando.png')}
//               style={styles.image}
//             />
//             <Input
//               placeholder="Email"
//               value={email}
//               onChangeText={setEmail}
//               autoCapitalize="none"
//               keyboardType="email-address"
//               leftIcon={<Icon name="envelope" type="font-awesome" size={24} color="dodgerblue" />}
//               inputStyle={styles.inputStyle}
//             />
//             <Input
//               placeholder="Mobile"
//               value={mobileNo}
//               onChangeText={setMobileNumber}
//               autoCapitalize="none"
//               keyboardType="phone-pad"
//               leftIcon={<Icon name="phone" type="font-awesome" size={24} color="dodgerblue" />}
//               inputStyle={styles.inputStyle}
//             />
//             <Button
//               title="Sign Up"
//               onPress={navigateToOTP}
//               buttonStyle={styles.button}
//             />
//           </>
//         )}
//         <CustomAlert
//                 visible={showConnectAlert}
//                 onClose={() => setShowConnectAlert(false)}
//                 message="Connect to the internet"
//             />
//             <CustomAlert
//                 visible={showresAlert}
//                 onClose={() => setShowresAlert(false)}
//                 message="Something went wrong !"
//             />
//             <CustomAlert
//                 visible={showValidAlert}
//                 onClose={() => setShowValidAlert(false)}
//                 message="Please enter valid email and mobile number"
//             />
//             <CustomAlert
//                 visible={showInValidAlert}
//                 onClose={() => setShowInValidAlert(false)}
//                 message={showPopmessage}
//             />
//             <CustomAlertprompt
//                 visible={showPromptAlert}
//                 onClose={() => setShowPromptAlert(false)}
//                 message={showPopmessage}
//                 onYesPress={() =>{
//                     setShowPromptAlert(false);
//                     promptNavigation(true);
//                 }}
//                 onNoPress={() =>{
//                     setShowPromptAlert(false);
//                     promptNavigation(false);
//                 }}
//             />
//       </View>
//     </TouchableWithoutFeedback>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//     bottom: 50,
//   },
//   image: {
//     bottom: 40,
//     width: 250,
//     height: 100,
//     marginBottom: 20,
//   },
//   inputStyle: {
//     paddingLeft: 20,
//   },
//   button: {
//     borderRadius: 50,
//     paddingVertical: 10,
//     paddingHorizontal: 20,
//   },
// });
import React, { useState } from 'react';
import { View, StyleSheet, Text, Keyboard, TouchableWithoutFeedback, Image } from 'react-native';
import { Input, Button, Icon } from 'react-native-elements';
import LoadingScreen from './loadingscreen';

const SignUpScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = () => {
    setIsLoading(true); 
    setTimeout(() => {
      setIsLoading(false);
      navigation.navigate('OTP');
    }, 2000);
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

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
          disabled={isLoading}
        />
        <Input
          placeholder="Mobile"
          value={mobile}
          onChangeText={setMobile}
          autoCapitalize="none"
          keyboardType="phone-pad"
          leftIcon={<Icon name="phone" type="font-awesome" size={24} color="dodgerblue" />}
          inputStyle={styles.inputStyle}
          disabled={isLoading}
        />
        <Button
          title={isLoading ? 'Signing Up...' : 'Sign Up'}
          onPress={handleSignUp}
          buttonStyle={styles.button}
          disabled={isLoading}
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
  },
  image: {
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
    marginTop: 20,
  },
});

export default SignUpScreen;