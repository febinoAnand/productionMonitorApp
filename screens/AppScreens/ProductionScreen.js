import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ScrollView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BaseURL } from '../../config/appconfig';

const ProductionScreen = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [productionData, setProductionData] = useState([]);
  const [isSearched, setIsSearched] = useState(false);
  const [shiftNames, setShiftNames] = useState([]);

  const onDateChange = (event, date) => {
    const currentDate = date || selectedDate;
    setShowDatePicker(Platform.OS === 'ios');
    setSelectedDate(currentDate);
  };

  const handleSearch = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.post(`${BaseURL}data/group-wise-machine-data/`, { 
        date: selectedDate.toISOString().split('T')[0] 
      },
      { headers: { Authorization: `Token ${token}` } });
      const data = response.data.groups;
      setProductionData(data);
      setIsSearched(true);
      
      const shifts = data.flatMap(group => 
        group.machines.flatMap(machine => machine.shifts.map(shift => shift.shift_name))
      );
      setShiftNames([...new Set(shifts)]);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <View style={{ height: 20 }}></View>
        <View style={styles.datePickerContainer}>
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            style={styles.datePickerButton}
          >
            <Text style={styles.datePickerText}>
              {selectedDate.toISOString().split('T')[0]}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="default"
              onChange={onDateChange}
            />
          )}
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <Icon name="search" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        {!isSearched ? (
          <Text style={styles.messageText}>No data searched.</Text>
        ) : productionData.length === 0 ? (
          <Text style={styles.messageText}>No data available.</Text>
        ) : (
          productionData.map((group, index) => {
            const hasShifts = group.machines.some(machine => machine.shifts.length > 0);
            return hasShifts && (
              <View key={index} style={styles.groupContainer}>
                <Text style={styles.groupHeader}>{group.group_name}</Text>
                <View style={styles.tableContainer}>
                  <ScrollView horizontal>
                    <View style={styles.table}>
                      <View style={[styles.row, styles.headerRow]}>
                        <View style={[styles.cell, styles.columnHeader, { width: 60 }]}>
                          <Text style={styles.headerText}>Si.No</Text>
                        </View>
                        <View style={[styles.cell, styles.columnHeader, { width: 120 }]}>
                          <Text style={styles.headerText}>Work Center</Text>
                        </View>
                        {shiftNames.map((shiftName, idx) => (
                          <View key={idx} style={[styles.cell, styles.columnHeader, { width: 100 }]}>
                            <Text style={styles.headerText}>{shiftName}</Text>
                          </View>
                        ))}
                      </View>
                      {group.machines.map((machine, machineIndex) => (
                        <View key={machineIndex} style={styles.row}>
                          <View style={[styles.cell, styles.columnValue, { width: 60 }]}>
                            <Text>{machineIndex + 1}</Text>
                          </View>
                          <View style={[styles.cell, styles.columnValue, { width: 120 }]}>
                            <Text>{machine.machine_name}</Text>
                          </View>
                          {shiftNames.map((shiftName, idx) => {
                            const shift = machine.shifts.find(s => s.shift_name === shiftName);
                            return (
                              <View key={idx} style={[styles.cell, styles.columnValue, { width: 100 }]}>
                                {shift ? (
                                  <Text>{shift.production_count} / {shift.target_production}</Text>
                                ) : (
                                  <Text>0</Text>
                                )}
                              </View>
                            );
                          })}
                        </View>
                      ))}
                    </View>
                  </ScrollView>
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
  datePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  datePickerButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'dodgerblue',
    backgroundColor: 'dodgerblue',
    borderRadius: 5,
    padding: 10,
    justifyContent: 'center',
  },
  datePickerText: {
    fontSize: 16,
    color: 'white',
  },
  searchButton: {
    backgroundColor: 'dodgerblue',
    padding: 10,
    marginLeft: 10,
    borderRadius: 5,
  },
  productionText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
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
    marginBottom: 20,
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
  table: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
  },
  headerRow: {
    borderBottomWidth: 2,
    borderBottomColor: 'dodgerblue',
  },
  cell: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#ccc',
  },
  columnHeader: {
    backgroundColor: 'dodgerblue',
  },
  columnValue: {
    backgroundColor: '#fff',
  },
  headerText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  messageText: {
    fontSize: 16,
    color: 'grey',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default ProductionScreen;