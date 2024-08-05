import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import DatePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BaseURL } from '../../config/appconfig';
import { useFocusEffect } from '@react-navigation/native';

const hardCodedShifts = [
  {
    shift_name: 'Shift 1',
    shift_number: 1,
    time_slots: [
      { start_time: '06:30 AM', end_time: '07:30 AM' },
      { start_time: '07:30 AM', end_time: '08:30 AM' },
      { start_time: '08:30 AM', end_time: '09:30 AM' },
      { start_time: '09:30 AM', end_time: '10:30 AM' },
      { start_time: '10:30 AM', end_time: '11:30 AM' },
      { start_time: '11:30 AM', end_time: '12:30 PM' },
      { start_time: '12:30 PM', end_time: '01:30 PM' },
      { start_time: '01:30 PM', end_time: '02:30 PM' },
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
      { start_time: '02:30 PM', end_time: '03:30 PM' },
      { start_time: '03:30 PM', end_time: '04:30 PM' },
      { start_time: '04:30 PM', end_time: '05:30 PM' },
      { start_time: '05:30 PM', end_time: '06:30 PM' },
      { start_time: '06:30 PM', end_time: '07:30 PM' },
      { start_time: '07:30 PM', end_time: '08:30 PM' },
      { start_time: '08:30 PM', end_time: '09:30 PM' },
      { start_time: '09:30 PM', end_time: '10:30 PM' },
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
      { start_time: '10:30 PM', end_time: '11:30 PM' },
      { start_time: '11:30 PM', end_time: '12:30 AM' },
      { start_time: '12:30 AM', end_time: '01:30 AM' },
      { start_time: '01:30 AM', end_time: '02:30 AM' },
      { start_time: '02:30 AM', end_time: '03:30 AM' },
      { start_time: '03:30 AM', end_time: '04:30 AM' },
      { start_time: '04:30 AM', end_time: '05:30 AM' },
      { start_time: '05:30 AM', end_time: '06:30 AM' },
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const machineResponse = await axios.get(`${BaseURL}devices/machine/`, {
          headers: { Authorization: `Token ${token}` }
        });
        const machineData = machineResponse.data;

        const machineOptions = machineData.map(machine => ({
          label: machine.machine_name,
          value: machine.machine_name,
        }));

        setDropdownOptions(machineOptions);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    setSearchResults(hardCodedShifts);
  }, []);

  const handleDateChange = (event, date) => {
    if (date !== undefined) {
      setSelectedDate(date);
      setShowDatePicker(false);
      console.log('Selected date:', date);
    } else {
      setShowDatePicker(false);
    }
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const handleDropdownSelect = (option) => {
    setSelectedOption(option);
    setSelectedMachine(option.value);
    setShowDropdown(false);
  };

  const handleSearch = () => {
    if (!selectedMachine || !selectedDate) {
      console.log('Please select both machine and date');
      return;
    }

    const selectedDateString = selectedDate.toISOString().split('T')[0];

    const filteredShifts = hardCodedShifts.filter(shift => {
      return true;
    }).map(shift => {
      const filteredGroups = shift.groups.map(group => {
        const filteredMachines = group.machines.filter(machine => machine.machine_name === selectedMachine);
        return {
          ...group,
          machines: filteredMachines,
        };
      }).filter(group => group.machines.length > 0);

      return {
        ...shift,
        groups: filteredGroups,
      };
    }).filter(shift => shift.groups.length > 0);

    setSearchResults(filteredShifts);
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
    return shift.time_slots.length * 0;
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
            <Icon name="caret-down" size={20} color="white" style={styles.calendarIcon} />
          </TouchableOpacity>
          {showDropdown && (
            <View style={styles.dropdownContainer}>
              {dropdownOptions.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.dropdownItem}
                  onPress={() => handleDropdownSelect(option)}
                >
                  <Text>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          <TouchableOpacity style={styles.datePickerButton} onPress={() => setShowDatePicker(true)}>
            <Text style={styles.datePickerText}>{selectedDate.toDateString()}</Text>
            <Icon name="calendar" size={20} color="white" style={styles.calendarIcon} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={handleSearch}>
            <Icon name="search" size={20} color="white" />
          </TouchableOpacity>
        </View>
        {showDatePicker && (
          <DatePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={handleDateChange}
            style={styles.datePicker}
          />
        )}
        {searchResults.length === 0 ? (
          <Text style={styles.messageText}>No data available.</Text>
        ) : (
          searchResults.map((shift, shiftIndex) => {
            const shiftTotalCount = calculateShiftTotalCount(shift);
            return (
              <View key={shiftIndex} style={styles.groupContainer}>
                <View style={{ height: 20 }}></View>
                <Text style={styles.groupHeader}>{shift.shift_name || `Shift ${shift.shift_number}`}</Text>
                <View style={styles.tableContainer}>
                  <View style={styles.table}>
                    <View style={styles.row}>
                      <View style={[styles.cell, styles.columnHeader, { width: 170 }]}>
                        <Text style={styles.headerText}>Time</Text>
                      </View>
                      <View style={[styles.cell, styles.columnHeader, { width: 170 }]}>
                        <Text style={styles.headerText}>Production Count Actual</Text>
                      </View>
                    </View>
                    {shift.time_slots.map((slot, index) => (
                      <View key={index} style={styles.row}>
                        <View style={[styles.cell, styles.columnValue, { width: 170 }]}>
                          <Text>{`${slot.start_time} - ${slot.end_time}`}</Text>
                        </View>
                        <View style={[styles.cell, styles.columnValue, { width: 170 }]}>
                          <Text>0</Text>
                        </View>
                      </View>
                    ))}
                    <View style={styles.row}>
                      <View style={[styles.cell, styles.columnHeader, { width: 170 }]}>
                        <Text style={styles.headerText}>Total</Text>
                      </View>
                      <View style={[styles.cell, styles.columnHeader, { width: 170 }]}>
                        <Text style={styles.headerText}>{shiftTotalCount}</Text>
                      </View>
                    </View>
                  </View>
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  iconButton: {
    backgroundColor: 'dodgerblue',
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    marginLeft: 10,
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
  calendarIcon: {
    marginLeft: 'auto',
  },
  datePicker: {
    width: 100,
    marginTop: 10,
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
  dropdownContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    zIndex: 1,
  },
  dropdownItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
});

export default ReportScreen;