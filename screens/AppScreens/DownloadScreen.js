import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Platform, TouchableOpacity, Modal } from 'react-native';
import { Checkbox } from 'react-native-paper';
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
import CustomAlert from '../AuthScreens/customalert';

export default function DownloadScreen() {
  const [dropdownOptions, setDropdownOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingShiftWise, setLoadingShiftWise] = useState(false);
  const [showSelectAlert, setShowSelectAlert] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState('PDF');
  const [modalVisible, setModalVisible] = useState(false);
  const [showFormatModal, setShowFormatModal] = useState(false);
  const [selectedReports, setSelectedReports] = useState({
    summary: false,
    shiftWise: false,
  });
  const [selectedMachines, setSelectedMachines] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
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

  const toggleReportSelection = (report) => {
    setSelectedReports((prevState) => {
      if (report === 'summary') {
        return { summary: true, shiftWise: false };
      }
      if (report === 'shiftWise') {
        return { summary: false, shiftWise: true };
      }
    });
  };

  const handleDownload = () => {
    if (!selectedReports.summary && !selectedReports.shiftWise) {
      Alert.alert('Missing Selection', 'Please select at least one report type and a machine.');
      return;
    }

    if (selectedReports.summary) {
      handleSummaryReport();
    }
    if (selectedReports.shiftWise) {
      handleButtonPress();
    }
  };

  const fetchDropdownOptions = async () => {
    const isTokenValid = await checkToken();
    if (!isTokenValid) {
      const networkState = await NetInfo.fetch();
      if (networkState.isConnected) {
        navigation.replace('Login');
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

  const toggleMachineSelection = (machine) => {
    setSelectedMachines(prevSelected => {
      const isSelected = prevSelected.some(item => item.value === machine.value);
      const newSelection = isSelected 
        ? prevSelected.filter(item => item.value !== machine.value)
        : [...prevSelected, machine];
  
      return newSelection;
    });
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedMachines([]);
    } else {
      setSelectedMachines(dropdownOptions);
    }
    setSelectAll(!selectAll);
  };


  const handleButtonPress = () => {
    if (!selectedMachines) {
      setShowSelectAlert(true);
    } else {
      setShowSelectAlert(false);
      fetchDataAndGenerateReport();
    }
  };

  const fetchDataAndGenerateReport = async () => {
    if (!selectedMachines || !selectedDate) {
      Alert.alert('Missing Information', 'Please select a machine and date.');
      return;
    }

    setLoadingShiftWise(true);

    try {
      const token = await AsyncStorage.getItem('token');
      const machineIds = selectedMachines.map(machine => machine.value);
      // console.log("Sending machine_id:", machineIds); 
      const response = await axios.post(`${BaseURL}data/hourly-shift-report-select-machine/`, {
        machine_id: machineIds,
        date: selectedDate.toISOString().split('T')[0]
      }, {
        headers: { Authorization: `Token ${token}` }
      });
      // console.log('API Response:', response.data);
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
    const { date, machine_data } = data;
    let pageIndex = 1;

    let reportHtml = `
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
            .page-break { page-break-before: always; } 
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: gray; }
          </style>
        </head>
        <body>
          <h1>Hourly Shift Report</h1>`;

    Object.keys(machine_data).forEach((machineId, machineIndex) => {
        if (machineIndex > 0) reportHtml += `<div class="page-break"></div>`;
        const machineName = machine_data[machineId]?.length > 0 ? machine_data[machineId][0][2] : "Unknown";

        reportHtml += `
          <h2>${machineName} (${machineId}) | Date: ${date}</h2> 
          <table>
            <tr>
              <th>Si. No</th>
              <th>Shift</th>
              <th>Date</th>
              <th>Line</th>
              <th>Time Range</th>
              <th>Production Count</th>
              <th>Target Count</th>
            </tr>`;

        let currentShift = "";
        let shiftTotalProduction = 0;
        let shiftTotalTarget = 0;
        let rowIndex = 1;

        machine_data[machineId].forEach((shift, index) => {
            const [shiftNo, shiftDate, machineName, timeRange, production, target] = shift;

            if (currentShift !== shiftNo && index !== 0) {
                reportHtml += `
                <tr class="total-row">
                  <td colspan="5"><strong>Total for Shift - ${currentShift}</strong></td>
                  <td><strong>${shiftTotalProduction}</strong></td>
                  <td><strong>${shiftTotalTarget}</strong></td>
                </tr>`;
                
                shiftTotalProduction = 0;
                shiftTotalTarget = 0;
            }

            currentShift = shiftNo;
            shiftTotalProduction += parseInt(production, 10);
            shiftTotalTarget += parseInt(target, 10);

            reportHtml += `
            <tr>
              <td>${rowIndex++}</td>
              <td>Shift - ${shiftNo}</td>
              <td>${shiftDate}</td>
              <td>${machineName}</td>
              <td>${timeRange}</td>
              <td>${production}</td>
              <td>${target}</td>
            </tr>`;
        });

        reportHtml += `
            <tr class="total-row">
              <td colspan="5"><strong>Total for Shift - ${currentShift}</strong></td>
              <td><strong>${shiftTotalProduction}</strong></td>
              <td><strong>${shiftTotalTarget}</strong></td>
            </tr>
          </table>`;

        reportHtml += `<div class="footer">${pageIndex}</div>`;
        pageIndex++;
    });

    reportHtml += `</body></html>`;

    return reportHtml;
};


const generateShiftWiseReportCsv = (data) => {
  const { date, machine_data } = data;
  let csvContent = 'Machine Name (ID),Shift,Date,Time Range,Production Count,Target Count,Difference\n';

  Object.keys(machine_data).forEach((machineId) => {
    const shifts = machine_data[machineId];
    let currentShift = "";
    let shiftTotalProduction = 0;
    let shiftTotalTarget = 0;

    shifts.forEach((shift, index) => {
      const [shiftNo, shiftDate, machineName, timeRange, production, target] = shift;

      if (currentShift !== shiftNo && index !== 0) {
        csvContent += `,,Total for Shift ${currentShift},,${shiftTotalProduction},${shiftTotalTarget},${shiftTotalProduction - shiftTotalTarget}\n`;
        shiftTotalProduction = 0;
        shiftTotalTarget = 0;
      }

      shiftTotalProduction += production;
      shiftTotalTarget += target;
      currentShift = shiftNo;

      csvContent += `${machineName} (${machineId}),Shift ${shiftNo},${shiftDate},${timeRange},${production},${target},${production - target}\n`;
    });
    csvContent += `,,Total for Shift ${currentShift},,${shiftTotalProduction},${shiftTotalTarget},${shiftTotalProduction - shiftTotalTarget}\n\n`;
  });

  return csvContent;
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
      // console.log('API Response:', response.data);
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
              <TouchableOpacity onPress={toggleSelectAll} style={styles.selectAllButton}>
                <Text style={styles.selectAllText}>{selectAll ? 'Deselect All' : 'Select All'}</Text>
              </TouchableOpacity>
              <ScrollView
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={false}
              >
               {dropdownOptions.map((option, index) => (
                  <View key={index} style={styles.checkboxContainers}>
                    <Checkbox
                      status={selectedMachines.some(item => item.value === option.value) ? 'checked' : 'unchecked'}
                      onPress={() => toggleMachineSelection(option)}
                    />
                    <Text style={styles.checkboxLabel}>{option.label}</Text>
                  </View>
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
      {Platform.OS === 'ios' && (
          <Modal
            transparent={true}
            visible={showDatePicker}
            animationType="slide"
            onRequestClose={() => setShowDatePicker(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent2}>
                <DateTimePicker
                  testID="dateTimePicker"
                  value={selectedDate}
                  mode="date"
                  display="inline"
                  onChange={handleDateChange}
                  style={styles.datePicker}
                />
                <TouchableOpacity
                  onPress={() => setShowDatePicker(false)}
                  style={styles.closeButton}
                >
                  <Text style={styles.closeButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}
        {Platform.OS === 'android' && showDatePicker && (
          <DateTimePicker
            testID="dateTimePicker"
            value={selectedDate}
            mode="date"
            display="default"
            onChange={handleDateChange}
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
        {selectedMachines.length > 0 && (
          <View style={styles.selectedMachinesContainer}>
            <Text style={styles.selectedMachinesLabel}>Selected Machines:</Text>
            <View style={styles.selectedMachinesList}>
              {selectedMachines.map((machine, index) => (
                <View key={index} style={styles.selectedMachineTag}>
                  <Text style={styles.selectedMachineText}>{machine.label}</Text>
                  <TouchableOpacity onPress={() => toggleMachineSelection(machine)}>
                    <Icon name="close-circle" size={18} color="white" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}
        <View style={styles.checkboxContainer}>
          <View style={styles.checkboxItem}>
            <Checkbox
              status={selectedReports.summary ? 'checked' : 'unchecked'}
              onPress={() => toggleReportSelection('summary')}
            />
            <Text style={styles.checkboxLabel}>Summary Report</Text>
          </View>
          <View style={styles.checkboxItem}>
            <Checkbox
              status={selectedReports.shiftWise ? 'checked' : 'unchecked'}
              onPress={() => toggleReportSelection('shiftWise')}
            />
            <Text style={styles.checkboxLabel}>Shift Wise Report</Text>
          </View>
        </View>

      <View style={styles.buttonContainer}>
        <Button
          title="Download"
          icon={<Icon name="download" size={25} type="font-awesome" style={{ marginRight: 10 }} color="white" />}
          buttonStyle={styles.button}
          onPress={handleDownload}
          loading={loadingSummary || loadingShiftWise}
        />
      </View>
      <CustomAlert
        visible={showSelectAlert}
        onClose={() => setShowSelectAlert(false)}
        message="Please select a machine for generating shift wise report."
      />
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
    width: 250,
    marginTop: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    // alignItems: 'center',
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
  modalContent2: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    marginHorizontal: 20,
    alignItems: 'center',
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
  disabledButton: {
    backgroundColor: '#d3d3d3',
  },
  checkboxContainer: {
    marginVertical: 20,
    width: '85%',
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#f7f7f7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  checkboxLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginLeft: 10,
  },
  checkboxContainers: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 8, 
    paddingHorizontal: 10, 
    backgroundColor: '#f5f5f5', 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: '#ddd', 
    marginVertical: 5, 
    elevation: 2, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.2, 
    shadowRadius: 1.5 
  }, 
  selectAllButton: {
    paddingVertical: 10,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  selectAllText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  selectedMachinesContainer: {
    width: '85%',
    marginTop: 10,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    alignItems: 'flex-start',
  },
  
  selectedMachinesLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  
  selectedMachinesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center'
  },
  
  selectedMachineTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#59adff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  
  selectedMachineText: {
    color: 'white',
    fontSize: 14,
    marginRight: 6,
  },  
});