import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Platform } from 'react-native';
import DatePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BaseURL } from '../../config/appconfig';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import NetInfo from '@react-native-community/netinfo';

const hardCodedShifts = [
  {
    shift_name: 'Shift 1',
    shift_number: 1,
    time_slots: [
      { start_time: '06:30 AM', end_time: '07:30 AM', count: 0, actual: 0 },
      { start_time: '07:30 AM', end_time: '08:30 AM', count: 0, actual: 0 },
      { start_time: '08:30 AM', end_time: '09:30 AM', count: 0, actual: 0 },
      { start_time: '09:30 AM', end_time: '10:30 AM', count: 0, actual: 0 },
      { start_time: '10:30 AM', end_time: '11:30 AM', count: 0, actual: 0 },
      { start_time: '11:30 AM', end_time: '12:30 PM', count: 0, actual: 0 },
      { start_time: '12:30 PM', end_time: '01:30 PM', count: 0, actual: 0 },
      { start_time: '01:30 PM', end_time: '02:30 PM', count: 0, actual: 0 },
    ],
    groups: [
      {
        machines: [
          { machine_name: 'Machine A' },
          { machine_name: 'Machine B' },
        ],
      },
    ],
  },
  {
    shift_name: 'Shift 2',
    shift_number: 2,
    time_slots: [
      { start_time: '02:30 PM', end_time: '03:30 PM', count: 0, actual: 0 },
      { start_time: '03:30 PM', end_time: '04:30 PM', count: 0, actual: 0 },
      { start_time: '04:30 PM', end_time: '05:30 PM', count: 0, actual: 0 },
      { start_time: '05:30 PM', end_time: '06:30 PM', count: 0, actual: 0 },
      { start_time: '06:30 PM', end_time: '07:30 PM', count: 0, actual: 0 },
      { start_time: '07:30 PM', end_time: '08:30 PM', count: 0, actual: 0 },
      { start_time: '08:30 PM', end_time: '09:30 PM', count: 0, actual: 0 },
      { start_time: '09:30 PM', end_time: '10:30 PM', count: 0, actual: 0 },
    ],
    groups: [
      {
        machines: [
          { machine_name: 'Machine A' },
          { machine_name: 'Machine C' },
        ],
      },
    ],
  },
  {
    shift_name: 'Shift 3',
    shift_number: 3,
    time_slots: [
      { start_time: '10:30 PM', end_time: '11:30 PM', count: 0, actual: 0 },
      { start_time: '11:30 PM', end_time: '12:30 AM', count: 0, actual: 0 },
      { start_time: '12:30 AM', end_time: '01:30 AM', count: 0, actual: 0 },
      { start_time: '01:30 AM', end_time: '02:30 AM', count: 0, actual: 0 },
      { start_time: '02:30 AM', end_time: '03:30 AM', count: 0, actual: 0 },
      { start_time: '03:30 AM', end_time: '04:30 AM', count: 0, actual: 0 },
      { start_time: '04:30 AM', end_time: '05:30 AM', count: 0, actual: 0 },
      { start_time: '05:30 AM', end_time: '06:30 AM', count: 0, actual: 0 },
    ],
    groups: [
      {
        machines: [
          { machine_name: 'Machine A' },
          { machine_name: 'Machine C' },
        ],
      },
    ],
  },
];

