import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

const LiveReportScreen = () => {
  const navigation = useNavigation();

  useFocusEffect(
    React.useCallback(() => {
      const unsubscribe = navigation.addListener('blur', () => {
        navigation.replace('Dashboard');
      });

      return unsubscribe;
    }, [navigation])
  );

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Machine Details</Text>
        </View>
        <View style={styles.tableContainer}>
          <View style={styles.row1}>
            <View style={[styles.cell1, styles.columnHeader1]}>
              <Text>Machine Name</Text>
            </View>
            <View style={[styles.cell1, styles.columnValue1]}>
              <Text>123</Text>
            </View>
          </View>
          <View style={styles.row1}>
            <View style={[styles.cell1, styles.columnHeader1]}>
              <Text>Machine ID</Text>
            </View>
            <View style={[styles.cell1, styles.columnValue1]}>
              <Text>machine-1</Text>
            </View>
          </View>
          <View style={styles.row1}>
            <View style={[styles.cell1, styles.columnHeader1]}>
              <Text>Line</Text>
            </View>
            <View style={[styles.cell1, styles.columnValue1]}>
              <Text>1</Text>
            </View>
          </View>
          <View style={styles.row1}>
            <View style={[styles.cell1, styles.columnHeader1]}>
              <Text>Manufacture</Text>
            </View>
            <View style={[styles.cell1, styles.columnValue1]}>
              <Text>mando</Text>
            </View>
          </View>
          <View style={styles.row1}>
            <View style={[styles.cell1, styles.columnHeader1]}>
              <Text>Year</Text>
            </View>
            <View style={[styles.cell1, styles.columnValue1]}>
              <Text>2024</Text>
            </View>
          </View>
          <View style={styles.row1}>
            <View style={[styles.cell1, styles.columnHeader1]}>
              <Text>Production Per Hour</Text>
            </View>
            <View style={[styles.cell1, styles.columnValue1]}>
              <Text>24</Text>
            </View>
          </View>
        </View>
        <View style={styles.additionalHeader}>
          <Text style={styles.additionalHeaderText}>PRODUCTION DATA</Text>
        </View>
        
        <View style={styles.tableContainer1}>
          <ScrollView horizontal>
            <View>
              <View style={styles.row}>
                <View style={[styles.cell, styles.columnHeader, { backgroundColor: 'dodgerblue', width: 180 }]}>
                  <Text style={{ color: '#fff' }}>Date</Text>
                </View>
                <View style={[styles.cell, styles.columnHeader, { backgroundColor: 'dodgerblue', width: 180 }]}>
                  <Text style={{ color: '#fff' }}>Time</Text>
                </View>
                <View style={[styles.cell, styles.columnHeader, { backgroundColor: 'dodgerblue', width: 200 }]}>
                  <Text style={{ color: '#fff' }}>Tudays Count</Text>
                </View>
                <View style={[styles.cell, styles.columnHeader, { backgroundColor: 'dodgerblue', width: 200 }]}>
                  <Text style={{ color: '#fff' }}>Actual Reading</Text>
                </View>
              </View>
              <View style={styles.row}>
                <View style={[styles.cell, styles.columnValue,{width: 180}]}>
                  <Text>05-08-2024</Text>
                </View>
                <View style={[styles.cell, styles.columnValue,{width: 180}]}>
                  <Text>3.30 PM</Text>
                </View>
                <View style={[styles.cell, styles.columnValue,{width: 200}]}>
                  <Text>10000</Text>
                </View>
                <View style={[styles.cell, styles.columnValue,{width: 200}]}>
                  <Text>100</Text>
                </View>
              </View>
              <View style={styles.row}>
                <View style={[styles.cell, styles.columnValue,{width: 180}]}>
                  <Text>05-08-2024</Text>
                </View>
                <View style={[styles.cell, styles.columnValue,{width: 180}]}>
                  <Text>5.30 PM</Text>
                </View>
                <View style={[styles.cell, styles.columnValue,{width: 200}]}>
                  <Text>10100</Text>
                </View>
                <View style={[styles.cell, styles.columnValue,{width: 200}]}>
                  <Text>20</Text>
                </View>
              </View>
            </View>
          </ScrollView>
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
              <View style={styles.row}>
                <View style={[styles.cell, styles.columnValue,{width: 120}]}>
                  <Text>1</Text>
                </View>
                <View style={[styles.cell, styles.columnValue,{width: 160}]}>
                  <Text>05-08-2024</Text>
                </View>
                <View style={[styles.cell, styles.columnValue,{width: 160}]}>
                  <Text>11.00 PM</Text>
                </View>
                <View style={[styles.cell, styles.columnValue,{width: 160}]}>
                  <Text>123</Text>
                </View>
                <View style={[styles.cell, styles.columnValue,{width: 160}]}>
                  <Text>hi</Text>
                </View>
              </View>
              <View style={styles.row}>
                <View style={[styles.cell, styles.columnValue,{width: 120}]}>
                  <Text>2</Text>
                </View>
                <View style={[styles.cell, styles.columnValue,{width: 160}]}>
                  <Text>05-08-2024</Text>
                </View>
                <View style={[styles.cell, styles.columnValue,{width: 160}]}>
                  <Text>11.00 PM</Text>
                </View>
                <View style={[styles.cell, styles.columnValue,{width: 160}]}>
                  <Text>123</Text>
                </View>
                <View style={[styles.cell, styles.columnValue,{width: 160}]}>
                  <Text>hi</Text>
                </View>
              </View>
            </View>
          </ScrollView>
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
});

export default LiveReportScreen;