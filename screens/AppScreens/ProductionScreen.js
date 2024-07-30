import React, { useState } from 'react';
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

  const onDateChange = (event, date) => {
    const currentDate = date || selectedDate;
    setShowDatePicker(Platform.OS === 'ios');
    setSelectedDate(currentDate);
  };

  const handleSearch = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.post( `${BaseURL}data/group-wise-machine-data/`,{ 
            date: selectedDate.toISOString().split('T')[0] 
        },
        { headers: { Authorization: `Token ${token}`, },}
      );
      setProductionData(response.data.groups);
      setIsSearched(true);
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
          productionData.map((group, index) => (
            group.machines.length > 0 && (
              <View key={index} style={styles.groupContainer}>
                <Text style={styles.groupHeader}>{group.group_name}</Text>
                <View style={styles.tableContainer}>
                  <View style={styles.row}>
                    <View style={[styles.cell, styles.columnHeader, { backgroundColor: 'dodgerblue' }]}>
                      <Text style={{ color: '#fff' }}>Si.No</Text>
                    </View>
                    <View style={[styles.cell, styles.columnHeader, { backgroundColor: 'dodgerblue' }]}>
                      <Text style={{ color: '#fff' }}>Work Center</Text>
                    </View>
                    <View style={[styles.cell, styles.columnHeader, { backgroundColor: 'dodgerblue' }]}>
                      <Text style={{ color: '#fff' }}>Shifts</Text>
                    </View>
                  </View>
                  {group.machines.map((machine, machineIndex) => (
                    <View key={machineIndex} style={styles.row}>
                      <View style={[styles.cell, styles.columnValue]}>
                        <Text>{machineIndex + 1}</Text>
                      </View>
                      <View style={[styles.cell, styles.columnValue]}>
                        <Text>{machine.machine_name}</Text>
                      </View>
                      <View style={[styles.cell, styles.columnValue]}>
                        {machine.shifts.length > 0 ? (
                          machine.shifts.map((shift, shiftIndex) => (
                            <Text key={shiftIndex}>{shift.shift_name}</Text>
                          ))
                        ) : (
                          <Text>No Shifts</Text>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )
          ))
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
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  cell: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  columnHeader: {
    justifyContent: 'center',
    alignItems: 'flex-start',
    borderRightWidth: 1,
    borderRightColor: '#ccc',
  },
  columnValue: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  messageText: {
    fontSize: 16,
    color: 'grey',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default ProductionScreen;