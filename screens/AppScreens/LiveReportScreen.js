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
          <Text style={styles.headerText}>MCLMI3</Text>
        </View>
        <View style={styles.tableContainer}>
          <View style={styles.row}>
            <View style={[styles.cell, styles.columnHeader]}>
              <Text>Production Count</Text>
            </View>
            <View style={[styles.cell, styles.columnValue]}>
              <Text>123</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={[styles.cell, styles.columnHeader]}>
              <Text>Shift Time</Text>
            </View>
            <View style={[styles.cell, styles.columnValue]}>
              <Text>6:30 am to 6:00 pm</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={[styles.cell, styles.columnHeader]}>
              <Text>Data</Text>
            </View>
            <View style={[styles.cell, styles.columnValue]}>
              <Text>24 May 2024 19:20 am</Text>
            </View>
          </View>
        </View>
        <View style={styles.additionalHeader}>
          <Text style={styles.additionalHeaderText}>SHIFT WISE REPORT</Text>
        </View>
        <View style={styles.shiftTextContainer}>
          <Text style={styles.shiftText}>SHIFT 1</Text>
        </View>
        <View style={styles.tableContainer1}>
          <View style={styles.row}>
            <View style={[styles.cell, styles.columnHeader, { backgroundColor: 'dodgerblue' }]}>
              <Text style={{ color: '#fff' }}>Header A</Text>
            </View>
            <View style={[styles.cell, styles.columnHeader, { backgroundColor: 'dodgerblue' }]}>
              <Text style={{ color: '#fff' }}>Header B</Text>
            </View>
            <View style={[styles.cell, styles.columnHeader, { backgroundColor: 'dodgerblue' }]}>
              <Text style={{ color: '#fff' }}>Header A</Text>
            </View>
            <View style={[styles.cell, styles.columnHeader, { backgroundColor: 'dodgerblue' }]}>
              <Text style={{ color: '#fff' }}>Header B</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={[styles.cell, styles.columnValue]}>
              <Text>Value A1</Text>
            </View>
            <View style={[styles.cell, styles.columnValue]}>
              <Text>Value B1</Text>
            </View>
            <View style={[styles.cell, styles.columnValue]}>
              <Text>Value A1</Text>
            </View>
            <View style={[styles.cell, styles.columnValue]}>
              <Text>Value B1</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={[styles.cell, styles.columnValue]}>
              <Text>Value A2</Text>
            </View>
            <View style={[styles.cell, styles.columnValue]}>
              <Text>Value B2</Text>
            </View>
            <View style={[styles.cell, styles.columnValue]}>
              <Text>Value A1</Text>
            </View>
            <View style={[styles.cell, styles.columnValue]}>
              <Text>Value B1</Text>
            </View>
          </View>
        </View>
        <View style={styles.shiftTextContainer}>
          <Text style={styles.shiftText}>SHIFT 2</Text>
        </View>
        <View style={styles.tableContainer1}>
          <View style={styles.row}>
            <View style={[styles.cell, styles.columnHeader, { backgroundColor: 'dodgerblue' }]}>
              <Text style={{ color: '#fff' }}>Header A</Text>
            </View>
            <View style={[styles.cell, styles.columnHeader, { backgroundColor: 'dodgerblue' }]}>
              <Text style={{ color: '#fff' }}>Header B</Text>
            </View>
            <View style={[styles.cell, styles.columnHeader, { backgroundColor: 'dodgerblue' }]}>
              <Text style={{ color: '#fff' }}>Header A</Text>
            </View>
            <View style={[styles.cell, styles.columnHeader, { backgroundColor: 'dodgerblue' }]}>
              <Text style={{ color: '#fff' }}>Header B</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={[styles.cell, styles.columnValue]}>
              <Text>Value A1</Text>
            </View>
            <View style={[styles.cell, styles.columnValue]}>
              <Text>Value B1</Text>
            </View>
            <View style={[styles.cell, styles.columnValue]}>
              <Text>Value A1</Text>
            </View>
            <View style={[styles.cell, styles.columnValue]}>
              <Text>Value B1</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={[styles.cell, styles.columnValue]}>
              <Text>Value A2</Text>
            </View>
            <View style={[styles.cell, styles.columnValue]}>
              <Text>Value B2</Text>
            </View>
            <View style={[styles.cell, styles.columnValue]}>
              <Text>Value A1</Text>
            </View>
            <View style={[styles.cell, styles.columnValue]}>
              <Text>Value B1</Text>
            </View>
          </View>
        </View>
        <View style={styles.shiftTextContainer}>
          <Text style={styles.shiftText}>SHIFT 3</Text>
        </View>
        <View style={styles.tableContainer1}>
          <View style={styles.row}>
            <View style={[styles.cell, styles.columnHeader, { backgroundColor: 'dodgerblue' }]}>
              <Text style={{ color: '#fff' }}>Header A</Text>
            </View>
            <View style={[styles.cell, styles.columnHeader, { backgroundColor: 'dodgerblue' }]}>
              <Text style={{ color: '#fff' }}>Header B</Text>
            </View>
            <View style={[styles.cell, styles.columnHeader, { backgroundColor: 'dodgerblue' }]}>
              <Text style={{ color: '#fff' }}>Header A</Text>
            </View>
            <View style={[styles.cell, styles.columnHeader, { backgroundColor: 'dodgerblue' }]}>
              <Text style={{ color: '#fff' }}>Header B</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={[styles.cell, styles.columnValue]}>
              <Text>Value A1</Text>
            </View>
            <View style={[styles.cell, styles.columnValue]}>
              <Text>Value B1</Text>
            </View>
            <View style={[styles.cell, styles.columnValue]}>
              <Text>Value A1</Text>
            </View>
            <View style={[styles.cell, styles.columnValue]}>
              <Text>Value B1</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={[styles.cell, styles.columnValue]}>
              <Text>Value A2</Text>
            </View>
            <View style={[styles.cell, styles.columnValue]}>
              <Text>Value B2</Text>
            </View>
            <View style={[styles.cell, styles.columnValue]}>
              <Text>Value A1</Text>
            </View>
            <View style={[styles.cell, styles.columnValue]}>
              <Text>Value B1</Text>
            </View>
          </View>
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
    marginTop: 20,
    marginBottom: 20,
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
    fontSize: 24,
    fontWeight: 'bold',
    color: 'dodgerblue',
  },
  shiftTextContainer: {
    width: '90%',
    marginTop: 10,
    marginLeft: 20,
  },
  shiftText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'dodgerblue',
  },
});

export default LiveReportScreen;
