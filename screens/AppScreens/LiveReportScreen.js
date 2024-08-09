import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import axios from 'axios';
import { BaseURL } from '../../config/appconfig';

const LiveReportScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { id } = route.params || {};
  const [machineDetails, setMachineDetails] = useState(null);
  const [productionData, setProductionData] = useState([]);
  const [machineData, setMachineData] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
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

  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timeInterval);
  }, []);

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
        setProductionData(selectedMachineDetails.production_data || []);
        setMachineData(selectedMachineDetails.machine_data || []);
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

  const safeProductionData = Array.isArray(productionData) ? productionData : [];
  const safeMachineData = Array.isArray(machineData) ? machineData : [];

  const getCurrentDate = () => {
    return currentTime.toLocaleDateString();
  };

  const getCurrentTime = () => {
    return currentTime.toLocaleTimeString();
  };

  const data = [
    { label: 'Machine 1', value: 120 },
    { label: 'Machine 2', value: 50 },
    { label: 'Machine 3', value: 90 },
    { label: 'Machine 4', value: 60 },
  ];

  const barHeight = 30;
  const chartHeight = data.length * (barHeight + 10);
  const chartWidth = 300;
  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerText}>MACHINE DETAILS</Text>
        </View>
        <View style={styles.tableContainer}>
          {machineDetails ? (
            Object.entries({
              'Machine Name': machineDetails.machine_name,
              'Machine ID': machineDetails.machine_id,
              'Line': machineDetails.line,
              'Manufacture': machineDetails.manufacture,
              'Year': machineDetails.year,
              'Production Per Hour': machineDetails.production_per_hour,
            }).map(([key, value]) => (
              <View style={styles.row1} key={key}>
                <View style={[styles.cell1, styles.columnHeader1]}>
                  <Text>{key}</Text>
                </View>
                <View style={[styles.cell1, styles.columnValue1]}>
                  <Text>{value || '0'}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text>No details available.</Text>
          )}
        </View>

        <View style={styles.header}>
          <Text style={styles.headerText}>PRODUCTION DATA</Text>
        </View>
        <View style={styles.tableContainer}>
          {safeProductionData.length > 0 ? (
            safeProductionData.map((item, index) => (
              <View key={index}>
                <View style={styles.row1}>
                  <View style={[styles.cell1, styles.columnHeader1]}>
                    <Text>Date</Text>
                  </View>
                  <View style={[styles.cell1, styles.columnValue1]}>
                    <Text>{getCurrentDate()}</Text>
                  </View>
                </View>
                <View style={styles.row1}>
                  <View style={[styles.cell1, styles.columnHeader1]}>
                    <Text>Time</Text>
                  </View>
                  <View style={[styles.cell1, styles.columnValue1]}>
                    <Text>{getCurrentTime()}</Text>
                  </View>
                </View>
                <View style={styles.row1}>
                  <View style={[styles.cell1, styles.columnHeader1]}>
                    <Text>Today's Count</Text>
                  </View>
                  <View style={[styles.cell1, styles.columnValue1]}>
                    <Text>{item.production_count || 'N/A'}</Text>
                  </View>
                </View>
                <View style={styles.row1}>
                  <View style={[styles.cell1, styles.columnHeader1]}>
                    <Text>Target Reading</Text>
                  </View>
                  <View style={[styles.cell1, styles.columnValue1]}>
                    <Text>{item.target_production || 'N/A'}</Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View>
              <View style={styles.row1}>
                <View style={[styles.cell1, styles.columnHeader1]}>
                  <Text>Date</Text>
                </View>
                <View style={[styles.cell1, styles.columnValue1]}>
                  <Text>{getCurrentDate()}</Text>
                </View>
              </View>
              <View style={styles.row1}>
                <View style={[styles.cell1, styles.columnHeader1]}>
                  <Text>Time</Text>
                </View>
                <View style={[styles.cell1, styles.columnValue1]}>
                  <Text>{getCurrentTime()}</Text>
                </View>
              </View>
              <View style={styles.row1}>
                <View style={[styles.cell1, styles.columnHeader1]}>
                  <Text>Today's Count</Text>
                </View>
                <View style={[styles.cell1, styles.columnValue1]}>
                  <Text>N/A</Text>
                </View>
              </View>
              <View style={styles.row1}>
                <View style={[styles.cell1, styles.columnHeader1]}>
                  <Text>Target Reading</Text>
                </View>
                <View style={[styles.cell1, styles.columnValue1]}>
                  <Text>N/A</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        <View style={styles.additionalHeader}>
          <Text style={styles.additionalHeaderText}>PRODUCTION CHART</Text>
        </View>
        
        <View style={styles.tableContainer1}>
          <View style={styles.chartContainer}>
            <Svg height={chartHeight} width={chartWidth}>
              {data.map((item, index) => {
                const barWidth = (item.value / maxValue) * (chartWidth - 100);
                return (
                  <React.Fragment key={index}>
                    <Rect
                      x="0"
                      y={index * (barHeight + 10)}
                      width={barWidth}
                      height={barHeight}
                      fill="dodgerblue"
                    />
                    <SvgText
                      x={barWidth + 5}
                      y={index * (barHeight + 10) + barHeight / 2}
                      alignmentBaseline="middle"
                      fontSize="12"
                      fill="black"
                    >
                      {item.label}
                    </SvgText>
                    <SvgText
                      x="10"
                      y={index * (barHeight + 10) + barHeight / 2}
                      alignmentBaseline="middle"
                      fontSize="10"
                      fill="white"
                    >
                      {item.value}
                    </SvgText>
                  </React.Fragment>
                );
              })}
            </Svg>
          </View>
        </View>

        <View style={styles.additionalHeader}>
          <Text style={styles.additionalHeaderText}>MACHINE DATA</Text>
        </View>

        <View style={styles.tableContainer1}>
          <ScrollView horizontal>
            <View>
              <View style={styles.row}>
                <View style={[styles.cell, styles.columnHeader, { backgroundColor: 'dodgerblue', width: 120 }]}>
                  <Text style={{ color: '#fff' }}>Si.No</Text>
                </View>
                <View style={[styles.cell, styles.columnHeader, { backgroundColor: 'dodgerblue', width: 160 }]}>
                  <Text style={{ color: '#fff' }}>Date</Text>
                </View>
                <View style={[styles.cell, styles.columnHeader, { backgroundColor: 'dodgerblue', width: 160 }]}>
                  <Text style={{ color: '#fff' }}>Time</Text>
                </View>
                <View style={[styles.cell, styles.columnHeader, { backgroundColor: 'dodgerblue', width: 160 }]}>
                  <Text style={{ color: '#fff' }}>Machine ID</Text>
                </View>
                <View style={[styles.cell, styles.columnHeader, { backgroundColor: 'dodgerblue', width: 160 }]}>
                  <Text style={{ color: '#fff' }}>Data</Text>
                </View>
              </View>
              {safeMachineData.length > 0 ? (
                safeMachineData.map((item, index) => (
                  <View style={styles.row} key={index}>
                    <View style={[styles.cell, styles.columnValue, { width: 120 }]}>
                      <Text>{index + 1}</Text>
                    </View>
                    <View style={[styles.cell, styles.columnValue, { width: 160 }]}>
                      <Text>{item.date || 'N/A'}</Text>
                    </View>
                    <View style={[styles.cell, styles.columnValue, { width: 160 }]}>
                      <Text>{item.time || 'N/A'}</Text>
                    </View>
                    <View style={[styles.cell, styles.columnValue, { width: 160 }]}>
                      <Text>{item.machine_id || 'N/A'}</Text>
                    </View>
                    <View style={[styles.cell, styles.columnValue, { width: 160 }]}>
                      <Text>{JSON.stringify(item.data) || 'N/A'}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text>No machine data available.</Text>
              )}
            </View>
          </ScrollView>
        </View>
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
  header: {
    width: '100%',
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  tableContainer: {
    width: '70%',
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
  tableContainer1: {
    width: '90%',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,

    backgroundColor: '#fff',
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
    borderBottomColor: '#ddd',
  },
  cell: {
    padding: 10,
    borderRightWidth: 1,
    borderRightColor: '#ddd',
  },
  columnHeader: {
    backgroundColor: '#f4f4f4',
  },
  columnValue: {
    backgroundColor: '#fff',
  },
  additionalHeader: {
    width: '100%',
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    marginTop: 20,
  },
  additionalHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'dodgerblue',
  },
  row1: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  cell1: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  columnHeader1: {
    justifyContent: 'center',
    alignItems: 'flex-start',
    borderRightWidth: 1,
    borderRightColor: '#ccc',
  },
  columnValue1: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  chartContainer: {
    marginTop: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
});

export default LiveReportScreen;