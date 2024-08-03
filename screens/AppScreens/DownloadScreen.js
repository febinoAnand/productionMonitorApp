import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Button, Icon } from 'react-native-elements';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BaseURL } from '../../config/appconfig';

export default function DownloadScreen() {
  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(new Date());
  const [showFromDate, setShowFromDate] = useState(false);
  const [showToDate, setShowToDate] = useState(false);

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
    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: dodgerblue; color: white; }
            h1 { text-align: center; }
          </style>
        </head>
        <body>
          <h1>Summary Report</h1>
          <table>
            <tr>
              <th>Date</th>
              <th>Shift</th>
              <th>Work Center</th>
              <th>Shift Start</th>
              <th>Shift End</th>
              <th>Production Count</th>
            </tr>
            ${data.shift_wise_data.map(shift => `
              ${shift.groups.map(group => `
                ${group.machines.map(machine => `
                  <tr>
                    <td>${shift.shift_date}</td>
                    <td>${shift.shift_name}</td>
                    <td>${machine.machine_name}</td>
                    <td>${shift.shift_start_time}</td>
                    <td>${shift.shift_end_time}</td>
                    <td>${machine.production_count}</td>
                  </tr>
                `).join('')}
              `).join('')}
            `).join('')}
          </table>
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
      <View style={{ height: 20 }}></View>
      <Button
        title="SUMMARY REPORT"
        icon={<Icon name="download" type="font-awesome" style={{ marginRight: 10 }} color="white" />}
        buttonStyle={styles.button}
        onPress={() => fetchDataAndGeneratePDF(true)}
      />
      <View style={{ height: 10 }}></View>
      <Button
        title="SHIFT WISE REPORT"
        icon={<Icon name="download" type="font-awesome" style={{ marginRight: 10 }} color="white" />}
        buttonStyle={styles.button}
        onPress={() => fetchDataAndGeneratePDF(false)}
      />
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
  datePicker: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  dateText: {
    marginTop: 10,
    fontSize: 16,
    color: 'black',
  },
});