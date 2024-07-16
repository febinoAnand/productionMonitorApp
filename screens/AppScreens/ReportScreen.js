import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import DatePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/Ionicons';

export default function ReportScreen() {
  const [selectedOption, setSelectedOption] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownOptions, setDropdownOptions] = useState([
    { label: 'Machine 1', value: 'Machine 1' },
    { label: 'Machine 2', value: 'Machine 2' },
    { label: 'Machine 3', value: 'Machine 3' },
  ]);

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
    setShowDropdown(false);
  };

  const handleSearch = () => {
    console.log('Search button pressed');
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
        <View style={styles.shiftHeader}>
          <Text style={styles.shiftHeaderText}>SHIFT 1</Text>
        </View>
        <View style={styles.tableContainer1}>
          <View style={styles.row}>
            <View style={[styles.cell, styles.columnHeader, { backgroundColor: 'dodgerblue' }]}>
              <Text style={{ color: '#fff' }}>TIME</Text>
            </View>
            <View style={[styles.cell, styles.columnHeader, { backgroundColor: 'dodgerblue' }]}>
              <Text style={{ color: '#fff' }}>PRODUCTION COUNT ACTUAL</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={[styles.cell, styles.columnValue]}>
              <Text>Value A1</Text>
            </View>
            <View style={[styles.cell, styles.columnValue]}>
              <Text>Value B1</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={[styles.cell, styles.columnValue]}>
              <Text>Value A2</Text>
            </View>
            <View style={[styles.cell, styles.columnValue]}>
              <Text></Text>
            </View>
          </View>
        </View>
        <View style={styles.shiftHeader}>
          <Text style={styles.shiftHeaderText}>SHIFT 2</Text>
        </View>
        <View style={styles.tableContainer1}>
          <View style={styles.row}>
            <View style={[styles.cell, styles.columnHeader, { backgroundColor: 'dodgerblue' }]}>
              <Text style={{ color: '#fff' }}>TIME</Text>
            </View>
            <View style={[styles.cell, styles.columnHeader, { backgroundColor: 'dodgerblue' }]}>
              <Text style={{ color: '#fff' }}>PRODUCTION COUNT ACTUAL</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={[styles.cell, styles.columnValue]}>
              <Text>Value A1</Text>
            </View>
            <View style={[styles.cell, styles.columnValue]}>
              <Text>Value B1</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={[styles.cell, styles.columnValue]}>
              <Text>Value A2</Text>
            </View>
            <View style={[styles.cell, styles.columnValue]}>
              <Text></Text>
            </View>
          </View>
        </View>
        <View style={styles.shiftHeader}>
          <Text style={styles.shiftHeaderText}>SHIFT 3</Text>
        </View>
        <View style={styles.tableContainer1}>
          <View style={styles.row}>
            <View style={[styles.cell, styles.columnHeader, { backgroundColor: 'dodgerblue' }]}>
              <Text style={{ color: '#fff' }}>TIME</Text>
            </View>
            <View style={[styles.cell, styles.columnHeader, { backgroundColor: 'dodgerblue' }]}>
              <Text style={{ color: '#fff' }}>PRODUCTION COUNT ACTUAL</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={[styles.cell, styles.columnValue]}>
              <Text>Value A1</Text>
            </View>
            <View style={[styles.cell, styles.columnValue]}>
              <Text>Value B1</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={[styles.cell, styles.columnValue]}>
              <Text>Value A2</Text>
            </View>
            <View style={[styles.cell, styles.columnValue]}>
              <Text></Text>
            </View>
          </View>
        </View>
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
  searchInput: {
    flex: 1,
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    paddingHorizontal: 10,
    marginRight: 10,
    backgroundColor: 'white',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.1,
    shadowRadius: 5.84,
    elevation: 8,
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
});