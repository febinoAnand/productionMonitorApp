import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BaseURL } from '../../config/appconfig';

const ProductionScreen = () => {
  const [productionData, setProductionData] = useState([]);
  const [shiftHeaders, setShiftHeaders] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const productionResponse = await axios.get(`${BaseURL}data/production/`, {
          headers: { Authorization: `Token ${token}` }
        });
        let productionData = productionResponse.data.group_data || [];
        productionData = productionData.reverse();
        setProductionData(productionData);

        if (productionData.length > 0 && productionData[0].machines.length > 0) {
          const firstMachineShifts = Object.values(productionData[0].machines[0].shifts);
          const shifts = firstMachineShifts
            .filter(shift => shift.shift_name !== '0' && shift.shift_number !== 0)
            .map(shift =>
              shift.shift_name ? shift.shift_name : `${shift.shift_number}`
            );
          setShiftHeaders([...new Set(shifts)]);
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchData();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <View style={{ height: 20 }}></View>
        {productionData.length === 0 ? (
          <Text style={styles.messageText}>No data available.</Text>
        ) : (
          productionData.map((group, index) => {
            const totalCounts = {};

            group.machines.forEach(machine => {
              const machineShifts = machine.shifts ? Object.values(machine.shifts) : [];
              machineShifts.forEach(shift => {
                const shiftHeader = shift.shift_name ? shift.shift_name : `${shift.shift_number}`;
                if (shiftHeaders.includes(shiftHeader)) {
                  totalCounts[shiftHeader] = (totalCounts[shiftHeader] || 0) + shift.production_count;
                }
              });
            });

            const groupTotal = Object.values(totalCounts).reduce((a, b) => a + b, 0);

            return (
              <View key={index} style={styles.groupContainer}>
                <Text style={styles.groupHeader}>{group.group_name}</Text>
                <View style={styles.tableContainer}>
                  <ScrollView horizontal>
                    <View style={styles.table}>
                      <View style={[styles.row, styles.headerRow]}>
                        <View style={[styles.cell, styles.columnHeader, { width: 150 }]}>
                          <Text style={styles.headerText}>Work Center</Text>
                        </View>
                        {shiftHeaders.map((shiftHeader, idx) => (
                          <View key={idx} style={[styles.cell, styles.columnHeader, { width: 150 }]}>
                            <Text style={styles.headerText}>{shiftHeader}</Text>
                          </View>
                        ))}
                        <View style={[styles.cell, styles.columnHeader, { width: 150 }]}>
                          <Text style={styles.headerText}>Total</Text>
                        </View>
                      </View>
                      {group.machines.map((machine, machineIndex) => {
                        const rowTotal = shiftHeaders.reduce((acc, shiftHeader) => {
                          const shift = machine.shifts ? machine.shifts[shiftHeader] : null;
                          if (shift) {
                            acc.count += shift.production_count;
                          }
                          return acc;
                        }, { count: 0 });

                        return (
                          <View key={machineIndex} style={styles.row}>
                            <View style={[styles.cell, styles.columnValue, { width: 150 }]}>
                              <Text>{machine.machine_name}</Text>
                            </View>
                            {shiftHeaders.map((shiftHeader, idx) => {
                              const shift = machine.shifts ? machine.shifts[shiftHeader] : null;
                              return (
                                <View key={idx} style={[styles.cell, styles.columnValue, { width: 150 }]}>
                                  {shift ? (
                                    <Text>{shift.production_count}</Text>
                                  ) : (
                                    <Text>0</Text>
                                  )}
                                </View>
                              );
                            })}
                            <View style={[styles.cell, styles.columnValue, { width: 150 }]}>
                              <Text>{rowTotal.count}</Text>
                            </View>
                          </View>
                        );
                      })}
                      <View style={[styles.row, styles.headerRow]}>
                        <View style={[styles.cell, styles.columnHeader, { width: 150 }]}>
                          <Text style={styles.headerText}>Grand Total</Text>
                        </View>
                        {shiftHeaders.map((shiftHeader, idx) => (
                          <View key={idx} style={[styles.cell, styles.columnHeader, { width: 150 }]}>
                            <Text style={styles.headerText}>{totalCounts[shiftHeader] || 0}</Text>
                          </View>
                        ))}
                        <View style={[styles.cell, styles.columnHeader, { width: 150 }]}>
                          <Text style={styles.headerText}>{groupTotal}</Text>
                        </View>
                      </View>
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
    minWidth: '100%',
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