import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal, ActivityIndicator, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import axios from 'axios';
import { BaseURL } from '../../config/appconfig';
import NetInfo from '@react-native-community/netinfo';
import Ionicons from 'react-native-vector-icons/Ionicons';

const DashboardScreen = () => {
  const [groups, setGroups] = useState([]);
  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const websocketRef = useRef(null);
  const [refreshing, setRefreshing] = useState(false);
  const [machineDetails, setMachineDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);
  const route = useRoute();
  const { id } = route.params || {};

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
        navigation.navigate('Login');
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
      console.log('WebSocket connection opened');
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
      }
    };

    websocketRef.current.onerror = (error) => {
      console.error('WebSocket error:', error.message);
    };

    websocketRef.current.onclose = () => {
      console.log('WebSocket connection closed');
    };
  };

  const disconnectWebSocket = () => {
    if (websocketRef.current) {
      websocketRef.current.close();
      websocketRef.current = null;
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchGroupData();
      connectWebSocket();
      return () => {
        disconnectWebSocket();
      };
    }, [])
  );

  const handleSquarePress = async (machine) => {
    const todayDate = getTodayDate(); 
    setSelectedMachine({ ...machine, date: todayDate });
    setModalVisible(true);
    await fetchData(machine.machine_id, todayDate);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedMachine(null);
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

  const fetchData = async (machineId, date) => {
    const isTokenValid = await checkToken();
    if (!isTokenValid) {
      const networkState = await NetInfo.fetch();
      if (networkState.isConnected) {
        navigation.navigate('Login');
      }
      return;
    }
  
    if (!machineId) {
      console.log('Machine ID is missing or undefined');
      return;
    }
  
    try {
      const response = await axios.post(`${BaseURL}data/individual-report/`, {
        date: date,
        machine_id: machineId,
      });
      const data = response.data;
  
      if (data && data.machine_id === machineId) {
        setMachineDetails(data);
      } else {
        console.log('Machine not found in the API response.');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const startFetchingData = useCallback(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, 20000);
  }, [id]);

  const stopFetchingData = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      startFetchingData();
      return () => {
        stopFetchingData();
      };
    }, [startFetchingData, stopFetchingData])
  );

  const getLatestTiming = (shift) => {
    if (!shift || !shift.shift_start_time) {
      return { startTime: 'N/A', endTime: 'N/A' };
    }
    const startTime = shift.shift_start_time.split(' ')[1];
    const [hours, minutes] = startTime.split(':').map(Number);
    const period = hours < 12 ? 'AM' : 'PM';
    const newHours = hours % 12 || 12;

    const startTimeDisplay = `${newHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    const endHours = (hours + 8) % 24;
    const endPeriod = endHours < 12 ? 'AM' : 'PM';
    const newEndHours = endHours % 12 || 12;

    const endTimeDisplay = `${newEndHours}:${minutes.toString().padStart(2, '0')} ${endPeriod}`;
    return { startTime: startTimeDisplay, endTime: endTimeDisplay };
  };

  const getLatestShift = (shifts) => {
    if (!shifts || shifts.length === 0) return null;
    const validShifts = shifts.filter(shift => Object.keys(shift.timing).length > 0);
    return validShifts.reduce((latest, current) => {
      return (latest && latest.shift_no > current.shift_no) ? latest : current;
    }, null);
  };

  const latestShift = machineDetails ? getLatestShift(machineDetails.shifts) : null;

  return (
    <ScrollView contentContainerStyle={styles.scrollViewContent} 
    refreshControl={ <RefreshControl refreshing={refreshing} onRefresh={onRefresh}/> }
    >
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
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          );
        })}
      </View>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        {loading ? (
          <ActivityIndicator size="large" color="#59adff" style={styles.activityIndicator}  />
        ) : (
          <>
            <View style={styles.tableContainer}>
              {machineDetails ? (
                <>
                  <View style={[styles.row1, styles.centeredRow]}>
                    <View style={[styles.cell1, styles.centeredCell]}>
                      <Ionicons name="hardware-chip-sharp" size={35} color="#59adff" />
                      <Text style={styles.boldText}>{machineDetails.machine_name}</Text>
                    </View>
                  </View>
                  <View style={styles.row1}>
                    <View style={[styles.cell1, styles.columnHeader1]}>
                      <Text style={styles.headerText2}>Production Count</Text>
                    </View>
                    <View style={[styles.cell1, styles.columnValue1]}>
                      <Text style={styles.valueText}>
                        {machineDetails.shifts ? 
                          machineDetails.shifts
                            .reduce((total, shift) => 
                              total + Object.values(shift.timing).reduce((shiftTotal, timing) => shiftTotal + timing.actual_production, 0)
                            , 0)
                          : '0'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.row1}>
                    <View style={[styles.cell1, styles.columnHeader1]}>
                      <Text style={styles.headerText2}>Shift Name</Text>
                    </View>
                    <View style={[styles.cell1, styles.columnValue1]}>
                      <Text style={styles.valueText}>
                        {latestShift ? (latestShift.shift_name || `Shift ${latestShift.shift_no}`) : 'No shift available'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.row1}>
                    <View style={[styles.cell1, styles.columnHeader1]}>
                      <Text style={styles.headerText2}>Shift Time</Text>
                    </View>
                    <View style={[styles.cell1, styles.columnValue1]}>
                      <Text style={styles.valueText}>
                        {getLatestTiming(latestShift).startTime} - {getLatestTiming(latestShift).endTime}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.row1}>
                    <View style={[styles.cell1, styles.columnHeader1]}>
                      <Text style={styles.headerText2}>Current Shift Count</Text>
                    </View>
                    <View style={[styles.cell1, styles.columnValue1]}>
                      <Text style={styles.valueText}>
                        {latestShift ? Object.values(latestShift.timing).reduce((total, val) => total + val.actual_production, 0) : '0'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.row1}>
                    <View style={[styles.cell1, styles.columnHeader1]}>
                      <Text style={styles.headerText2}>Date</Text>
                    </View>
                    <View style={[styles.cell1, styles.columnValue1]}>
                      <Text style={styles.valueText}>{getTodayDate()}</Text>
                    </View>
                  </View>
                </>
              ) : (
                <Text>No details available.</Text>
              )}
            </View>
            <View style={styles.whiteContainer}>
              <View style={styles.headerContainer}>
                <Text style={styles.headerText1}>Shift Wise Report</Text>
              </View>
              {machineDetails && machineDetails.shifts && machineDetails.shifts.map((shift, shiftIndex) => (
                shift.timing && Object.keys(shift.timing).length > 0 && (
                  <View key={shiftIndex} style={styles.groupContainer}>
                    <Text style={styles.groupHeader}>
                      {shift.shift_name || `Shift ${shift.shift_no}`}
                    </Text>
                    <View style={styles.tableContainer1}>
                      <View style={styles.table}>
                        <View style={styles.row}>
                          <View style={[styles.cell, styles.columnHeader, { width: 135 }]}>
                            <Text style={styles.headerText}>Time</Text>
                          </View>
                          <View style={[styles.cell, styles.columnHeader, { width: 100 }]}>
                            <Text style={styles.headerText}>Production Count</Text>
                          </View>
                          <View style={[styles.cell, styles.columnHeader, { width: 100 }]}>
                            <Text style={styles.headerText}>Target Count</Text>
                          </View>
                        </View>
                        {Object.entries(shift.timing).map(([timeSlot, values], index) => (
                          <View key={index} style={styles.row}>
                            <View style={[styles.cell, styles.columnValue, { width: 135 }]}>
                              <Text style={styles.valueText}>{timeSlot}</Text>
                            </View>
                            <View style={[styles.cell, styles.columnValue, { width: 100 }]}>
                              <Text style={styles.valueText}>{values.actual_production}</Text>
                            </View>
                            <View style={[styles.cell, styles.columnValue, { width: 100 }]}>
                              <Text style={styles.valueText}>{values.target_production}</Text>
                            </View>
                          </View>
                        ))}
                        <View style={styles.row}>
                          <View style={[styles.cell, styles.columnHeader, { width: 135 }]}>
                            <Text style={styles.headerText}>Total</Text>
                          </View>
                          <View style={[styles.cell, styles.columnHeader, { width: 100 }]}>
                            <Text style={styles.headerText}>
                              {Object.values(shift.timing).reduce((total, val) => total + val.actual_production, 0)}
                            </Text>
                          </View>
                          <View style={[styles.cell, styles.columnHeader, { width: 100 }]}>
                            <Text style={styles.headerText}>
                              {Object.values(shift.timing).reduce((total, val) => total + val.target_production, 0)}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                    {shiftIndex < machineDetails.shifts.length - 1 && (
                      <View style={styles.dividerLine} />
                    )}
                  </View>
                )
              ))}
            </View>
            <View style={{ height: 20 }}></View>
          </>
        )}
      </View>
    </ScrollView>
      </Modal>
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
    backgroundColor: '#64b8ff',
    borderRadius: 15,
    borderColor: '#64b8ff',
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
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  button: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
    backgroundColor: '#2196F3',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
  },
  scrollContainer: {
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
  tableContainer: {
    width: '90%',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginTop: 20,
    backgroundColor: '#f6f6f6',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.1,
    shadowRadius: 5.84,
    elevation: 8,
  },
  headerContainer: {
    marginTop: 20,
    marginBottom: 10,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#59adff',
    textAlign: 'center'
  },
  headerText1: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerText2: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#333',
  },
  dividerLine: {
    height: 2,
    width: '100%',
    backgroundColor: '#59adff',
    marginVertical: 20,
  },
  whiteContainer: {
    width: '90%',
    backgroundColor: '#f1f1f1',
    borderRadius: 5,
    padding: 10,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.1,
    shadowRadius: 5.84,
    elevation: 8,
  },
  groupContainer: {
    width: '100%',
  },
  groupHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 10,
  },
  tableContainer1: {
    marginTop: 10,
  },
  activityIndicator: {
    margin: 20,
  },
  table: {
    borderWidth: 1,
    borderColor: 'black',
    borderRadius: 5,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'gray',
  },
  cell: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 5,
    borderRightWidth: 1,
    borderColor: 'gray',
  },
  columnHeader: {
    backgroundColor: '#f6f6f6',
  },
  columnValue: {
    backgroundColor: '#f6f6f6',
  },
  valueText: {
    fontSize: 13,
    color: '#333',
  },
  centeredRow: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  centeredCell: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cell1: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'gray',
  },
  boldText: {
    fontWeight: 'bold',
    fontSize: 20,
    color: '#59adff',
  },
  row1: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingVertical: 10,
  },
  columnHeader1: {
    backgroundColor: '#f6f6f6',
  },
  columnValue1: {
    backgroundColor: '#f6f6f6',
  },
});

export default DashboardScreen;