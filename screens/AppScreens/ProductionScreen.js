import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BaseURL } from '../../config/appconfig';
import { useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/Ionicons';
import debounce from 'lodash/debounce';

const ProductionScreen = () => {
  const [productionData, setProductionData] = useState([]);
  const [shiftHeaders, setShiftHeaders] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [searchDate, setSearchDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  const fetchGroupData = async (date) => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.error('No token found in AsyncStorage');
        setLoading(false);
        return;
      }

      const formattedDate = date.toISOString().split('T')[0];

      const productionResponse = await axios.post(
        `${BaseURL}data/production/`,
        { date: formattedDate },
        {
          headers: { Authorization: `Token ${token}` }
        }
      );

      const responseDate = productionResponse.data.date;
      if (responseDate !== formattedDate) {
        console.log('Selected date does not match the fetched data date');
        setProductionData([]);
        setLoading(false);
        return;
      }

      const productionData = productionResponse.data.machine_groups || [];

      const filteredData = productionData
        .map(group => ({
          ...group,
          machines: group.machines.filter(machine =>
            (machine.shifts || []).length > 0
          ),
        }))
        .filter(group => group.machines.length > 0);

      console.log('Filtered Production Data:', filteredData);

      setProductionData(filteredData.reverse());

      if (filteredData.length > 0 && filteredData[0].machines.length > 0) {
        const firstMachineShifts = filteredData[0].machines.flatMap(machine => machine.shifts || []);
        const shifts = firstMachineShifts
          .filter(shift => shift.shift_name || shift.shift_no)
          .map(shift => shift.shift_name || `Shift - ${shift.shift_no}`);
        setShiftHeaders([...new Set(shifts)]);
      }
    } catch (error) {
      console.error('Error fetching production data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDataWithDebounce = useCallback(debounce((date) => fetchGroupData(date), 1000), []);

  useFocusEffect(
    useCallback(() => {
      if (searchDate) {
        fetchDataWithDebounce(searchDate);
      }
      return () => {
        fetchDataWithDebounce.cancel();
      };
    }, [searchDate])
  );

  useEffect(() => {
    fetchGroupData(searchDate);
  }, [searchDate]);

  const handleDateChange = (event, date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) {
      setSelectedDate(date);
      setSearchDate(date);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <View style={{ height: 20 }}></View>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.datePickerButton}>
            <Text style={styles.datePickerText}>{selectedDate.toISOString().split('T')[0]}</Text>
            <Icon name="calendar" size={20} color="black" style={styles.calendarIcon} />
          </TouchableOpacity>
        </View>
        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={handleDateChange}
          />
        )}
        <View style={{ height: 20 }}></View>
        {loading ? (
          <ActivityIndicator size="large" color="dodgerblue" style={styles.loader} />
        ) : productionData.length === 0 ? (
          <Text style={styles.messageText}>No data available for the selected date.</Text>
        ) : (
          productionData.map((group, index) => {
            const totalCounts = {};

            group.machines.forEach(machine => {
              const machineShifts = machine.shifts || [];
              machineShifts.forEach(shift => {
                const shiftHeader = shift.shift_name || `Shift - ${shift.shift_no}`;
                if (shiftHeaders.includes(shiftHeader)) {
                  totalCounts[shiftHeader] = (totalCounts[shiftHeader] || 0) + shift.total_shift_production_count;
                }
              });
            });

            const groupTotal = Object.values(totalCounts).reduce((a, b) => a + b, 0);

            return (
              <View key={index} style={styles.groupContainer}>
                <View style={styles.tableContainer}>
                  <View style={styles.table}>
                    <View style={styles.tableHeader}>
                      <Text style={styles.tableTitle}>{group.group_name}</Text>
                    </View>
                    <View style={[styles.row, styles.headerRow]}>
                      <View style={[styles.cell, styles.columnHeader, { width: 80 }]}>
                        <Text style={styles.headerText}>Work Center</Text>
                      </View>
                      {shiftHeaders.map((shiftHeader, idx) => (
                        <View key={idx} style={[styles.cell, styles.columnHeader, { width: 60 }]}>
                          <Text style={styles.headerText}>{shiftHeader}</Text>
                        </View>
                      ))}
                      <View style={[styles.cell, styles.columnHeader, { width: 75 }]}>
                        <Text style={styles.headerText}>Total</Text>
                      </View>
                    </View>
                    {group.machines.map((machine, machineIndex) => {
                      const rowTotal = shiftHeaders.reduce((acc, shiftHeader) => {
                        const shift = machine.shifts ? machine.shifts.find(s => (s.shift_name || `Shift - ${s.shift_no}`) === shiftHeader) : null;
                        if (shift) {
                          acc.count += shift.total_shift_production_count;
                        }
                        return acc;
                      }, { count: 0 });
            
                      const cellStyle = machineIndex % 2 === 0 ? styles.grayCell : styles.blackCell;
                      const textStyle = machineIndex % 2 === 0 ? styles.grayText : styles.blackText;
            
                      return (
                        <View key={machineIndex} style={styles.row}>
                          <View style={[styles.cell, cellStyle, { width: 80 }]}>
                            <Text style={[styles.valueText, textStyle]}>{machine.machine_id}</Text>
                          </View>
                          {shiftHeaders.map((shiftHeader, idx) => {
                            const shift = machine.shifts ? machine.shifts.find(s => (s.shift_name || `Shift - ${s.shift_no}`) === shiftHeader) : null;
                            return (
                              <View key={idx} style={[styles.cell, cellStyle, { width: 60 }]}>
                                <Text style={[styles.valueText, textStyle]}>{shift ? shift.total_shift_production_count : 0}</Text>
                              </View>
                            );
                          })}
                          <View style={[styles.cell, cellStyle, { width: 75 }]}>
                            <Text style={[styles.valueText, textStyle]}>{rowTotal.count}</Text>
                          </View>
                        </View>
                      );
                    })}
                    <View style={[styles.row, styles.totalRow]}>
                      <View style={[styles.cell, styles.columnHeader, { width: 80 }]}>
                        <Text style={styles.headerText}>Total</Text>
                      </View>
                      {shiftHeaders.map((shiftHeader, idx) => (
                        <View key={idx} style={[styles.cell, styles.columnHeader, { width: 60 }]}>
                          <Text style={styles.headerText}>{totalCounts[shiftHeader] || 0}</Text>
                        </View>
                      ))}
                      <View style={[styles.cell, styles.columnHeader, { width: 75 }]}>
                        <Text style={styles.headerText}>{groupTotal}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            );
          })
        )}
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
    width: '90%',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
  },
  datePickerButton: {
    width:"100%",
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginLeft: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.1,
    shadowRadius: 5.84,
    elevation: 8,
  },
  datePickerText: {
    color: 'black',
    fontWeight: 'bold',
    fontSize: 14,
    marginRight: 10,
  },
  iconButton: {
    backgroundColor: 'dodgerblue',
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    marginLeft: 10,
  },
  calendarIcon: {
    marginLeft: 'auto',
  },
  groupContainer: {
    width: '100%',
    marginBottom: 20,
  },
  groupHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'dodgerblue',
    padding: 10,
    borderRadius: 5,
  },
  tableContainer: {
    width: '100%',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginTop: 10,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.1,
    shadowRadius: 5.84,
    elevation: 8,
  },
  tableHeader: {
    backgroundColor: 'white',
    padding: 20,
  },
  tableTitle: {
    fontSize: 18,
    color: 'black',
    textAlign: 'center',
  },
  table: {
    minWidth: '100%',
  },
  row: {
    flexDirection: 'row',
  },
  headerRow: {
    borderBottomWidth: 2,
    borderBottomColor: 'black',
  },
  cell: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: 'white',
  },
  columnHeader: {
    backgroundColor: 'white',
  },
  columnValue: {
    backgroundColor: 'white',
  },
  totalRow: {
    borderTopWidth: 2,
    borderTopColor: 'black',
  },
  headerText: {
    color: 'black',
    fontWeight: 'bold',
    fontSize: 10
  },
  valueText: {
    fontSize: 10,
  },
  messageText: {
    fontSize: 16,
    color: 'grey',
    textAlign: 'center',
    marginTop: 20,
  },
  grayText: {
    color: '#4a4a4a',
  },
  blackText: {
    color: '#4a4a4a',
  },
  grayCell: {
    backgroundColor: '#d9d9d9',
  },
  blackCell: {
    backgroundColor: 'white',
  },
});

export default ProductionScreen;