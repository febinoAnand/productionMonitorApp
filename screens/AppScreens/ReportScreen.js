import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import DatePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import { BaseURL } from '../../config/appconfig';

export default function ReportScreen() {
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
    axios.get(`${BaseURL}devices/machine/`)
      .then(response => {
        const machineData = response.data;

        const machineOptions = machineData.map(machine => ({
          label: machine.machine_name,
          value: machine.machine_name,
        }));

        setDropdownOptions(machineOptions);
      })
      .catch(error => {
        console.error('Error fetching machine data:', error);
      });

    axios.get(`${BaseURL}data/production-monitor/`)
      .then(response => {
        const shiftData = response.data.shift_wise_data;
        setShifts(shiftData);
      })
      .catch(error => {
        console.error('Error fetching shift data:', error);
      });
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
        {searchResults.length === 0 && (
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataText}>No data available for the selected date and machine.</Text>
          </View>
        )}
        {searchResults.length > 0 && (
          <>
            {searchResults.map((shift, shiftIndex) => (
              <View key={shiftIndex} style={styles.shiftContainer}>
                <View style={styles.shiftHeader}>
                  <Text style={styles.shiftHeaderText}>{shift.shift_name}</Text>
                </View>
                <View style={styles.tableContainer1}>
                  <View style={styles.row}>
                    <View style={[styles.cell, styles.columnHeader, { backgroundColor: 'dodgerblue' }]}>
                      <Text style={{ color: '#fff' }}>GROUP NAME</Text>
                    </View>
                    <View style={[styles.cell, styles.columnHeader, { backgroundColor: 'dodgerblue' }]}>
                      <Text style={{ color: '#fff' }}>START TIME</Text>
                    </View>
                    <View style={[styles.cell, styles.columnHeader, { backgroundColor: 'dodgerblue' }]}>
                      <Text style={{ color: '#fff' }}>END TIME</Text>
                    </View>
                    <View style={[styles.cell, styles.columnHeader, { backgroundColor: 'dodgerblue' }]}>
                      <Text style={{ color: '#fff' }}>PRODUCTION COUNT ACTUAL</Text>
                    </View>
                  </View>
                  {shift.groups.map((group, groupIndex) => (
                    group.machines.map((machine, machineIndex) => (
                      <View key={`${groupIndex}-${machineIndex}`} style={styles.row}>
                        <View style={[styles.cell, styles.columnValue]}>
                          <Text>{group.group_name}</Text>
                        </View>
                        <View style={[styles.cell, styles.columnValue]}>
                          <Text>{shift.shift_start_time}</Text>
                        </View>
                        <View style={[styles.cell, styles.columnValue]}>
                          <Text>{shift.shift_end_time}</Text>
                        </View>
                        <View style={[styles.cell, styles.columnValue]}>
                          <Text>{machine.production_count}</Text>
                        </View>
                      </View>
                    ))
                  ))}
                </View>
              </View>
            ))}
          </>
        )}
      </View>
    </ScrollView>
  );
}

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
    marginRight: 10,
  },
  calendarIcon: {
    marginLeft: 'auto',
  },
  datePicker: {
    width: 100,
    marginTop: 10,
  },
  shiftContainer: {
    width: '100%',
    marginBottom: 20,
  },
  shiftHeader: {
    width: '100%',
    alignItems: 'flex-start',
    marginTop: 20,
  },
  shiftHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'dodgerblue',
  },
  tableContainer1: {
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
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.1,
    shadowRadius: 5.84,
    elevation: 8,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  cell: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  columnHeader: {
    justifyContent: 'center',
    alignItems: 'flex-start',
    borderRightWidth: 1,
    borderRightColor: '#ccc',
  },
  columnValue: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  dropdownContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ccc',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.1,
    shadowRadius: 5.84,
    elevation: 8,
    zIndex: 100,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  noDataContainer: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  noDataText: {
    fontSize: 16,
    color: 'gray',
  },
});