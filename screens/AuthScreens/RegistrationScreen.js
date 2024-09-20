import React, { useState, useEffect } from 'react';
import { View, TextInput, Image, StyleSheet, ScrollView, Platform } from "react-native";
import { SimpleLineIcons, FontAwesome5, Feather, MaterialIcons } from '@expo/vector-icons';
import LoadingScreen from './screenloading';
import CustomAlert from './customalert';
import SuccessAlert from './successalert';
import NetInfo from "@react-native-community/netinfo";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BaseURL } from '../../config/appconfig';
import * as SecureStore from 'expo-secure-store';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { v4 as uuidv4 } from 'uuid';
import Constants from "expo-constants"
import SuccessAlertPopup from './successalertpopup';
import { Button } from 'react-native-elements';

export default function Registration({ navigation }) {
    const [isLoading, setIsLoading] = useState(false);
    const [showConnectAlert, setShowConnectAlert] = useState(false);
    const [showPasswordAlert, setShowPasswordAlert] = useState(false);
    const [showInputAlert, setShowInputAlert] = useState(false);
    const [showRegisterAlert, setShowRegisterAlert] = useState(false);
    const [showSuccessAlert, setShowSuccessAlert] = useState(false);
    const [showSuccessAlertPopUp, setShowSuccessAlertPopUp] = useState(false);
    const [showValidAlert, setShowValidAlert] = useState(false);
    const [isConnected, setIsConnected] = useState(true);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');
    const [designation, setDesignation] = useState('');
    const [showPopmessage, setShowPopmessage] = useState(false);
    const [showMessagePrompt,setShowMessagePrompt] = useState("")

    const changeNavigation = async ()=>{
       await navigation.replace("Login");
    }

    const introEffect = async ()=>{
        const unsubscribe = NetInfo.addEventListener(state => {
            setIsConnected(state.isConnected);
        });
         const projectExpoID = await initializeApplicationID();
         await registerForPushNotificationsAsync(projectExpoID);

    }

    useEffect(() => {
        introEffect();
    }, []);

    const initializeApplicationID = async () =>{
        const expoprojectID = await AsyncStorage.getItem('applicationID');
        return expoprojectID;
    }   

    const generateUUID = ()=>{
        let uuid = uuidv4();
        return uuid;
    }

    const navigateToLogin = async () => {
        if (!isConnected) {
            setShowConnectAlert(true);
            return;
        }

        if (name===null || name==='' || name.length < 3){
            setShowInputAlert(true);
            setShowMessagePrompt("Enter Valid Name");
            return;
        }

        if (designation===null || designation==='' || designation.length < 3){
            setShowInputAlert(true);
            setShowMessagePrompt("Enter Valid designation");
            return;
        }
        if (password===null || password==='' || password.length < 5){
            setShowInputAlert(true);
            setShowMessagePrompt("Enter Valid Password");
            return;
        }

        if (password !== confirmPassword) {
            setShowPasswordAlert(true);
            return;
        }

        setIsLoading(true);

        try {
            await AsyncStorage.setItem('name', name);
            await AsyncStorage.setItem('designation', designation);
            
            const sessionID = await AsyncStorage.getItem('sessionID');
            const deviceID = await SecureStore.getItemAsync('deviceID');
            const appToken = await AsyncStorage.getItem('appToken');
            const notificationID = await AsyncStorage.getItem('notificationID');
            const verificationID = await AsyncStorage.getItem('verificationID');

            const data = {
                name,
                designation,
                password,
                sessionID,
                deviceID,
                appToken,
                notificationID,
                verificationID
            };

            const response = await fetch(BaseURL + "app/userregister/", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (response.ok) {

                const responseData = await response.json();
                const { status } = responseData;
                if (status === "OK") {
                    await SecureStore.setItemAsync('authState', '1');
                    const { message } = responseData;
                    if (message) {
                        setShowPopmessage(message);
                    }
                setIsLoading(false);
                setShowSuccessAlert(true)
            }
            else if (status === "INVALID") {
                
                const { message } = responseData;
                if (!message) {
                    message = "Something went wrong..."
                }
            setShowPopmessage(message);


            setIsLoading(false);
            setShowInputAlert(true);
            } 
             else {
                const { message } = responseData;
                    if (message) {
                        setShowPopmessage(message);
                    }
            }
            } else {
                setIsLoading(false);
                setShowPopmessage("Something went wrong");
                setShowRegisterAlert(true);
                
            }
        } catch (error) {
            console.error('Error:', error);
            setIsLoading(false);
        }
    };

     async function registerForPushNotificationsAsync (expoProjectID){
        let token;
      
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
          });
        }
      
        if (Device.isDevice) {
          const { status: existingStatus } = await Notifications.getPermissionsAsync();
          let finalStatus = existingStatus;
          if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
          }
          if (finalStatus !== 'granted') {
            alert('Failed to get push token for push notification!');
            return;
          }
          const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId
          try{
            token = (await Notifications.getExpoPushTokenAsync({ projectId})).data;
            if(!token){
                token = generateUUID();
            }
          }catch(error){
            token = generateUUID();
          }
          await AsyncStorage.setItem('notificationID',token);

        } else {
          alert('Must use physical device for Push Notifications');
          token = generateUUID();
          await AsyncStorage.setItem('notificationID',token);
        }
      }

    return (
        <>
            {isLoading ? (
                <LoadingScreen />
            ) : (
                <ScrollView contentContainerStyle={styles.scrollViewContainer}>
                    <Image
                        source={require('../../assets/hlmando.png')}
                        style={styles.image}
                        resizeMode="cover"
                    />
                    <View style={styles.centerText}>
                        <View style={styles.inputContainer}>
                            <SimpleLineIcons name="user" size={20} color="#59adff" style={styles.icon} />
                            <TextInput
                                style={styles.textInput}
                                placeholder='Name'
                                autoCapitalize="none" 
                                onChangeText={text => setName(text)} />
                        </View>
                        <View style={styles.inputContainer}>
                            <FontAwesome5 name="user-graduate" size={20} color="#59adff" style={styles.icon} />
                            <TextInput
                                style={styles.textInput}
                                placeholder='Designation'
                                autoCapitalize="none" 
                                onChangeText={text => setDesignation(text)}/>
                        </View>
                        <View style={styles.inputContainer}>
                            <Feather name="unlock" size={20} color="#59adff" style={styles.icon} />
                            <TextInput
                                style={styles.textInput}
                                placeholder='Password'
                                autoCapitalize="none"
                                secureTextEntry={true}
                                onChangeText={text => setPassword(text)} 
                            />
                        </View>
                        <View style={styles.inputContainer}>
                            <Feather name="unlock" size={20} color="#59adff" style={styles.icon} />
                            <TextInput
                                style={styles.textInput}
                                placeholder='Confirm Password'
                                autoCapitalize="none" 
                                secureTextEntry={true}
                                onChangeText={text => setConfirmPassword(text)} 
                            />
                        </View>
                    </View>
                    <View style={{ height: 20 }}></View>
                    <Button
                      title={isLoading ? "Registering..." : "Register"}
                      onPress={navigateToLogin}
                      buttonStyle={styles.button}
                      disabled={isLoading}
                    />
                    <CustomAlert
                        visible={showConnectAlert}
                        onClose={() => setShowConnectAlert(false)}
                        message="Connect to the internet"
                    />
                    <CustomAlert
                        visible={showPasswordAlert}
                        onClose={() => setShowPasswordAlert(false)}
                        message="Confirm Password does not match"
                    />
                    <CustomAlert
                        visible={showInputAlert}
                        onClose={() =>
                            setShowInputAlert(false)
                        }
                        message={showMessagePrompt}
                    />
                    <CustomAlert
                        visible={showRegisterAlert}
                        onClose={() => setShowRegisterAlert(false)}
                        message={showPopmessage}
                    />
                    <SuccessAlert
                        visible={showSuccessAlert}
                        onClose={ () => {
                                setShowSuccessAlert(false)
                                setIsLoading(true)
                                setTimeout(()=>{
                                    setIsLoading(false)
                                    navigation.pop();
                                    navigation.replace("Login"); 
                                },1000)
                            }
                        }
                        message={showPopmessage}
                    />

                    <SuccessAlertPopup
                        visible={showSuccessAlertPopUp}
                        onClose={ () => {
                                setShowSuccessAlertPopUp(false)
                            }
                        }
                        message={showPopmessage}
                    />
                    <CustomAlert
                        visible={showValidAlert}
                        onClose={() => setShowValidAlert(false)}
                        message="Please enter valid data"
                    />
                </ScrollView>
            )}
        </>
    )
}

const styles = StyleSheet.create({
    scrollViewContainer: {
        flexGrow: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    centerText: {
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#59adff',
        width: 300,
        marginVertical: 10,
    },
    textInput: {
        flex: 1,
        height: 45,
        paddingLeft: 30,
    },
    icon: {
        position: 'absolute',
        left: 3,
        zIndex: 1,
    },
    circle: {
        width: 70,
        height: 70,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
        left: 130,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.2,
        shadowRadius: 1,
        elevation: 5,
    },
    image: {
      bottom:40,
      width: 250,
      height: 100,
      marginBottom: 20,
    },
    button: {
      borderRadius: 50,
      paddingVertical: 10,
      paddingHorizontal: 20,
    },
})