import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Platform, TouchableOpacity } from 'react-native';
import { Button } from 'react-native-elements';
import Icon from 'react-native-vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BaseURL } from '../../config/appconfig';

export default function DownloadScreen() {
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownOptions, setDropdownOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    fetchDropdownOptions();
  }, []);

  const fetchDropdownOptions = async () => {
    try {
      const response = await axios.get(`${BaseURL}devices/machine/`);
      const machines = response.data;
      const options = machines.map(machine => ({
        label: machine.machine_name,
        value: machine.machine_id,
      }));
      setDropdownOptions(options);
    } catch (error) {
      console.error('Error fetching dropdown options:', error);
      Alert.alert('Error', 'Failed to fetch dropdown options.');
    }
  };

  const fetchDataAndGeneratePDF = async (isSummaryReport = true) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${BaseURL}data/production-monitor/`, {
        headers: { Authorization: `Token ${token}` }
      });

      const data = response.data;
      const reportHtml = isSummaryReport ? generateSummaryReportHtml(data) : generateShiftWiseReportHtml(data);

      const { uri } = await Print.printToFileAsync({ html: reportHtml });
      if (Platform.OS === 'ios') {
        await Sharing.shareAsync(uri);
      } else {
        const pdfName = `${FileSystem.documentDirectory}${isSummaryReport ? 'summary_report.pdf' : 'shift_wise_report.pdf'}`;
        await FileSystem.moveAsync({ from: uri, to: pdfName });
        await Sharing.shareAsync(pdfName);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to fetch data or generate PDF.');
    }
  };

  const generateSummaryReportHtml = (data) => {
    const groupedData = data.shift_wise_data.reduce((acc, shift) => {
        shift.groups.forEach(group => {
            if (!acc[group.group_name]) {
                acc[group.group_name] = [];
            }
            acc[group.group_name].push({
                shift_date: shift.shift_date,
                shift_start_time: shift.shift_start_time,
                shift_end_time: shift.shift_end_time,
                shift_name: shift.shift_name || null,
                shift_number: shift.shift_number,
                machines: group.machines
            });
        });
        return acc;
    }, {});

    const shiftHeaders = new Set();
    Object.values(groupedData).forEach(shifts => {
        shifts.forEach(shift => {
            if (shift.shift_name && shift.shift_name !== '0') {
                shiftHeaders.add(shift.shift_name);
            } 
            if (shift.shift_number && shift.shift_number !== '0') {
                shiftHeaders.add(`Shift ${shift.shift_number}`);
            }
        });
    });

    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: dodgerblue; color: white; }
            h1 { text-align: center; }
            h2 { margin-top: 20px; }
          </style>
        </head>
        <body>
          <h1>Summary Report</h1>
          ${Object.keys(groupedData).map(groupName => {
            return `
              <h2>Group: ${groupName}</h2>
              <table>
                <tr>
                  <th>SI. No.</th>
                  <th>Machine Name</th>
                  ${Array.from(shiftHeaders).map(header => `<th>${header}</th>`).join('')}
                </tr>
                ${groupedData[groupName].flatMap((shift, shiftIndex) => 
                  shift.machines.map((machine, machineIndex) => `
                    <tr>
                      <td>${machineIndex + 1}</td>
                      <td>${machine.machine_name}</td>
                      ${Array.from(shiftHeaders).map(header => {
                          const shiftData = shift.shift_name === header || `Shift ${shift.shift_number}` === header ? 'Data Available' : '';
                          return `<td>${shiftData}</td>`;
                      }).join('')}
                    </tr>
                  `)
                ).join('')}
              </table>
            `;
          }).join('')}
        </body>
      </html>
    `;
  
    return htmlContent;
};

  const generateShiftWiseReportHtml = (data) => {
    const shiftsGroupedByShiftName = data.shift_wise_data.reduce((acc, shift) => {
      if (!acc[shift.shift_name]) {
        acc[shift.shift_name] = [];
      }
      acc[shift.shift_name].push(shift);
      return acc;
    }, {});

    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: dodgerblue; color: white; }
            h1 { text-align: center; margin-bottom: 20px; }
            h2 { margin-bottom: 10px; }
          </style>
        </head>
        <body>
          <h1>Shift Wise Report</h1>
          ${Object.keys(shiftsGroupedByShiftName).map(shiftName => `
            <h2>${shiftName}</h2>
            <table>
              <tr>
                <th>Date</th>
                <th>Work Center</th>
                <th>Shift Start</th>
                <th>Shift End</th>
                <th>Production Count</th>
              </tr>
              ${shiftsGroupedByShiftName[shiftName].map((shift, shiftIndex) => `
                ${shift.groups.map((group, groupIndex) => `
                  ${group.machines.map((machine, machineIndex) => `
                    <tr>
                      <td>${shift.shift_date}</td>
                      <td>${machine.machine_name}</td>
                      <td>${shift.shift_start_time}</td>
                      <td>${shift.shift_end_time}</td>
                      <td>${machine.production_count}</td>
                    </tr>
                  `).join('')}
                `).join('')}
              `).join('')}
            </table>
          `).join('')}
        </body>
      </html>
    `;

    return htmlContent;
  };

  const handleDropdownSelect = (option) => {
    setSelectedOption(option);
    setShowDropdown(false);
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const handleDateChange = (event, date) => {
    setShowDatePicker(false);
    if (date) setSelectedDate(date);
  };

  const handleSearch = () => {
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.inputContainer}>
        <TouchableOpacity
          style={styles.datePickerButton}
          onPress={toggleDropdown}
        >
          <Text style={styles.datePickerText}>{selectedOption ? selectedOption.label : 'Select Machine'}</Text>
          <Icon name="caret-down" size={20} color="white" style={styles.calendarIcon} />
        </TouchableOpacity>
        {showDropdown && (
          <ScrollView style={styles.dropdownContainer}>
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
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
          style={styles.datePicker}
        />
      )}
      <View style={{ height: 100 }}></View>
      <View style={styles.buttonContainer}>
      <Button
        title="SUMMARY REPORT"
        icon={<Icon name="download" size={25} type="font-awesome" style={{ marginRight: 10 }} color="white" />}
        buttonStyle={styles.button}
        onPress={() => fetchDataAndGeneratePDF(true)}
      />
      <View style={{ height: 10 }}></View>
      <Button
        title="SHIFT WISE REPORT"
        icon={<Icon name="download" size={25} type="font-awesome" style={{ marginRight: 10 }} color="white" />}
        buttonStyle={styles.button}
        onPress={() => fetchDataAndGeneratePDF(false)}
      />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: 'ghostwhite',
    paddingVertical: 20,
  },
  dateContainer: {
    width: '90%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
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
  datePicker: {
    width: 100,
    marginTop: 10,
  },
  iconButton: {
    backgroundColor: 'dodgerblue',
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    marginLeft: 10,
  },
  dropdownContainer: {
    position: 'absolute',
    width: '60%',
    maxHeight: 200,
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
    alignItems: 'center'
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  calendarIcon: {
    marginLeft: 'auto',
  },
  label: {
    fontSize: 16,
    marginBottom: 10,
    color: 'black',
  },
  button: {
    backgroundColor: 'dodgerblue',
    borderRadius: 50,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },
});