const ReportScreen = () => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownOptions, setDropdownOptions] = useState([]);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [searchResults, setSearchResults] = useState(hardCodedShifts);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const navigation = useNavigation();

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

  useEffect(() => {
    const fetchData = async () => {
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
        const machineResponse = await axios.get(`${BaseURL}devices/machine/`, {
          headers: { Authorization: `Token ${token}` }
        });
        const machineData = machineResponse.data;

        const machineOptions = machineData.map(machine => ({
          label: machine.machine_name,
          value: machine.machine_id,
        }));

        setDropdownOptions(machineOptions);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const handleDateChange = (event, date) => {
    if (date !== undefined) {
      setSelectedDate(date);
      setShowDatePicker(false);
    } else {
      setShowDatePicker(false);
    }
  };

  const toggleDropdown = () => {
    setDropdownVisible(!dropdownVisible);
  };

  const handleDropdownSelect = (option) => {
    setSelectedOption(option);
    setSelectedMachine(option.value);
    setDropdownVisible(false);
  };

  const handleSearch = async () => {
    if (!selectedMachine || !selectedDate) {
      // console.log('Please select both machine and date');
      return;
    }
  
    const selectedDateString = selectedDate.toISOString().split('T')[0];
  
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.post(
        `${BaseURL}data/hourly-shift-report/`,
        { machine_id: selectedMachine, date: selectedDateString },
        { headers: { Authorization: `Token ${token}` } }
      );
  
      const data = response.data;
  
      const filteredShifts = data.shifts
        .filter((shift) => Object.keys(shift.timing).length > 0)
        .map((shift) => {
          const timeSlots = Object.keys(shift.timing).map(time => ({
            start_time: time.split(' - ')[0],
            end_time: time.split(' - ')[1],
            count: shift.timing[time][0],
            actual: shift.timing[time][1],
          }));
  
          return {
            shift_name: shift.shift_name || `Shift ${shift.shift_no}`,
            shift_number: shift.shift_no,
            time_slots: timeSlots,
          };
        });
  
      setSearchResults(filteredShifts);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleReset = () => {
    setSelectedOption(null);
    setSelectedDate(new Date());
    setSearchResults(hardCodedShifts);
  };

  useFocusEffect(
    useCallback(() => {
      handleReset();
    }, [])
  );

  const calculateShiftTotalCount = (shift) => {
    return shift.time_slots.reduce((total, slot) => total + slot.count, 0);
  };

  const calculateShiftTotalActual = (shift) => {
    return shift.time_slots.reduce((total, slot) => total + slot.actual, 0);
  };

  const calculateShiftTotalDifference = (shift) => {
    return shift.time_slots.reduce((total, slot) => total + (slot.count - slot.actual), 0);
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <View style={{ height: 20 }}></View>
        <View style={styles.inputContainer}>
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={toggleDropdown}
            >
              <Text style={styles.datePickerText}>{selectedOption ? selectedOption.label : 'Select Machine'}</Text>
              <Icon name="caret-down" size={16} color="white" style={styles.calendarIcon} />
            </TouchableOpacity>
            {dropdownVisible && (
              <Modal
                transparent={true}
                animationType="slide"
                visible={dropdownVisible}
                onRequestClose={toggleDropdown}
              >
                <View style={styles.modalOverlay}>
                  <View style={styles.dropdownContainer}>
                  <Text style={styles.modalTitle}>Select Machine</Text>
                    <ScrollView
                      keyboardShouldPersistTaps="handled"
                      nestedScrollEnabled={true}
                      showsVerticalScrollIndicator={false}
                    >
                      {dropdownOptions.map((option, index) => (
                        <TouchableOpacity
                          key={index}
                          style={styles.dropdownItem}
                          onPress={() => handleDropdownSelect(option)}
                        >
                          <Text>{option.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                    <TouchableOpacity onPress={toggleDropdown} style={styles.closeButton}>
                      <Text style={styles.closeButtonText}>Close</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Modal>
            )}
          <TouchableOpacity style={styles.datePickerButton} onPress={() => setShowDatePicker(true)}>
            <Text style={styles.datePickerText}>{selectedDate.toDateString()}</Text>
            <Icon name="calendar" size={16} color="white" style={styles.calendarIcon} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={handleSearch}>
            <Icon name="search" size={16} color="white" />
          </TouchableOpacity>
        </View>
        {showDatePicker && (
          <DatePicker
            testID="dateTimePicker"
            value={selectedDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
            style={styles.datePicker}
          />
        )}
        {searchResults.length === 0 ? (
          <Text style={styles.messageText}>No data available.</Text>
        ) : (
          <View style={styles.whiteContainer}>
            {searchResults.map((shift, shiftIndex) => {
              const shiftTotalCount = calculateShiftTotalCount(shift);
              const shiftTotalActual = calculateShiftTotalActual(shift);
              const shiftTotalDifference = calculateShiftTotalDifference(shift);
              return (
                <View key={shiftIndex} style={styles.groupContainer}>
                  <View style={{ height: 20 }}></View>
                  <Text style={styles.groupHeader}>{shift.shift_name}</Text>
                  <View style={styles.tableContainer}>
                    <View style={styles.table}>
                      <View style={styles.row}>
                        <View style={[styles.cell, styles.columnHeader, { width: 95 }]}>
                          <Text style={styles.headerText}>Time</Text>
                        </View>
                        <View style={[styles.cell, styles.columnHeader, { width: 80 }]}>
                          <Text style={styles.headerText}>Production Count</Text>
                        </View>
                        <View style={[styles.cell, styles.columnHeader, { width: 80 }]}>
                          <Text style={styles.headerText}>Target Count</Text>
                        </View>
                        <View style={[styles.cell, styles.columnHeader, { width: 80 }]}>
                          <Text style={styles.headerText}>Difference</Text>
                        </View>
                      </View>
                      {shift.time_slots.map((slot, index) => (
                        <View key={index} style={styles.row}>
                          <View style={[styles.cell, styles.columnValue, { width: 95 }]}>
                            <Text style={styles.valueText}>{`${slot.start_time} - ${slot.end_time}`}</Text>
                          </View>
                          <View style={[styles.cell, styles.columnValue, { width: 80 }]}>
                            <Text style={styles.valueText}>{slot.count}</Text>
                          </View>
                          <View style={[styles.cell, styles.columnValue, { width: 80 }]}>
                            <Text style={styles.valueText}>{slot.actual}</Text>
                          </View>
                          <View style={[styles.cell, styles.columnValue, { width: 80 }]}>
                            <Text style={styles.valueText}>{slot.count - slot.actual}</Text>
                          </View>
                        </View>
                      ))}
                      <View style={styles.row}>
                        <View style={[styles.cell, styles.columnHeader1, { width: 95 }]}>
                          <Text style={styles.headerText1}>Total</Text>
                        </View>
                        <View style={[styles.cell, styles.columnHeader1, { width: 80 }]}>
                          <Text style={styles.headerText1}>{shiftTotalCount}</Text>
                        </View>
                        <View style={[styles.cell, styles.columnHeader1, { width: 80 }]}>
                          <Text style={styles.headerText1}>{shiftTotalActual}</Text>
                        </View>
                        <View style={[styles.cell, styles.columnHeader1, { width: 80 }]}>
                          <Text style={styles.headerText1}>{shiftTotalDifference}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                  {shiftIndex < searchResults.length - 1 && (
                    <View style={styles.dividerLine} />
                  )}
                </View>
              );
            })}
          </View>
        )}
        <View style={{ height: 20 }}></View>
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  iconButton: {
    backgroundColor: '#59adff',
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    marginLeft: 10,
  },
  datePickerButton: {
    flexDirection: 'row',
    backgroundColor: '#59adff',
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
  calendarIcon: {
    marginLeft: 'auto',
  },
  datePicker: {
    width: 100,
    marginTop: 10,
  },
  whiteContainer: {
    width: '105%',
    backgroundColor: '#f6f6f6',
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
  dividerLine: {
    height: 2,
    width: '100%',
    backgroundColor: 'gray',
    marginVertical: 20,
  },
  groupContainer: {
    width: '100%',
  },
  groupHeader: {
    bottom: 20,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#59adff',
    padding: 10,
    borderRadius: 5,
  },
  tableContainer: {
    width: '100%',
    bottom: 20,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    backgroundColor: '#f6f6f6',
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
    width: '100%',
    borderWidth: 1,
    borderColor: 'black',
    borderRadius: 5,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'black',
  },
  cell: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: 'black',
  },
  columnHeader: {
    backgroundColor: '#59adff',
  },
  columnHeader1: {
    backgroundColor: '#f6f6f6',
  },
  columnValue: {
    backgroundColor: '#f6f6f6',
  },
  headerText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 8,
  },
  headerText1: {
    color: 'black',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 12,
  },
  valueText: {
    fontSize: 10,
  },
  messageText: {
    fontSize: 16,
    color: 'grey',
    textAlign: 'center',
    marginTop: 20,
  },
  dropdownWrapper: {
    flexDirection: 'column',
    width: '50%',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownContainer: {
    width: 350,
    height: 500,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 10,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    marginBottom: 15,
  },
  closeButton: {
    marginTop: 10,
    alignSelf: 'center',
    padding: 10,
    backgroundColor: '#59adff',
    borderRadius: 5,
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  dropdownItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    alignItems: 'center',
    backgroundColor: '#f1f1f1',
  },
  scrollView: {
    maxHeight: 300,
  },
});

export default ReportScreen;