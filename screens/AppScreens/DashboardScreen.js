import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { BaseURL } from '../../config/appconfig';
import NetInfo from '@react-native-community/netinfo';
import { RefreshControl } from 'react-native';

const DashboardScreen = () => {
  const [groups, setGroups] = useState([]);
  const navigation = useNavigation();
  const websocketRef = useRef(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [deviceStatus, setDeviceStatus] = useState(0);

  const checkToken = async () => {
    try {
      const networkState = await NetInfo.fetch();
      if (!networkState.isConnected) {
        Alert.alert('No Internet', 'Please check your internet connection.');
        return false;
      }

      const token = await AsyncStorage.getItem('token');
      if (!token) return false;

      await axios.get(`${BaseURL}Userauth/check-token/`, {
        headers: { Authorization: `Token ${token}` },
      });

      return true;
    } catch (error) {
      console.log('Token validation failed:', error);
      return false;
    }
  };

  const fetchGroupData = async () => {
    const isTokenValid = await checkToken();
    if (!isTokenValid) {
      const networkState = await NetInfo.fetch();
      if (networkState.isConnected) {
        navigation.replace('Login');
      }
      return;
    }
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${BaseURL}data/dashboard-data/`, {
        headers: { Authorization: `Token ${token}` },
      });
  
      const responseData = response.data;
      // console.log("responce :",response.data)
      if (responseData && Array.isArray(responseData.groups)) {
        const updatedGroups = responseData.groups.map(group => ({
          ...group,
          machines: group.machines.map(machine => ({
            ...machine,
            production_count: machine.production_count || 0,
            target_production: machine.target_production || 0,
          })),
        }));

        setGroups(updatedGroups.reverse());
        setDeviceStatus(responseData.device_status);
      } else {
        console.error('Expected an array inside "groups", but received:', responseData.groups);
        setGroups([]);
      }
    } catch (error) {
      console.error('Error fetching group data:', error);
      setGroups([]);
    }
  };

  const connectWebSocket = async () => {
    const token = await AsyncStorage.getItem('token');
    const wsURL = `${BaseURL.replace('https', 'wss')}data/dashboard-data/`;

    websocketRef.current = new WebSocket(wsURL, [], {
      headers: {
        Authorization: `Token ${token}`,
      },
    });

    websocketRef.current.onopen = () => {
      // console.log('WebSocket connection opened');
    };

    websocketRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data && Array.isArray(data.groups)) {
        const updatedGroups = data.groups.map(group => ({
          ...group,
          machines: group.machines.map(machine => ({
            ...machine,
            production_count: machine.production_count || 0,
            target_production: machine.target_production || 0,
          })),
        }));
        setGroups(updatedGroups.reverse());
        setDeviceStatus(data.device_status);
      }
    };

    websocketRef.current.onerror = (error) => {
      console.error('WebSocket error:', error.message);
    };

    websocketRef.current.onclose = () => {
      // console.log('WebSocket connection closed');
    };
  };

  const disconnectWebSocket = () => {
    if (websocketRef.current) {
      websocketRef.current.close();
      websocketRef.current = null;
    }
  };

  const handleNetworkChange = async (state) => {
    setIsConnected(state.isConnected);
    if (state.isConnected && !websocketRef.current) {
      connectWebSocket();
    }
  };

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(handleNetworkChange);
    return () => {
      unsubscribe();
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchGroupData();
      connectWebSocket();
      return () => {
        disconnectWebSocket();
      };
    }, [])
  );

  const handleSquarePress = (machine) => {
    // console.log('Selected Machine ID:', machine.machine_id, machine.status);
    navigation.navigate('WORK CENTER', { id: machine.machine_id, status: machine.status });
  };

  const getSquareBackgroundColor = (production_count, target_production) => {
    if (target_production === 0) return '#f6f6f6';
    
    const percentage = (production_count / target_production) * 100;
    
    if (percentage < 85) return '#ffabab';
    if (percentage >= 85 && percentage < 95) return '#ffea94';
    return '#c3ffab';
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchGroupData();
    setRefreshing(false);
  }, []);

  const getRectangleColor = (status) => {
    if (status === 1) return 'red';
    if (status === 0) return '#6df138';
    return 'yellow';
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollViewContent} 
    refreshControl={ <RefreshControl refreshing={refreshing} onRefresh={onRefresh}/> }
    >
      {/* <View style={styles.deviceStatusContainer}>
        <Text style={styles.deviceText}>Device :</Text>
        <View style={[styles.statusCircle, { backgroundColor: deviceStatus === 0 ? '#6df138' : 'red' }]} />
        <Text style={[styles.statusText, { color: deviceStatus === 0 ? '#6df138' : 'red' }]}>
          {deviceStatus === 0 ? 'Online' : 'Offline'}
        </Text>
      </View> */}
      {/* <View style={{ height: 30 }}></View> */}
      <View style={styles.container}>
        {groups.map((group) => {
          if (group.machines.length === 0) return null;

          return (
            <View key={group.group_id} style={styles.groupContainer}>
              <View style={styles.sectionHeaderContainer}>
                <Text style={styles.sectionHeaderText}>{group.group_name}</Text>
              </View>
              <View style={styles.sectionContainer}>
                <View style={styles.squareContainer}>
                  {group.machines.map((machine) => (
                    <TouchableOpacity
                      key={machine.machine_id}
                      style={[styles.square, { backgroundColor: getSquareBackgroundColor(machine.production_count, machine.target_production) }]}
                      onPress={() => handleSquarePress(machine)}
                    >
                      <Text style={styles.squareText}>{machine.machine_name}</Text>
                      <View style={styles.oval}>
                      <Text style={styles.ovalText}>{machine.production_count}</Text>
                      <View style={styles.line} />
                      <Text style={styles.ovalText}>{machine.target_production}</Text>
                      <View style={[styles.redRectangle, { backgroundColor: getRectangleColor(machine.status) }]} />
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          );
        })}
      </View>
      <View style={{ height: 20 }}></View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: '#f1f1f1',
  },
  container: {
    width: '100%',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  // sectionContainer: {
  //   width: '90%',
  //   marginBottom: 30,
  //   backgroundColor: '#b0b0b0',
  //   borderRadius: 20,
  // },
  sectionHeader: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  groupContainer: {
    width: '90%',
  },
  sectionHeaderContainer: {
    width: '80%',
    left: 37,
    top: 50,
    backgroundColor: '#59adff',
    borderRadius: 15,
    borderColor: '#59adff',
    borderWidth: 2,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    zIndex: 10,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.1,
    shadowRadius: 5.84,
    elevation: 8,
  },
  sectionHeaderText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
  },
  sectionContainer: {
    backgroundColor: '#b0b0b0',
    borderRadius: 20,
    padding: 20,
    borderColor: '#b0b0b0',
    borderWidth: 2,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.1,
    shadowRadius: 5.84,
    elevation: 8,
  },
  // sectionHeaderText: {
  //   fontSize: 24,
  //   fontWeight: 'bold',
  //   color: '#333',
  // },
  squareContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    marginTop: 10,
    paddingTop: 20,
    left: 3,
  },
  square: {
    width: '43%',
    height: 150,
    backgroundColor: '#f6f6f6',
    borderRadius: 20,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 10,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.1,
    shadowRadius: 5.84,
    elevation: 8,
  },
  oval: {
    width: '80%',
    height: '60%',
    top: 45,
    backgroundColor: '#64b8ff',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
  },
  ovalText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'black',
  },
  squareText: {
    bottom: 50,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  line: {
    height: 3,
    width: 60,
    backgroundColor: 'black',
    marginHorizontal: 5,
  },
  redRectangle: {
    width: 80,
    height: 10,
    marginTop: 10,
    borderRadius: 2,
  },
  deviceStatusContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f1f1',
    padding: 10,
    borderRadius: 10,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  deviceText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 10,
  },
  statusCircle: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    marginRight: 5,
  },
  statusText: {
    fontSize: 12,
  },
});

export default DashboardScreen;