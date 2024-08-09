import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BaseURL } from '../../config/appconfig';
import { useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/Ionicons';
import debounce from 'lodash/debounce';

const ProductionScreen = () => {
  const [productionData, setProductionData] = useState([]);
  const [shiftHeaders, setShiftHeaders] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [searchDate, setSearchDate] = useState(null);
  const intervalRef = useRef(null);

  const fetchGroupData = async (date) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.error('No token found in AsyncStorage');
        return;
      }
  
      const productionResponse = await axios.get(`${BaseURL}data/production/`, {
        headers: { Authorization: `Token ${token}` }
      });
  
      const responseDate = productionResponse.data.date;
      if (responseDate !== date.toISOString().split('T')[0]) {
        console.log('Selected date does not match the fetched data date');
        setProductionData([]);
        return;
      }
  
      const productionData = productionResponse.data.machine_groups || [];

      const filteredData = productionData
        .map(group => ({
          ...group,
          machines: group.machines.filter(machine =>
            (machine.shifts || []).length > 0
          ),
        }))
        .filter(group => group.machines.length > 0);
  
      console.log('Filtered Production Data:', filteredData);
  
      setProductionData(filteredData.reverse());
  
      if (filteredData.length > 0 && filteredData[0].machines.length > 0) {
        const firstMachineShifts = filteredData[0].machines.flatMap(machine => machine.shifts || []);
        const shifts = firstMachineShifts
          .filter(shift => shift.shift_name || shift.shift_no)
          .map(shift => shift.shift_name || `${shift.shift_no}`);
        setShiftHeaders([...new Set(shifts)]);
      }
    } catch (error) {
      console.error('Error fetching production data:', error);
    }
  };  

  const fetchDataWithDebounce = useCallback(debounce((date) => fetchGroupData(date), 3000), []);

  const startFetchingData = () => {
    fetchDataWithDebounce(searchDate || selectedDate);
    console.log('Starting data fetch interval');
    intervalRef.current = setInterval(() => {
      fetchDataWithDebounce(searchDate || selectedDate);
      console.log('Fetching production data...');
    }, 3000);
  };

  const stopFetchingData = () => {
    if (intervalRef.current) {
      console.log('Stopping data fetch interval');
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useFocusEffect(
    useCallback(() => {
      startFetchingData();
      return () => {
        stopFetchingData();
      };
    }, [searchDate, selectedDate])
  );

  useEffect(() => {
    fetchGroupData(selectedDate);
    return () => {
      stopFetchingData();
    };
  }, [selectedDate]);

  const handleDateChange = (event, date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) {
      setSelectedDate(date);
      setSearchDate(null);
    }
  };

  const handleSearchPress = () => {
    setSearchDate(selectedDate);
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <View style={{ height: 20 }}></View>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.datePickerButton}>
            <Text style={styles.datePickerText}>{selectedDate.toISOString().split('T')[0]}</Text>
            <Icon name="calendar" size={20} color="white" style={styles.calendarIcon} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={handleSearchPress}>
            <Icon name="search" size={20} color="white" />
          </TouchableOpacity>
        </View>
        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={handleDateChange}
          />
        )}
        <View style={{ height: 20 }}></View>
        {productionData.length === 0 ? (
          <Text style={styles.messageText}>No data available for the selected date.</Text>
        ) : (
          productionData.map((group, index) => {
            const totalCounts = {};

            group.machines.forEach(machine => {
              const machineShifts = machine.shifts || [];
              machineShifts.forEach(shift => {
                const shiftHeader = shift.shift_name || `${shift.shift_no}`;
                if (shiftHeaders.includes(shiftHeader)) {
                  totalCounts[shiftHeader] = (totalCounts[shiftHeader] || 0) + shift.production_count;
                }
              });
            });

            const groupTotal = Object.values(totalCounts).reduce((a, b) => a + b, 0);

            return (
              <View key={index} style={styles.groupContainer}>
                <Text style={styles.groupHeader}>{group.group_name}</Text>
                <View style={styles.tableContainer}>
                  <ScrollView horizontal>
                    <View style={styles.table}>
                      <View style={[styles.row, styles.headerRow]}>
                        <View style={[styles.cell, styles.columnHeader, { width: 150 }]}>
                          <Text style={styles.headerText}>Work Center</Text>
                        </View>
                        {shiftHeaders.map((shiftHeader, idx) => (
                          <View key={idx} style={[styles.cell, styles.columnHeader, { width: 150 }]}>
                            <Text style={styles.headerText}>{shiftHeader}</Text>
                          </View>
                        ))}
                        <View style={[styles.cell, styles.columnHeader, { width: 150 }]}>
                          <Text style={styles.headerText}>Total</Text>
                        </View>
                      </View>
                      {group.machines.map((machine, machineIndex) => {
                        const rowTotal = shiftHeaders.reduce((acc, shiftHeader) => {
                          const shift = machine.shifts ? machine.shifts.find(s => (s.shift_name || `${s.shift_no}`) === shiftHeader) : null;
                          if (shift) {
                            acc.count += shift.production_count;
                          }
                          return acc;
                        }, { count: 0 });

                        return (
                          <View key={machineIndex} style={styles.row}>
                            <View style={[styles.cell, styles.columnValue, { width: 150 }]}>
                              <Text>{machine.machine_id}</Text>
                            </View>
                            {shiftHeaders.map((shiftHeader, idx) => {
                              const shift = machine.shifts ? machine.shifts.find(s => (s.shift_name || `${s.shift_no}`) === shiftHeader) : null;
                              return (
                                <View key={idx} style={[styles.cell, styles.columnValue, { width: 150 }]}>
                                  <Text>{shift ? shift.production_count : 0}</Text>
                                </View>
                              );
                            })}
                            <View style={[styles.cell, styles.columnValue, { width: 150 }]}>
                              <Text>{rowTotal.count}</Text>
                            </View>
                          </View>
                        );
                      })}
                      <View style={[styles.row, styles.headerRow]}>
                        <View style={[styles.cell, styles.columnHeader, { width: 150 }]}>
                          <Text style={styles.headerText}>Grand Total</Text>
                        </View>
                        {shiftHeaders.map((shiftHeader, idx) => (
                          <View key={idx} style={[styles.cell, styles.columnHeader, { width: 150 }]}>
                            <Text style={styles.headerText}>{totalCounts[shiftHeader] || 0}</Text>
                          </View>
                        ))}
                        <View style={[styles.cell, styles.columnHeader, { width: 150 }]}>
                          <Text style={styles.headerText}>{groupTotal}</Text>
                        </View>
                      </View>
                    </View>
                  </ScrollView>
                </View>
              </View>
            );
          })
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
    backgroundColor: 'ghostwhite',
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
    flexDirection: 'row',
    backgroundColor: 'dodgerblue',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginLeft: 10,
    alignItems: 'center',
  },
  datePickerText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 10,
    marginRight: 10,
  },
  iconButton: {
    backgroundColor: 'dodgerblue',
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    marginLeft: 10,
  },
  calendarIcon: {
    marginLeft: 'auto',
  },
  groupContainer: {
    width: '100%',
    marginBottom: 20,
  },
  groupHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'dodgerblue',
    padding: 10,
    borderRadius: 5,
  },
  tableContainer: {
    width: '100%',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginTop: 10,
    marginBottom: 20,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.1,
    shadowRadius: 5.84,
    elevation: 8,
  },
  table: {
    minWidth: '100%',
  },
  row: {
    flexDirection: 'row',
  },
  headerRow: {
    borderBottomWidth: 2,
    borderBottomColor: 'dodgerblue',
  },
  cell: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#ccc',
  },
  columnHeader: {
    backgroundColor: 'dodgerblue',
  },
  columnValue: {
    backgroundColor: '#fff',
  },
  headerText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  messageText: {
    fontSize: 16,
    color: 'grey',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default ProductionScreen;