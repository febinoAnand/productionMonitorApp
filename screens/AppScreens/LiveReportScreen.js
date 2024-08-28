import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { BaseURL } from '../../config/appconfig';
import Ionicons from '@expo/vector-icons/Ionicons';

const LiveReportScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { id } = route.params || {};
  const [machineDetails, setMachineDetails] = useState(null);
  const intervalRef = useRef(null);
  const isMounted = useRef(true);

  const hardCodedShifts = [
    {
      shift_name: 'Shift 1',
      shift_number: 1,
      time_slots: [
        { start_time: '06:30 AM', end_time: '07:30 AM', count: 0, actual: 0 },
        { start_time: '07:30 AM', end_time: '08:30 AM', count: 0, actual: 0 },
        { start_time: '08:30 AM', end_time: '09:30 AM', count: 0, actual: 0 },
        { start_time: '09:30 AM', end_time: '10:30 AM', count: 0, actual: 0 },
        { start_time: '10:30 AM', end_time: '11:30 AM', count: 0, actual: 0 },
        { start_time: '11:30 AM', end_time: '12:30 PM', count: 0, actual: 0 },
        { start_time: '12:30 PM', end_time: '01:30 PM', count: 0, actual: 0 },
        { start_time: '01:30 PM', end_time: '02:30 PM', count: 0, actual: 0 },
      ],
      groups: [
        {
          machines: [
            { machine_name: 'Machine A' },
            { machine_name: 'Machine B' },
          ],
        },
      ],
    },
    {
      shift_name: 'Shift 2',
      shift_number: 2,
      time_slots: [
        { start_time: '02:30 PM', end_time: '03:30 PM', count: 0, actual: 0 },
        { start_time: '03:30 PM', end_time: '04:30 PM', count: 0, actual: 0 },
        { start_time: '04:30 PM', end_time: '05:30 PM', count: 0, actual: 0 },
        { start_time: '05:30 PM', end_time: '06:30 PM', count: 0, actual: 0 },
        { start_time: '06:30 PM', end_time: '07:30 PM', count: 0, actual: 0 },
        { start_time: '07:30 PM', end_time: '08:30 PM', count: 0, actual: 0 },
        { start_time: '08:30 PM', end_time: '09:30 PM', count: 0, actual: 0 },
        { start_time: '09:30 PM', end_time: '10:30 PM', count: 0, actual: 0 },
      ],
      groups: [
        {
          machines: [
            { machine_name: 'Machine A' },
            { machine_name: 'Machine C' },
          ],
        },
      ],
    },
    {
      shift_name: 'Shift 3',
      shift_number: 3,
      time_slots: [
        { start_time: '10:30 PM', end_time: '11:30 PM', count: 0, actual: 0 },
        { start_time: '11:30 PM', end_time: '12:30 AM', count: 0, actual: 0 },
        { start_time: '12:30 AM', end_time: '01:30 AM', count: 0, actual: 0 },
        { start_time: '01:30 AM', end_time: '02:30 AM', count: 0, actual: 0 },
        { start_time: '02:30 AM', end_time: '03:30 AM', count: 0, actual: 0 },
        { start_time: '03:30 AM', end_time: '04:30 AM', count: 0, actual: 0 },
        { start_time: '04:30 AM', end_time: '05:30 AM', count: 0, actual: 0 },
        { start_time: '05:30 AM', end_time: '06:30 AM', count: 0, actual: 0 },
      ],
      groups: [
        {
          machines: [
            { machine_name: 'Machine A' },
            { machine_name: 'Machine C' },
          ],
        },
      ],
    },
  ];

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      const unsubscribe = navigation.addListener('blur', () => {
        navigation.replace('Dashboard');
      });

      return unsubscribe;
    }, [navigation])
  );

  const fetchData = async () => {
    if (!id) {
      console.warn('Machine ID is missing or undefined');
      return;
    }

    try {
      const response = await axios.get(`${BaseURL}data/individual/${id}/`);
      const data = response.data;
      const selectedMachineDetails = data.machine_details;

      if (selectedMachineDetails && isMounted.current) {
        setMachineDetails(selectedMachineDetails);
      } else {
        console.warn('No details found for the selected machine.');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const startFetchingData = useCallback(() => {
    console.log('Starting data fetch interval');
    fetchData();
    intervalRef.current = setInterval(() => {
      console.log('Fetching data...');
      fetchData();
    }, 3000);
  }, [id]);

  const stopFetchingData = useCallback(() => {
    if (intervalRef.current) {
      console.log('Stopping data fetch interval');
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      startFetchingData();
      return () => {
        stopFetchingData();
      };
    }, [startFetchingData, stopFetchingData])
  );

  useEffect(() => {
    return () => {
      stopFetchingData();
    };
  }, [stopFetchingData]);

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <View style={styles.tableContainer}>
          {machineDetails ? (
            <>
              <View style={[styles.row1, styles.centeredRow]}>
                <View style={[styles.cell1, styles.centeredCell]}>
                  <Ionicons name="hardware-chip-sharp" size={35} color="#59adff" />
                  <Text style={styles.boldText}>{machineDetails.machine_id}</Text>
                </View>
              </View>
              {Object.entries({
                'Production Count': '100',
                'Shift Name': 'Shift 1',
                'Shift Time': '08:00',
                'Date': '2024-08-28'
              }).map(([key, value]) => (
                <View style={styles.row1} key={key}>
                  <View style={[styles.cell1, styles.columnHeader1]}>
                    <Text style={styles.headerText2}>{key}</Text>
                  </View>
                  <View style={[styles.cell1, styles.columnValue1]}>
                    <Text style={styles.valueText}>{value || '0'}</Text>
                  </View>
                </View>
              ))}
            </>
          ) : (
            <Text>No details available.</Text>
          )}
        </View>
        <View style={styles.whiteContainer}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerText1}>Shift Wise Report</Text>
        </View>
          {hardCodedShifts.map((shift, shiftIndex) => (
            <View key={shiftIndex} style={styles.groupContainer}>
              <Text style={styles.groupHeader}>{shift.shift_name}</Text>
              <View style={styles.tableContainer1}>
                <View style={styles.table}>
                  <View style={styles.row}>
                    <View style={[styles.cell, styles.columnHeader, { width: 135 }]}>
                      <Text style={styles.headerText}>Time</Text>
                    </View>
                    <View style={[styles.cell, styles.columnHeader, { width: 100 }]}>
                      <Text style={styles.headerText}>Production Count</Text>
                    </View>
                    <View style={[styles.cell, styles.columnHeader, { width: 100 }]}>
                      <Text style={styles.headerText}>Actual Count</Text>
                    </View>
                  </View>
                  {shift.time_slots.map((slot, index) => (
                    <View key={index} style={styles.row}>
                      <View style={[styles.cell, styles.columnValue, { width: 135 }]}>
                        <Text style={styles.valueText}>{`${slot.start_time} - ${slot.end_time}`}</Text>
                      </View>
                      <View style={[styles.cell, styles.columnValue, { width: 100 }]}>
                        <Text style={styles.valueText}>{slot.count}</Text>
                      </View>
                      <View style={[styles.cell, styles.columnValue, { width: 100 }]}>
                        <Text style={styles.valueText}>{slot.actual}</Text>
                      </View>
                    </View>
                  ))}
                  <View style={styles.row}>
                    <View style={[styles.cell, styles.columnHeader, { width: 135 }]}>
                      <Text style={styles.headerText}>Total</Text>
                    </View>
                    <View style={[styles.cell, styles.columnHeader, { width: 100 }]}>
                      <Text style={styles.headerText}>0</Text>
                    </View>
                    <View style={[styles.cell, styles.columnHeader, { width: 100 }]}>
                      <Text style={styles.headerText}>0</Text>
                    </View>
                  </View>
                </View>
              </View>
              {shiftIndex < hardCodedShifts.length - 1 && (
                <View style={styles.dividerLine} />
              )}
            </View>
          ))}
        </View>
        <View style={{ height: 20 }}></View>
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
    width: '100%',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  tableContainer: {
    width: '90%',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginTop: 20,
    backgroundColor: '#fff',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.1,
    shadowRadius: 5.84,
    elevation: 8,
  },
  headerContainer: {
    marginTop: 20,
    marginBottom: 10,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#59adff',
  },
  headerText1: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerText2: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#333',
  },
  dividerLine: {
    height: 2,
    width: '100%',
    backgroundColor: '#59adff',
    marginVertical: 20,
  },
  whiteContainer: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 5,
    padding: 10,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.1,
    shadowRadius: 5.84,
    elevation: 8,
  },
  groupContainer: {
    width: '100%',
  },
  groupHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 10,
  },
  tableContainer1: {
    marginTop: 10,
  },
  table: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  cell: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 5,
    borderRightWidth: 1,
    borderColor: 'lightgray',
  },
  columnHeader: {
    backgroundColor: 'white',
  },
  columnValue: {
    backgroundColor: 'white',
  },
  valueText: {
    fontSize: 10,
    color: '#333',
  },
  centeredRow: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  centeredCell: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cell1: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'gray',
  },
  boldText: {
    fontWeight: 'bold',
    fontSize: 20,
    color: '#59adff',
  },
  row1: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingVertical: 10,
  },
  columnHeader1: {
    backgroundColor: 'white',
  },
  columnValue1: {
    backgroundColor: 'white',
  },
});

export default LiveReportScreen;