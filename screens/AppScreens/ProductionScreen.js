import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Alert, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BaseURL } from '../../config/appconfig';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/Ionicons';
import debounce from 'lodash/debounce';
import NetInfo from '@react-native-community/netinfo';

const ProductionScreen = () => {
  const [productionData, setProductionData] = useState([]);
  const [shiftHeaders, setShiftHeaders] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [searchDate, setSearchDate] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [webSocket, setWebSocket] = useState(null);
  const selectedDateRef = useRef(selectedDate);
  const navigation = useNavigation();

  useEffect(() => {
    selectedDateRef.current = selectedDate;
  }, [selectedDate]);

  useEffect(() => {
    const fetchInitialData = async () => {
      const isTokenValid = await checkToken();
      if (!isTokenValid) {
        const networkState = await NetInfo.fetch();
        if (networkState.isConnected) {
          navigation.navigate('Login');
        }
        return;
      }
      await fetchGroupData();
    };

    fetchInitialData();

    const ws = new WebSocket(`${BaseURL.replace('https', 'wss')}data/production/`);
    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      try {
        const receivedData = JSON.parse(event.data);
        console.log('Received WebSocket data:', receivedData);
    
        const selectedDateFormatted = selectedDateRef.current
          ? selectedDateRef.current.toISOString().split('T')[0]
          : null;
        const receivedDate = receivedData?.date
          ? new Date(receivedData.date).toISOString().split('T')[0]
          : null;
    
        if (receivedDate && receivedDate === selectedDateFormatted) {
          console.log('Date matches, updating data.');
          const productionData = receivedData.machine_groups || [];
          const filteredData = productionData
            .map(group => ({
              ...group,
              machines: group.machines ? group.machines.filter(machine =>
                (machine.shifts || []).length > 0
              ) : [],
            }))
            .filter(group => group.machines.length > 0);
          const reversedGroups = filteredData.reverse();
          const firstMachineShifts = reversedGroups.length > 0 && reversedGroups[0].machines.length > 0
            ? reversedGroups[0].machines.flatMap(machine => machine.shifts || [])
            : [];
          const shifts = firstMachineShifts
            .filter(shift => shift.shift_name || shift.shift_no)
            .map(shift => shift.shift_name || `Shift-${shift.shift_no}`);
          console.log('Updating shift headers:', [...new Set(shifts)]);
          setShiftHeaders([...new Set(shifts)]);
          setProductionData(reversedGroups);
        } else {
          console.log('WebSocket data does not match the selected date.');
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };

    setWebSocket(ws);

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [navigation]);

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

  const fetchGroupData = async (date = null) => {
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
      if (!token) {
        console.error('No token found in AsyncStorage');
        return;
      }
      const formattedDate = date ? date.toISOString().split('T')[0] : null;

      const productionResponse = await axios.post(
        `${BaseURL}data/production/`,
        { date: formattedDate },
        {
          headers: { Authorization: `Token ${token}` }
        }
      );

      const responseDate = productionResponse.data.date;
      const fetchedDate = new Date(responseDate);
      setSelectedDate(fetchedDate);
      setSearchDate(fetchedDate);

      const productionData = productionResponse.data.machine_groups || [];

      const filteredData = productionData
        .map(group => ({
          ...group,
          machines: group.machines.filter(machine =>
            (machine.shifts || []).length > 0
          ),
        }))
        .filter(group => group.machines.length > 0);

      console.log('Filtered Production Data from API:', filteredData);

      setProductionData(filteredData.reverse());

      if (filteredData.length > 0 && filteredData[0].machines.length > 0) {
        const firstMachineShifts = filteredData[0].machines.flatMap(machine => machine.shifts || []);
        const shifts = firstMachineShifts
          .filter(shift => shift.shift_name || shift.shift_no)
          .map(shift => shift.shift_name || `Shift-${shift.shift_no}`);
        setShiftHeaders([...new Set(shifts)]);
      }
    } catch (error) {
      console.error('Error fetching production data:', error);
    }
  };

  const fetchDataWithDebounce = useCallback(debounce((date) => fetchGroupData(date), 1000), []);

  useFocusEffect(
    useCallback(() => {
      fetchGroupData();
      return () => {
        fetchDataWithDebounce.cancel();
      };
    }, [])
  );

  const handleDateChange = (event, date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) {
      setSelectedDate(date);
      setSearchDate(date);
      fetchGroupData(date);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchGroupData(searchDate);
    setRefreshing(false);
  };

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      }
    >
      <View style={styles.container}>
        <View style={{ height: 20 }}></View>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.datePickerButton}>
            <Text style={styles.datePickerText}>{selectedDate ? selectedDate.toISOString().split('T')[0] : 'Select Date'}</Text>
            <Icon name="calendar" size={20} color="black" style={styles.calendarIcon} />
          </TouchableOpacity>
        </View>
        {showDatePicker && (
          <DateTimePicker
            value={selectedDate || new Date()}
            mode="date"
            display="default"
            onChange={handleDateChange}
          />
        )}
        <View style={{ height: 20 }}></View>
        <View style={styles.whiteContainer}>
          {productionData.length === 0 ? (
            <Text style={styles.messageText}>No data available for the selected date.</Text>
          ) : (
            productionData.map((group, index) => {
              const totalCounts = {};

              group.machines.forEach(machine => {
                const machineShifts = machine.shifts || [];
                machineShifts.forEach(shift => {
                  const shiftHeader = shift.shift_name || `Shift-${shift.shift_no}`;
                  if (shiftHeaders.includes(shiftHeader)) {
                    totalCounts[shiftHeader] = (totalCounts[shiftHeader] || 0) + shift.total_shift_production_count;
                  }
                });
              });

              const groupTotal = Object.values(totalCounts).reduce((a, b) => a + b, 0);

              return (
                <View key={index} style={styles.groupContainer}>
                  <View style={styles.table}>
                    <View style={styles.tableHeader}>
                      <Text style={styles.tableTitle}>{group.group_name}</Text>
                    </View>
                    <View style={[styles.row, styles.headerRow]}>
                      <View style={[styles.cell, styles.columnHeader, { width: 80 }]}>
                        <Text style={styles.headerText}>Work Center</Text>
                      </View>
                      {shiftHeaders.map((shiftHeader, idx) => (
                        <View key={idx} style={[styles.cell, styles.columnHeader, { width: 60 }]}>
                          <Text style={styles.headerText}>{shiftHeader}</Text>
                        </View>
                      ))}
                      <View style={[styles.cell, styles.columnHeader, { width: 75 }]}>
                        <Text style={styles.headerText}>Total</Text>
                      </View>
                    </View>
                    {group.machines.map((machine, machineIndex) => {
                      const rowTotal = shiftHeaders.reduce((acc, shiftHeader) => {
                        const shift = machine.shifts ? machine.shifts.find(s => {
                          const header = s.shift_name || `Shift-${s.shift_no}`;
                          return header === shiftHeader;
                        }) : null;
                        if (shift) {
                          acc.count += shift.total_shift_production_count;
                        }
                        return acc;
                      }, { count: 0 });

                      const cellStyle = machineIndex % 2 === 0 ? styles.grayCell : styles.blackCell;
                      const textStyle = machineIndex % 2 === 0 ? styles.grayText : styles.blackText;

                      return (
                        <View key={machineIndex} style={styles.row}>
                          <View style={[styles.cell, cellStyle, { width: 80 }]}>
                            <Text style={[styles.valueText, textStyle]}>{machine.machine_name}</Text>
                          </View>
                          {shiftHeaders.map((shiftHeader, idx) => {
                            const shift = machine.shifts ? machine.shifts.find(s => {
                              const header = s.shift_name || `Shift-${s.shift_no}`;
                              return header === shiftHeader;
                            }) : null;
                            return (
                              <View key={idx} style={[styles.cell, cellStyle, { width: 60 }]}>
                                <Text style={[styles.valueText, textStyle]}>
                                  {shift ? shift.total_shift_production_count : 0}
                                </Text>
                              </View>
                            );
                          })}
                          <View style={[styles.cell, cellStyle, { width: 75 }]}>
                            <Text style={[styles.valueText, textStyle]}>{rowTotal.count}</Text>
                          </View>
                        </View>
                      );
                    })}
                    <View style={styles.row}>
                      <View style={[styles.cell, styles.totalCell, { width: 80 }]}>
                        <Text style={styles.totalText}>Total</Text>
                      </View>
                      {shiftHeaders.map((shiftHeader, idx) => (
                        <View key={idx} style={[styles.cell, styles.totalCell, { width: 60 }]}>
                          <Text style={styles.totalText}>{totalCounts[shiftHeader] || 0}</Text>
                        </View>
                      ))}
                      <View style={[styles.cell, styles.totalCell, { width: 75 }]}>
                        <Text style={styles.totalText}>{groupTotal}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>
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
    width: '90%',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
  },
  datePickerButton: {
    width:"100%",
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginLeft: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.1,
    shadowRadius: 5.84,
    elevation: 8,
  },
  whiteContainer: {
    width: '100%',
    backgroundColor: '#f6f6f6',
    borderRadius: 10,
    padding: 12,
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
  datePickerText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 10,
  },
  calendarIcon: {
    marginLeft: 'auto',
  },
  groupContainer: {
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'black',
    borderRadius: 5,
    overflow: 'hidden',
    backgroundColor: 'white',
  },
  tableContainer: {
    width: '100%',
  },
  table: {
    backgroundColor: '#f6f6f6',
    width: '100%',
    paddingTop: 9,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.1,
    shadowRadius: 5.84,
    elevation: 8,
  },
  tableHeader: {
    flex: 1,
    backgroundColor: '#f6f6f6',
    padding: 12,
  },
  tableTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'black',
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: 'black',
  },
  headerRow: {
    backgroundColor: 'lightblue',
  },
  cell: {
    flex: 1,
    borderRightWidth: 1,
    borderColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 5,
    height: 40
  },
  columnHeader: {
    backgroundColor: 'dodgerblue',
    height: 50
  },
  grayCell: {
    backgroundColor: '#f6f6f6',
    height: 50
  },
  blackCell: {
    backgroundColor: '#f6f6f6',
    height: 50
  },
  grayText: {
    color: 'black',
  },
  blackText: {
    color: 'lightblack',
  },
  headerText: {
    fontWeight: 'bold',
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
  },
  headerText1: {
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },
  valueText: {
    fontSize: 12,
    textAlign: 'center',
  },
  totalRow: {
    backgroundColor: '#f6f6f6',
  },
});

export default ProductionScreen;