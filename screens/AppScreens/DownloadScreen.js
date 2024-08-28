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
  
    // Calculate grand totals for production and actual counts
    const grandTotal = filteredShifts.reduce((totals, shift) => {
      const { production, actual } = Object.values(shift.timing).reduce((acc, [productionCount, actualCount]) => {
        acc.production += productionCount;
        acc.actual += actualCount;
        return acc;
      }, { production: 0, actual: 0 });
  
      return {
        production: totals.production + production,
        actual: totals.actual + actual
      };
    }, { production: 0, actual: 0 });
  
    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #59adff; color: white; }
            h1 { text-align: center; margin-bottom: 10px; }
            .info { display: flex; justify-content: space-between; margin-bottom: 20px; }
            .info p { margin: 0; }
          </style>
        </head>
        <body>
          <div class="info">
            <p>${data.machine_id ? `<strong>Machine ID:</strong> ${data.machine_id}` : ''}</p>
            <p>${data.date ? `<strong>Date:</strong> ${data.date}` : ''}</p>
          </div>
          <h1>Shift Wise Report</h1>
          ${filteredShifts.length > 0 ? `
            <table>
              <tr>
                <th>Shifts</th>
                <th>Time Range</th>
                <th>Production Count / Actual Count</th>
                <th>Total Production Count</th>
              </tr>
              ${filteredShifts.map((shift) => {
                const shiftName = shift.shift_name || `Shift ${shift.shift_no}`;
                const totalProductionCount = Object.values(shift.timing).reduce((total, [productionCount]) => total + productionCount, 0);
                const totalActualCount = Object.values(shift.timing).reduce((total, [, actualCount]) => total + actualCount, 0);
  
                return Object.entries(shift.timing).map(([time, [productionCount, actualCount]]) => `
                  <tr>
                    ${Object.keys(shift.timing).indexOf(time) === 0 ? `<td rowspan="${Object.keys(shift.timing).length}">${shiftName}</td>` : ''}
                    <td>${time}</td>
                    <td>${productionCount}/${actualCount}</td>
                    ${Object.keys(shift.timing).indexOf(time) === 0 ? `<td rowspan="${Object.keys(shift.timing).length}">${totalProductionCount}/${totalActualCount}</td>` : ''}
                  </tr>
                `).join('');
              }).join('')}
              <tr>
                <td colspan="3"><strong>Grand Total</strong></td>
                <td><strong>${grandTotal.production}/${grandTotal.actual}</strong></td>
              </tr>
            </table>
          ` : '<p>No shifts available for the selected date and machine.</p>'}
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
    const reportDate = data.date;
  
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
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #59adff; color: white; }
            h1 { text-align: center; margin-bottom: 10px; }
            .info { display: flex; justify-content: space-between; margin-bottom: 20px; }
            .group-row { font-weight: bold; background-color: #f4f4f4; }
          </style>
        </head>
        <body>
          <div class="info">
            <div><strong>Date:</strong> ${reportDate || 'N/A'}</div>
          </div>
          <h1>Summary Report</h1>
          <table>
            <tr>
              <th>Group</th>
              <th>Work Center</th>
              ${shiftHeaders.map(header => `<th>${header}</th>`).join('')}
              <th>Production Count</th>
              <th>Total Production Count</th>
            </tr>
            ${groupedData.flatMap(group => {
              const groupTotalProduction = group.machines.reduce((total, machine) => {
                return total + machine.shifts.reduce((shiftTotal, shift) => shiftTotal + (shift.total_shift_production_count || 0), 0);
              }, 0);
  
              return group.machines.map(machine => {
                const productionCounts = shiftHeaders.map(header => {
                  const shift = machine.shifts.find(s => s.shift_name === header || `Shift ${s.shift_no}` === header);
                  return shift ? shift.total_shift_production_count : '0';
                }).join('</td><td>');
  
                const totalProduction = machine.shifts.reduce((total, shift) => total + (shift.total_shift_production_count || 0), 0);
  
                return `
                  <tr>
                    ${machine === group.machines[0] ? `<td rowspan="${group.machines.length}" class="group-row">${group.group_name}</td>` : ''}
                    <td>${machine.machine_id || 'N/A'}</td>
                    <td>${productionCounts}</td>
                    <td>${totalProduction}</td>
                    ${machine === group.machines[0] ? `<td rowspan="${group.machines.length}" class="group-row">${groupTotalProduction}</td>` : ''}
                  </tr>
                `;
              });
            }).join('')}
          </table>
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
  datePicker: {
    width: 100,
    marginTop: 10,
  },
  iconButton: {
    backgroundColor: '#59adff',
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
    backgroundColor: '#59adff',
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