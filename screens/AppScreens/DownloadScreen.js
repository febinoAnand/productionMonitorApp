import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Platform, TouchableOpacity, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Button } from 'react-native-elements';
import Icon from 'react-native-vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BaseURL } from '../../config/appconfig';
import NetInfo from '@react-native-community/netinfo';

export default function DownloadScreen() {
  const [dropdownOptions, setDropdownOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingShiftWise, setLoadingShiftWise] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [selectedFormat, setSelectedFormat] = useState('PDF');
  const [modalVisible, setModalVisible] = useState(false);
  const [showFormatModal, setShowFormatModal] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    fetchDropdownOptions();
  }, []);

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

  const fetchDropdownOptions = async () => {
    const isTokenValid = await checkToken();
    if (!isTokenValid) {
      const networkState = await NetInfo.fetch();
      if (networkState.isConnected) {
        navigation.navigate('Login');
      }
      return;
    }
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

  

  const fetchDataAndGenerateReport = async () => {
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

      if (selectedFormat === 'PDF') {
        const reportHtml = generateShiftWiseReportHtml(data);
        const { uri } = await Print.printToFileAsync({ html: reportHtml });
        if (Platform.OS === 'ios') {
          await Sharing.shareAsync(uri);
        } else {
          const pdfName = `${FileSystem.documentDirectory}shift_wise_report.pdf`;
          await FileSystem.moveAsync({ from: uri, to: pdfName });
          await Sharing.shareAsync(pdfName);
        }
      } else {
        const csvContent = generateShiftWiseReportCsv(data);
        const csvName = `${FileSystem.documentDirectory}shift_wise_report.csv`;
        await FileSystem.writeAsStringAsync(csvName, csvContent, { encoding: FileSystem.EncodingType.UTF8 });
        await Sharing.shareAsync(csvName);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to fetch data or generate report.');
    } finally {
      setLoadingShiftWise(false);
    }
  };

  const generateShiftWiseReportHtml = (data) => {
    const shifts = data.shifts || [];
    const filteredShifts = shifts.filter(shift => shift.timing && Object.keys(shift.timing).length > 0);
    const grandTotal = filteredShifts.reduce((totals, shift) => {
      const { production, target, difference } = Object.values(shift.timing).reduce((acc, [productionCount, targetCount]) => {
        acc.production += productionCount;
        acc.target += targetCount;
        acc.difference += (productionCount - targetCount);
        return acc;
      }, { production: 0, target: 0, difference: 0 });
  
      return {
        production: totals.production + production,
        target: totals.target + target,
        difference: totals.difference + difference
      };
    }, { production: 0, target: 0, difference: 0 });
  
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
            .total-row { font-weight: bold; background-color: #f0f0f0; }
          </style>
        </head>
        <body>
          <div class="info">
            <p>${data.machine_name ? `<strong>Machine Name:</strong> ${data.machine_name}` : ''}</p>
            <p>${data.date ? `<strong>Date:</strong> ${data.date}` : ''}</p>
          </div>
          <h1>Shift Wise Report</h1>
          ${filteredShifts.length > 0 ? `
            <table>
              <tr>
                <th>Shifts</th>
                <th>Time Range</th>
                <th>Production Count</th>
                <th>Target Count</th>
                <th>Difference</th>
              </tr>
              ${filteredShifts.map((shift) => {
                const shiftName = shift.shift_name || `Shift ${shift.shift_no}`;
                let shiftTotalProductionCount = 0;
                let shiftTotalTargetCount = 0;
                let shiftTotalDifference = 0;

                const rows = Object.entries(shift.timing).map(([time, [productionCount, targetCount]]) => {
                  shiftTotalProductionCount += productionCount;
                  shiftTotalTargetCount += targetCount;
                  const difference = productionCount - targetCount;
                  shiftTotalDifference += difference;
                  
                  return `
                    <tr>
                      ${Object.keys(shift.timing).indexOf(time) === 0 ? `<td rowspan="${Object.keys(shift.timing).length}">${shiftName}</td>` : ''}
                      <td>${time}</td>
                      <td>${productionCount}</td>
                      <td>${targetCount}</td>
                      <td>${difference}</td>
                    </tr>
                  `;
                }).join('');

                return `${rows}
                  <tr class="total-row">
                    <td colspan="2"><strong>${shiftName} Total</strong></td>
                    <td><strong>${shiftTotalProductionCount}</strong></td>
                    <td><strong>${shiftTotalTargetCount}</strong></td>
                    <td><strong>${shiftTotalDifference}</strong></td>
                  </tr>
                `;
              }).join('')}
            </table>
          ` : '<p>No shifts available for the selected date and machine.</p>'}
        </body>
      </html>
    `;
    return htmlContent;
};

const generateShiftWiseReportCsv = (data) => {
  const shifts = data.shifts || [];
  const header = 'Shifts,Time Range,Production Count,Target Count,Difference\n';
  const rows = shifts.flatMap(shift => {
    const timingEntries = Object.entries(shift.timing);
    if (timingEntries.length === 0) return [];  
    const shiftName = shift.shift_name || `Shift ${shift.shift_no}`;
    const shiftRows = timingEntries.map(([time, [productionCount, targetCount]], index) => 
      index === 0
      ? `${shiftName},${time},${productionCount},${targetCount},${productionCount - targetCount}`
      : `,${time},${productionCount},${targetCount},${productionCount - targetCount}`
    );
    const totalProduction = timingEntries.reduce((sum, [, [productionCount]] ) => sum + productionCount, 0);
    const totalTarget = timingEntries.reduce((sum, [, [, targetCount]] ) => sum + targetCount, 0);
    const totalDifference = totalProduction - totalTarget;
    const totalRow = `Total for ${shiftName},,${totalProduction},${totalTarget},${totalDifference}`;
    
    return [...shiftRows, totalRow];
  }).join('\n');
  
  return header + rows;
};

  const handleDropdownSelect = (option) => {
    setSelectedOption(option);
    setModalVisible(false);
  };

  const toggleDropdown = () => {
    setModalVisible(!modalVisible);
  };

  const handleFormatDropdownSelect = (format) => {
    setSelectedFormat(format);
    setShowFormatModal(false);
  };

  const toggleFormatDropdown = () => {
    setShowFormatModal(!showFormatModal);
  };


  const handleDateChange = (event, date) => {
    setShowDatePicker(false);
    if (date) setSelectedDate(date);
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

      if (selectedFormat === 'PDF') {
        const reportHtml = generateSummaryReportHtml(data);
        const { uri } = await Print.printToFileAsync({ html: reportHtml });
        if (Platform.OS === 'ios') {
          await Sharing.shareAsync(uri);
        } else {
          const pdfName = `${FileSystem.documentDirectory}summary_report.pdf`;
          await FileSystem.moveAsync({ from: uri, to: pdfName });
          await Sharing.shareAsync(pdfName);
        }
      } else {
        const csvContent = generateSummaryReportCsv(data);
        const csvName = `${FileSystem.documentDirectory}summary_report.csv`;
        await FileSystem.writeAsStringAsync(csvName, csvContent, { encoding: FileSystem.EncodingType.UTF8 });
        await Sharing.shareAsync(csvName);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to fetch data or generate report.');
    } finally {
      setLoadingSummary(false);
    }
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
                    <td>${machine.machine_name || 'N/A'}</td>
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

  const generateSummaryReportCsv = (data) => {
    const groupedData = data.machine_groups || [];
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
    const header = 'Group,Work Center,' +
      shiftHeaders.join(',') + 
      ',Production Count,Total Production Count\n';
    const rows = groupedData.flatMap(group => {
      const groupTotalProduction = group.machines.reduce((total, machine) => {
        return total + machine.shifts.reduce((shiftTotal, shift) => shiftTotal + (shift.total_shift_production_count || 0), 0);
      }, 0);
  
      return group.machines.map((machine, index) => {
        const productionCounts = shiftHeaders.map(header => {
          const shift = machine.shifts.find(s => s.shift_name === header || `Shift ${s.shift_no}` === header);
          return shift ? shift.total_shift_production_count : '0';
        }).join(',');
  
        const totalProduction = machine.shifts.reduce((total, shift) => total + (shift.total_shift_production_count || 0), 0);
        const groupName = index === 0 ? group.group_name : '';
        const groupTotal = index === 0 ? groupTotalProduction : '';
  
        return `${groupName},${machine.machine_name || 'N/A'},${productionCounts},${totalProduction}${groupTotal ? `,${groupTotal}` : ''}`;
      });
    }).join('\n');
  
    return header + rows;
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
        <Modal
          transparent={true}
          animationType="slide"
          visible={modalVisible}
          onRequestClose={toggleDropdown}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
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
        <TouchableOpacity style={styles.datePickerButton} onPress={() => setShowDatePicker(true)}>
          <Text style={styles.datePickerText}>{selectedDate.toDateString()}</Text>
          <Icon name="calendar" size={20} color="white" style={styles.calendarIcon} />
        </TouchableOpacity>
      </View>
      {showDatePicker && (
        <DateTimePicker
          testID="dateTimePicker"
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          style={styles.datePicker}
        />
      )}
      <View style={styles.inputContainer}>
      <TouchableOpacity style={styles.datePickerButton} onPress={toggleFormatDropdown}>
          <Text style={styles.datePickerText}>{selectedFormat}</Text>
          <Icon name="caret-down" size={20} color="white" style={styles.calendarIcon} />
        </TouchableOpacity>
        <Modal transparent={true} animationType="slide" visible={showFormatModal} onRequestClose={toggleFormatDropdown}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent1}>
              <Text style={styles.modalTitle}>Select Format</Text>
              <TouchableOpacity style={styles.dropdownItem} onPress={() => handleFormatDropdownSelect('PDF')}>
                <Text>PDF</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dropdownItem} onPress={() => handleFormatDropdownSelect('CSV')}>
                <Text>CSV</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={toggleFormatDropdown} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        </View>
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
          onPress={fetchDataAndGenerateReport}
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
    backgroundColor: '#f1f1f1',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
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
    width: 350,
    height: 500,
    backgroundColor: '#f1f1f1',
    borderRadius: 10,
    padding: 10,
    elevation: 5,
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
  // dropdownContainer: {
  //   position: 'absolute',
  //   width: '60%',
  //   maxHeight: 200,
  //   top: '100%',
  //   left: 0,
  //   right: 0,
  //   backgroundColor: 'white',
  //   borderWidth: 1,
  //   borderColor: '#ccc',
  //   borderRadius: 5,
  //   zIndex: 1,
  // },
  dropdownContainer1: {
    position: 'absolute',
    width: '50%',
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
    alignItems: 'center',
    backgroundColor: '#f1f1f1',
  },
  inputContainer: {
    position: 'relative',
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: 350,
    height: 500,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
  },
  modalContent1: {
    width: 250,
    height: 200,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
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
});