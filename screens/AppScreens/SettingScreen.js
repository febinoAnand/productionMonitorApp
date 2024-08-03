import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import { Input, Button } from 'react-native-elements';
import Icon from 'react-native-vector-icons/FontAwesome';
import * as SecureStore from 'expo-secure-store';
import { App_Token, BaseURL } from '../../config/appconfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomAlert from '../AuthScreens/customalert.js';
import NetInfo from "@react-native-community/netinfo";

export default function Settings({ navigation }) {
    const [showValidAlert, setShowValidAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [isConnected, setIsConnected] = useState(true);
    const [deviceID, setDeviceID] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [designation, setDesignation] = useState('');
    const [mobileNo, setMobileNo] = useState('');

    useEffect(() => {
        getIDs();
        const unsubscribe = NetInfo.addEventListener(state => {
            setIsConnected(state.isConnected);
        });

        return () => {
            unsubscribe();
        };
    }, []);

    const getIDs = async () => {
        setDeviceID(await SecureStore.getItemAsync("deviceID"));
        setName(await AsyncStorage.getItem('name') || '');
        setEmail(await AsyncStorage.getItem('emailID') || '');
        setDesignation(await AsyncStorage.getItem('designation') || '');
        setMobileNo(await AsyncStorage.getItem('mobileNo') || '');
    }

    const handleLogout = async () => {
        try {
            if (!isConnected) {
                setShowValidAlert(true);
                setAlertMessage('No internet connection');
                return;
            }

            const token = await AsyncStorage.getItem('token');
            if (!token) {
                return;
            }

            console.log('Authorization:', `Token ${token}`);
            const url = `${BaseURL}Userauth/userlogout/`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`,
                },
                body: JSON.stringify({
                    device_id: deviceID,
                    app_token: App_Token,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.log('Error data:', errorData);
            }

            await SecureStore.setItemAsync('authState', '1');
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('session_id');
            await AsyncStorage.removeItem('verificationID');

            navigation.replace("Login");
        } catch (error) {
            console.error('Logout error:', error);
            navigation.replace("Login");
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.box}>
                <Text style={styles.header}>Profile</Text>
                <Input
                    placeholder="Name"
                    value={name}
                    onChangeText={setName}
                    editable={false}
                    selectTextOnFocus={false}
                    leftIcon={<Icon name="user" type="font-awesome" size={24} color="dodgerblue" />}
                    inputStyle={styles.inputStyle}
                />
                <Input
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    editable={false}
                    selectTextOnFocus={false}
                    leftIcon={<Icon name="envelope" type="font-awesome" size={24} color="dodgerblue" />}
                    inputStyle={styles.inputStyle}
                />
                <View style={styles.rowContainer}>
                    <Input
                        placeholder="Designation"
                        value={designation}
                        onChangeText={setDesignation}
                        editable={false}
                        selectTextOnFocus={false}
                        leftIcon={<Icon name="briefcase" type="font-awesome" size={24} color="dodgerblue" />}
                        inputStyle={styles.inputStyle}
                        containerStyle={styles.inputContainer}
                    />
                    <Input
                        placeholder="Mobile No"
                        value={mobileNo}
                        onChangeText={setMobileNo}
                        editable={false}
                        selectTextOnFocus={false}
                        leftIcon={<Icon name="phone" type="font-awesome" size={24} color="dodgerblue" />}
                        inputStyle={styles.inputStyle}
                        containerStyle={styles.inputContainer}
                    />
                </View>
            </View>
            <View style={styles.box}>
                <Text style={styles.header}>Device</Text>
                <Input
                    placeholder="2.1"
                    editable={false}
                    selectTextOnFocus={false}
                    leftIcon={<Icon name="mobile" type="font-awesome" size={24} color="dodgerblue" />}
                    inputStyle={styles.inputStyle}
                />
                <Input
                    placeholder="30-07-2024  12:24 PM"
                    editable={false}
                    selectTextOnFocus={false}
                    leftIcon={<Icon name="clock-o" type="font-awesome" size={24} color="dodgerblue" />}
                    inputStyle={styles.inputStyle}
                />
            </View>
            <View style={styles.logoutButtonContainer}>
                <Button
                    title="Logout"
                    onPress={handleLogout}
                    buttonStyle={styles.logoutButton}
                />
            </View>
            <CustomAlert
                visible={showValidAlert}
                onClose={() => setShowValidAlert(false)}
                message={alertMessage}
            />
            <View style={{ height: 40 }}></View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        justifyContent: 'flex-start',
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'ghostwhite',
    },
    box: {
        width: '90%',
        padding: 20,
        borderWidth: 1,
        borderColor: 'white',
        borderRadius: 10,
        backgroundColor: 'white',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        marginBottom: 20,
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        color: 'white',
        paddingVertical: 10,
        borderRadius: 5,
        backgroundColor: 'dodgerblue',
    },
    inputStyle: {
        fontSize: 16,
        marginLeft: 10,
        color: 'gray'
    },
    rowContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    inputContainer: {
        flex: 1,
        marginRight: 10,
    },
    logoutButtonContainer: {
        width: '90%',
        alignItems: 'center',
    },
    logoutButton: {
        backgroundColor: 'dodgerblue',
        borderRadius: 50,
        paddingVertical: 10,
        paddingHorizontal: 20,
        marginTop: 10,
    },
});