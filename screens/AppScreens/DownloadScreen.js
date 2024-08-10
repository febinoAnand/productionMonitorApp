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
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingShiftWise, setLoadingShiftWise] = useState(false);

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

  const fetchDataAndGeneratePDF = async () => {
    if (!selectedOption || !selectedDate) {
      Alert.alert('Missing Information', 'Please select a machine and date.');
      return;
    }

    setLoadingShiftWise(true);

    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.post(`${BaseURL}data/hourly-shift-report/`, {
        machine_id: selectedOption.value,
        date: selectedDate.toISOString().split('T')[0]
      }, {
        headers: { Authorization: `Token ${token}` }
      });
      console.log('API Response:', response.data);
      const data = response.data;
      const reportHtml = generateShiftWiseReportHtml(data);

      const { uri } = await Print.printToFileAsync({ html: reportHtml });
      if (Platform.OS === 'ios') {
        await Sharing.shareAsync(uri);
      } else {
        const pdfName = `${FileSystem.documentDirectory}shift_wise_report.pdf`;
        await FileSystem.moveAsync({ from: uri, to: pdfName });
        await Sharing.shareAsync(pdfName);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to fetch data or generate PDF.');
    } finally {
      setLoadingShiftWise(false);
    }
  };

  const generateShiftWiseReportHtml = (data) => {
    const shifts = data.shifts || [];
    const filteredShifts = shifts.filter(shift => shift.timing && Object.keys(shift.timing).length > 0);
  
    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: dodgerblue; color: white; }
            h1 { text-align: center; margin-bottom: 10px; }
            .info { text-align: center; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <h1>Shift Wise Report</h1>
          <div class="info">
            <p>${data.machine_id ? `<strong>Machine:</strong> ${data.machine_id}` : ''}</p>
            <p>${data.date ? `<strong>Date:</strong> ${data.date}` : ''}</p>
          </div>
          ${filteredShifts.length > 0 ? filteredShifts.map((shift) => `
            <h2>Shift: ${shift.shift_name || `Shift ${shift.shift_no}`}</h2>
            <table>
              <tr>
                <th>Time</th>
                <th>Count</th>
              </tr>
              ${Object.entries(shift.timing).map(([time, count]) => `
                <tr>
                  <td>${time}</td>
                  <td>${count}</td>
                </tr>
              `).join('')}
            </table>
          `).join('') : '<p>No shifts available for the selected date and machine.</p>'}
        </body>
      </html>
    `;
    return htmlContent;
  };

  const generateSummaryReportHtml = (data) => {
    if (!data || !data.machine_groups) {
      return '<p>No data available for the summary report.</p>';
    }
    const groupedData = data.machine_groups;

    const shifts = new Set();
    groupedData.forEach(group => {
      group.machines.forEach(machine => {
        machine.shifts.forEach(shift => {
          if (shift.shift_name) {
            shifts.add(shift.shift_name);
          } else if (shift.shift_no) {
            shifts.add(`Shift ${shift.shift_no}`);
          }
        });
      });
    });
  
    const shiftHeaders = Array.from(shifts);
  
    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: dodgerblue; color: white; }
            h1 { text-align: center; margin-bottom: 10px; }
            h2 { margin-top: 20px; }
          </style>
        </head>
        <body>
          <h1>Summary Report</h1>
          ${groupedData.map(group => `
            <h2>Group: ${group.group_name}</h2>
            <table>
              <tr>
                <th>Machine ID</th>
                ${shiftHeaders.map(header => `<th>${header}</th>`).join('')}
                <th>Total Production</th>
              </tr>
              ${group.machines.map(machine => {
                const productionCounts = shiftHeaders.map(header => {
                  const shift = machine.shifts.find(s => s.shift_name === header || `Shift ${s.shift_no}` === header);
                  return shift ? shift.production_count : '0';
                }).join('</td><td>');
  
                const totalProduction = machine.shifts.reduce((total, shift) => total + (shift.production_count || 0), 0);
  
                return `
                  <tr>
                    <td>${machine.machine_id || 'N/A'}</td>
                    <td>${productionCounts}</td>
                    <td>${totalProduction}</td>
                  </tr>
                `;
              }).join('')}
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
    // fetchDataAndGeneratePDF();
  };

  const handleSummaryReport = async () => {
    if (!selectedDate) {
      Alert.alert('Missing Information', 'Please select a date.');
      return;
    }

    setLoadingSummary(true);

    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.post(`${BaseURL}data/production/`, {
        date: selectedDate.toISOString().split('T')[0]
      }, {
        headers: { Authorization: `Token ${token}` }
      });
      console.log('API Response:', response.data);
      const data = response.data;
      const reportHtml = generateSummaryReportHtml(data);

      const { uri } = await Print.printToFileAsync({ html: reportHtml });
      if (Platform.OS === 'ios') {
        await Sharing.shareAsync(uri);
      } else {
        const pdfName = `${FileSystem.documentDirectory}summary_report.pdf`;
        await FileSystem.moveAsync({ from: uri, to: pdfName });
        await Sharing.shareAsync(pdfName);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to fetch data or generate PDF.');
    } finally {
      setLoadingSummary(false);
    }
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
          onPress={handleSummaryReport}
          loading={loadingSummary}
        />
        <View style={{ height: 10 }}></View>
        <Button
          title="SHIFT WISE REPORT"
          icon={<Icon name="download" size={25} type="font-awesome" style={{ marginRight: 10 }} color="white" />}
          buttonStyle={styles.button}
          onPress={fetchDataAndGeneratePDF}
          loading={loadingShiftWise}
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