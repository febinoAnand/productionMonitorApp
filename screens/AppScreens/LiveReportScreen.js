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
      const todayDate = getTodayDate();
      const response = await axios.post(`${BaseURL}data/individual-report/`, {
        date: todayDate,
        machine_id: id,
      });
      const data = response.data;
      console.log('API Response:', data);

      if (data && data.machine_id === id) {
        setMachineDetails(data);
      } else {
        console.warn('Machine not found in the API response.');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const startFetchingData = useCallback(() => {
    console.log('Starting data fetch interval');
    fetchData();
    intervalRef.current = setInterval(() => {
      console.log('Fetching data...');
      fetchData();
    }, 20000);
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
                  <Text style={styles.boldText}>{machineDetails.machine_name}</Text>
                </View>
              </View>
              <View style={styles.row1}>
                <View style={[styles.cell1, styles.columnHeader1]}>
                  <Text style={styles.headerText2}>Production Count</Text>
                </View>
                <View style={[styles.cell1, styles.columnValue1]}>
                  <Text style={styles.valueText}>
                    {machineDetails.shifts ? 
                      machineDetails.shifts
                        .reduce((total, shift) => 
                          total + Object.values(shift.timing).reduce((shiftTotal, timing) => shiftTotal + timing.actual_production, 0)
                        , 0)
                      : '0'}
                  </Text>
                </View>
              </View>
              <View style={styles.row1}>
                <View style={[styles.cell1, styles.columnHeader1]}>
                  <Text style={styles.headerText2}>Shift Name</Text>
                </View>
                <View style={[styles.cell1, styles.columnValue1]}>
                  <Text style={styles.valueText}>
                    {machineDetails.shifts ? 
                      machineDetails.shifts[0].shift_name || `Shift ${machineDetails.shifts[0].shift_no}` 
                      : 'N/A'}
                  </Text>
                </View>
              </View>
              <View style={styles.row1}>
                <View style={[styles.cell1, styles.columnHeader1]}>
                  <Text style={styles.headerText2}>Shift Time</Text>
                </View>
                <View style={[styles.cell1, styles.columnValue1]}>
                  <Text style={styles.valueText}>
                    {machineDetails.shifts ? 
                      `${machineDetails.shifts[0].shift_start_time} - ${machineDetails.shifts[0].shift_end_time}` 
                      : 'N/A'}
                  </Text>
                </View>
              </View>
              <View style={styles.row1}>
                <View style={[styles.cell1, styles.columnHeader1]}>
                  <Text style={styles.headerText2}>Date</Text>
                </View>
                <View style={[styles.cell1, styles.columnValue1]}>
                  <Text style={styles.valueText}>{getTodayDate()}</Text>
                </View>
              </View>
            </>
          ) : (
            <Text>No details available.</Text>
          )}
        </View>
        <View style={styles.whiteContainer}>
          <View style={styles.headerContainer}>
            <Text style={styles.headerText1}>Shift Wise Report</Text>
          </View>
          {machineDetails && machineDetails.shifts && machineDetails.shifts.map((shift, shiftIndex) => (
            shift.timing && Object.keys(shift.timing).length > 0 && (
              <View key={shiftIndex} style={styles.groupContainer}>
                <Text style={styles.groupHeader}>
                  {shift.shift_name || `Shift ${shift.shift_no}`}
                </Text>
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
                        <Text style={styles.headerText}>Target Count</Text>
                      </View>
                    </View>
                    {Object.entries(shift.timing).map(([timeSlot, values], index) => (
                      <View key={index} style={styles.row}>
                        <View style={[styles.cell, styles.columnValue, { width: 135 }]}>
                          <Text style={styles.valueText}>{timeSlot}</Text>
                        </View>
                        <View style={[styles.cell, styles.columnValue, { width: 100 }]}>
                          <Text style={styles.valueText}>{values.actual_production}</Text>
                        </View>
                        <View style={[styles.cell, styles.columnValue, { width: 100 }]}>
                          <Text style={styles.valueText}>{values.target_production}</Text>
                        </View>
                      </View>
                    ))}
                    <View style={styles.row}>
                      <View style={[styles.cell, styles.columnHeader, { width: 135 }]}>
                        <Text style={styles.headerText}>Total</Text>
                      </View>
                      <View style={[styles.cell, styles.columnHeader, { width: 100 }]}>
                        <Text style={styles.headerText}>
                          {Object.values(shift.timing).reduce((total, val) => total + val.actual_production, 0)}
                        </Text>
                      </View>
                      <View style={[styles.cell, styles.columnHeader, { width: 100 }]}>
                        <Text style={styles.headerText}>
                          {Object.values(shift.timing).reduce((total, val) => total + val.target_production, 0)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
                {shiftIndex < machineDetails.shifts.length - 1 && (
                  <View style={styles.dividerLine} />
                )}
              </View>
            )
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