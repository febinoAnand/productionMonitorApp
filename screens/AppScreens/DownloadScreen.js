import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { CheckBox, Button } from 'react-native-elements';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import axios from 'axios';
import { BaseURL } from '../../config/appconfig';

const fetchMachines = async () => {
  try {
    const response = await axios.get(`${BaseURL}devices/machine/`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch machines:', error);
    return [];
  }
};

const fetchProductionData = async (machineIds, fromDate, toDate) => {
  try {
    const response = await axios.post(`${BaseURL}data/table-report/`, {
      machine_ids: machineIds,
      from_date: fromDate.toISOString().split('T')[0],
      to_date: toDate.toISOString().split('T')[0],
    });
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch production data:', error);
    return {};
  }
};

const convertToCSV = (data) => {
  if (!data || !data.machines || !Array.isArray(data.machines)) {
    return '';
  }

  let str = 'Date/Time,,Count,Target,Total\n';

  data.machines.forEach(machine => {
    str += `Machine ID: ${machine.machine_id}\n`;
    str += 'Shift,Date,From Time,To Time,Count,Target,Total\n';
    machine.shifts.forEach(shift => {
      str += `${shift.shift_name},${shift.date},${shift.shift_start_time},${shift.shift_end_time},${shift.production_count},${shift.target_production},${shift.total}\n`;
    });
    str += '\n';
  });

  return str;
};

const saveCSVToFile = async (csvData, fileName) => {
  const fileUri = `${FileSystem.documentDirectory}${fileName}.csv`;

  try {
    await FileSystem.writeAsStringAsync(fileUri, csvData);
    Alert.alert(
      'Success',
      `CSV file has been saved to ${fileUri}`,
      [
        {
          text: 'Share',
          onPress: async () => {
            try {
              await Sharing.shareAsync(fileUri);
            } catch (error) {
              Alert.alert('Error', 'Failed to share CSV file');
            }
          },
        },
        { text: 'OK' },
      ]
    );
  } catch (error) {
    Alert.alert('Error', 'Failed to save CSV file');
  }
};

const generatePDF = async (data) => {
  if (!data || !data.machines || !Array.isArray(data.machines)) {
    Alert.alert('Error', 'No valid data available for generating PDF');
    return;
  }

  const htmlContent = `
    <h1>Production Report</h1>
    ${data.machines.map(machine => `
      <h2>Machine ID: ${machine.machine_id}</h2>
      <table border="1" style="width:100%; border-collapse: collapse;">
        <thead>
          <tr>
            <th rowspan="2">Shift</th>
            <th colspan="3">Date/Time</th>
            <th colspan="3">${machine.machine_id}</th>
          </tr>
          <tr>
            <th>Date</th>
            <th>From Time</th>
            <th>To Time</th>
            <th>Count</th>
            <th>Target</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${machine.shifts.map(shift => `
            <tr>
              <td>${shift.shift_name}</td>
              <td>${shift.date}</td>
              <td>${shift.shift_start_time}</td>
              <td>${shift.shift_end_time}</td>
              <td>${shift.production_count}</td>
              <td>${shift.target_production}</td>
              <td>${shift.total}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <br/>
    `).join('')}
  `;

  try {
    const { uri } = await Print.printToFileAsync({ html: htmlContent });
    Alert.alert(
      'Success',
      `PDF file has been saved to ${uri}`,
      [
        {
          text: 'Share',
          onPress: async () => {
            try {
              await Sharing.shareAsync(uri);
            } catch (error) {
              Alert.alert('Error', 'Failed to share PDF file');
            }
          },
        },
        { text: 'OK' },
      ]
    );
  } catch (error) {
    Alert.alert('Error', 'Failed to generate and share PDF');
  }
};

export default function DownloadScreen() {
  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(new Date());
  const [showFromDate, setShowFromDate] = useState(false);
  const [showToDate, setShowToDate] = useState(false);
  const [machines, setMachines] = useState([]);
  const [selectedMachines, setSelectedMachines] = useState({});

  useEffect(() => {
    const loadMachines = async () => {
      const machinesList = await fetchMachines();
      setMachines(machinesList);
      const initialSelection = machinesList.reduce((acc, machine) => {
        acc[machine.id] = false;
        return acc;
      }, {});
      setSelectedMachines(initialSelection);
    };

    loadMachines();
  }, []);

  const onChangeFromDate = (event, selectedDate) => {
    const currentDate = selectedDate || fromDate;
    setShowFromDate(Platform.OS === 'ios');
    setFromDate(currentDate);
  };

  const onChangeToDate = (event, selectedDate) => {
    const currentDate = selectedDate || toDate;
    setShowToDate(Platform.OS === 'ios');
    setToDate(currentDate);
  };

  const handleDownloadCSV = async () => {
    const selectedMachineIds = machines
      .filter(machine => selectedMachines[machine.id])
      .map(machine => machine.machine_id);
  
    if (selectedMachineIds.length === 0) {
      Alert.alert('Error', 'No machines selected');
      return;
    }
  
    const data = await fetchProductionData(selectedMachineIds, fromDate, toDate);
    console.log('Fetched data for CSV:', data);
  
    if (data && data.machines && data.machines.length > 0) {
      const csvData = convertToCSV(data);
      saveCSVToFile(csvData, 'machines_report');
    } else {
      Alert.alert('Error', 'No data available to generate CSV');
    }
  };
  
  const handleDownloadPDF = async () => {
    const selectedMachineIds = machines
      .filter(machine => selectedMachines[machine.id])
      .map(machine => machine.machine_id);
  
    if (selectedMachineIds.length === 0) {
      Alert.alert('Error', 'No machines selected');
      return;
    }
  
    const data = await fetchProductionData(selectedMachineIds, fromDate, toDate);
    console.log('Fetched data for PDF:', data);
  
    if (data && data.machines && data.machines.length > 0) {
      generatePDF(data);
    } else {
      Alert.alert('Error', 'No data available to generate PDF');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.dateContainer}>
        <View style={styles.datePicker}>
          <Text style={styles.label}>From Date:</Text>
          <Button
            onPress={() => setShowFromDate(true)}
            title="Select From Date"
            buttonStyle={styles.button}
          />
          {showFromDate && (
            <DateTimePicker
              testID="dateTimePickerFrom"
              value={fromDate}
              mode="date"
              display="default"
              onChange={onChangeFromDate}
              textColor="dodgerblue"
            />
          )}
          <Text style={styles.dateText}>{fromDate.toDateString()}</Text>
        </View>
        <View style={styles.datePicker}>
          <Text style={styles.label}>To Date:</Text>
          <Button
            onPress={() => setShowToDate(true)}
            title="Select To Date"
            buttonStyle={styles.button}
          />
          {showToDate && (
            <DateTimePicker
              testID="dateTimePickerTo"
              value={toDate}
              mode="date"
              display="default"
              onChange={onChangeToDate}
              textColor="dodgerblue"
            />
          )}
          <Text style={styles.dateText}>{toDate.toDateString()}</Text>
        </View>
      </View>
      <View style={styles.machineBox}>
        <Text style={styles.header}>Machines</Text>
        <View style={styles.machineContainer}>
          {machines.map(machine => (
            <CheckBox
              key={machine.id}
              title={`${machine.machine_name} - ${machine.machine_id}`}
              checked={selectedMachines[machine.id] || false}
              onPress={() => setSelectedMachines(prevState => ({
                ...prevState,
                [machine.id]: !prevState[machine.id],
              }))}
            />
          ))}
        </View>
      </View>
      <View style={styles.downloadContainer}>
        <Button
          title="Download PDF"
          buttonStyle={[styles.downloadButton, { backgroundColor: 'dodgerblue' }]}
          onPress={handleDownloadPDF}
        />
        <Button
          title="Download CSV"
          buttonStyle={[styles.downloadButton, { backgroundColor: 'dodgerblue' }]}
          onPress={handleDownloadCSV}
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
    padding: 20,
    backgroundColor: 'ghostwhite',
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  datePicker: {
    flex: 1,
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  dateText: {
    fontSize: 16,
    marginTop: 10,
  },
  machineBox: {
    width: '100%',
    padding: 20,
    borderWidth: 1,
    borderColor: 'white',
    borderRadius: 10,
    marginBottom: 20,
    backgroundColor: "white",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.1,
    shadowRadius: 5.84,
    elevation: 8,
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  machineContainer: {
    width: '100%',
  },
  downloadContainer: {
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
  },
  downloadButton: {
    borderRadius: 50,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 10,
  },
  button: {
    backgroundColor: 'dodgerblue',
    borderRadius: 50,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
});