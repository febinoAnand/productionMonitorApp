import React, { useEffect, useRef, useState } from 'react';
import { View, Image, StyleSheet, Animated } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User_Expirytime } from '../../config/appconfig.js';
import CustomAlert from '../AuthScreens/customalert.js';
import { differenceInSeconds } from 'date-fns'
import { DeviceID, App_Token } from '../../config/appconfig.js';
import { v4 as uuidv4 } from 'uuid';
import 'react-native-get-random-values';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';


export default function Splash({ route, navigation }) {
    // const { authState } = route.params;
    const [authState,setAuthState] = useState("");

    const [popupInvalidAlert,setPopupInvalidAlert] = useState(false);

    const [popMessage, setPopmessage] = useState(false);
    const [showInValidAlert,setShowInValidAlert] = useState(false)

    const fadeAnim = useRef(new Animated.Value(0)).current;
    let user_expiry_time = 0;

    const authStateKey = "authState";
  

    const getAuthState = async (key) =>{
        let data = await SecureStore.getItemAsync(key);
        if(data==null || data =='' || data == 'null' || !data || typeof(data) != 'string' ){
            data = '0';
            await SecureStore.setItemAsync(key,data); 
        }
        // console.log("splashauthState-->",data);
        checkAuthState(data);
        setAuthState(data)
    }

    const getDeviceID = async () =>{
        let uuid = uuidv4();
        let fetchUUID = await SecureStore.getItemAsync('deviceID');
        //if user has already signed up prior
        if (!fetchUUID) {
            await SecureStore.setItemAsync('deviceID', uuid);
            fetchUUID = uuid
        }
        // console.log("device id-->",fetchUUID)
    }

    const udpateNotificationPermissino = async ()=>{
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
        }
    }

    const getUserExpiryTime = async () =>{
        user_expiry_time = await AsyncStorage.getItem("expiry_time");
        console.log(user_expiry_time)
        try{
            user_expiry_time = parseInt(user_expiry_time)
        }
        catch(error){
            user_expiry_time = 0
            await AsyncStorage.setItem("expiry_time","0");
        }
    }

    useEffect(()=>{
        udpateNotificationPermissino();
        getAuthState(authStateKey);
        getDeviceID();
        getUserExpiryTime();
    },[])

    const checkAuthState = async (authState) => {
        try {
            let nextScreen = 'SignUp';

             if (authState === '2') {
                const loggedTime = new Date(await AsyncStorage.getItem('loggedinat'));
                // console.log(loggedTime);
         
                const currentTime = new Date();
                // console.log(currentTime);

                const elapsedTimeInSeconds = differenceInSeconds(currentTime,loggedTime);
                // console.log(elapsedTimeInSeconds);
                
                //if session expired...
                if (elapsedTimeInSeconds > user_expiry_time) { 
                    // console.log("login screen");
                    nextScreen = 'TabScreen';
                    setAuthState("1");
                    await SecureStore.setItemAsync(authStateKey, "1");
                    // console.log("login------");
                } 
                //if not expired...
                else {
                    nextScreen = 'TabScreen';
                }
            }
            // Login Needed...
            else if (authState === '1') {
                nextScreen = 'Login';
            } 
            else{
                setAuthState("0");
                await SecureStore.setItemAsync(authStateKey, "0");
            }
            await AsyncStorage.setItem('deviceID', DeviceID);
            await AsyncStorage.setItem('appToken', App_Token);   

            Animated.timing(
                fadeAnim,
                {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }
            ).start(() => {
                setTimeout(() => {

                    navigation.replace(nextScreen);
                }, 1000);
            });
        } catch (error) {
            console.error('Error retrieving authentication state:', error);
        }
    };

    return (
        <>
            <View style={styles.container}>
                <Animated.Image
                    source={require('../../assets/hlmando.png')}
                    style={[styles.image, { opacity: fadeAnim }]}
                    resizeMode="contain"
                />
            </View>
            <CustomAlert
                    visible={showInValidAlert}
                    onClose={() => setPopupAlert(false)}
                    message={popMessage}
            />
        </>
        
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    image: {
        width: '50%',
        height: '50%',
    },
});