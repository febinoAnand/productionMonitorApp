import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import DatePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BaseURL } from '../../config/appconfig';

const ReportScreen = () => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownOptions, setDropdownOptions] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [selectedShift, setSelectedShift] = useState(null);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [searchResults, setSearchResults] = useState([]);

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

        const shiftResponse = await axios.get(`${BaseURL}data/production-monitor/`, {
          headers: { Authorization: `Token ${token}` }
        });
        const shiftData = shiftResponse.data.shift_wise_data;
        setShifts(shiftData);
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

    const filteredShifts = shifts.filter(shift => {
      const shiftDate = new Date(shift.shift_date).toISOString().split('T')[0];
      return shiftDate === selectedDateString;
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

    if (filteredShifts.length === 0) {
      setSearchResults([]);
      console.log('Search results:', filteredShifts);
    } else {
      setSearchResults(filteredShifts);
    }
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
          searchResults.map((shift, shiftIndex) => (
            <View key={shiftIndex} style={styles.groupContainer}>
              <Text style={styles.groupHeader}>{shift.shift_name}</Text>
              <View style={styles.tableContainer}>
                <ScrollView horizontal>
                  <View style={styles.table}>
                    <View style={[styles.row, styles.headerRow]}>
                      <View style={[styles.cell, styles.columnHeader, { width: 80 }]}>
                        <Text style={styles.headerText}>Si.No</Text>
                      </View>
                      <View style={[styles.cell, styles.columnHeader, { width: 160 }]}>
                        <Text style={styles.headerText}>Work Center</Text>
                      </View>
                      <View style={[styles.cell, styles.columnHeader, { width: 170 }]}>
                        <Text style={styles.headerText}>Shift Start</Text>
                      </View>
                      <View style={[styles.cell, styles.columnHeader, { width: 170 }]}>
                        <Text style={styles.headerText}>Shift End</Text>
                      </View>
                      <View style={[styles.cell, styles.columnHeader, { width: 170 }]}>
                        <Text style={styles.headerText}>Production Count</Text>
                      </View>
                    </View>
                    {shift.groups.map((group, groupIndex) => (
                      group.machines.map((machine, machineIndex) => (
                        <View key={machineIndex} style={styles.row}>
                          <View style={[styles.cell, styles.columnValue, { width: 80 }]}>
                            <Text>{machineIndex + 1}</Text>
                          </View>
                          <View style={[styles.cell, styles.columnValue, { width: 160 }]}>
                            <Text>{machine.machine_name}</Text>
                          </View>
                          <View style={[styles.cell, styles.columnValue, { width: 170 }]}>
                            <Text>{shift.shift_start_time}</Text>
                          </View>
                          <View style={[styles.cell, styles.columnValue, { width: 170 }]}>
                            <Text>{shift.shift_end_time}</Text>
                          </View>
                          <View style={[styles.cell, styles.columnValue, { width: 170 }]}>
                            <Text>{machine.production_count}</Text>
                          </View>
                        </View>
                      ))
                    ))}
                  </View>
                </ScrollView>
              </View>
            </View>
          ))
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