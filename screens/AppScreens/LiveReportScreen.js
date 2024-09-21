import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { BaseURL } from '../../config/appconfig';
import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const LiveReportScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { id } = route.params || {};
  const [machineDetails, setMachineDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

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

  const fetchData = async () => {
    const isTokenValid = await checkToken();
    if (!isTokenValid) {
      const networkState = await NetInfo.fetch();
      if (networkState.isConnected) {
        navigation.navigate('Login');
      }
      return;
    }
    if (!id) {
      console.log('Machine ID is missing or undefined');
      return;
    }

    try {
      const todayDate = getTodayDate();
      const response = await axios.post(`${BaseURL}data/individual-report/`, {
        date: todayDate,
        machine_id: id,
      });
      const data = response.data;
      // console.log('API Response:', data);

      if (data && data.machine_id === id) {
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
    // console.log('Starting data fetch interval');
    fetchData();
    intervalRef.current = setInterval(() => {
      // console.log('Fetching data...');
      fetchData();
    }, 20000);
  }, [id]);

  const stopFetchingData = useCallback(() => {
    if (intervalRef.current) {
      // console.log('Stopping data fetch interval');
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

  useEffect(() => {
    return () => {
      stopFetchingData();
    };
  }, [stopFetchingData]);

  const getLatestTiming = (shift) => {
    if (!shift || !shift.shift_start_time) {
      return { startTime: 'N/A', endTime: 'N/A' };
    }
    const startTime = shift.shift_start_time.split(' ')[1];
    const [hours, minutes, seconds] = startTime.split(':').map(Number);
    const period = hours < 12 ? 'AM' : 'PM';
    let newHours = hours;
  
    if (newHours > 12) {
      newHours -= 12;
    } else if (newHours === 0) {
      newHours = 12;
    }

    const startTimeDisplay = `${newHours}:${minutes.toString().padStart(2, '0')} ${period}`;

    let endHours = (hours + 8) % 24;
    let endPeriod = endHours < 12 ? 'AM' : 'PM';

    if (endHours > 12) {
      endHours -= 12;
    } else if (endHours === 0) {
      endHours = 12;
    }

    const endTimeDisplay = `${endHours}:${minutes.toString().padStart(2, '0')} ${endPeriod}`;

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
                      <Text style={styles.valueText}>{machineDetails && machineDetails.date ? machineDetails.date : 'N/A'}</Text>
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
  );
};

const styles = StyleSheet.create({
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

export default LiveReportScreen;