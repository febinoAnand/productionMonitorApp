import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform, ScrollView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { CheckBox, Button } from 'react-native-elements';

export default function DownloadScreen() {
  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(new Date());
  const [showFromDate, setShowFromDate] = useState(false);
  const [showToDate, setShowToDate] = useState(false);

  const [machine1, setMachine1] = useState(false);
  const [machine2, setMachine2] = useState(false);
  const [machine3, setMachine3] = useState(false);

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
      <View style={styles.machineBox}>
        <Text style={styles.header}>Machines</Text>
        <View style={styles.machineContainer}>
          <CheckBox
            title="Machine 1"
            checked={machine1}
            onPress={() => setMachine1(!machine1)}
          />
          <CheckBox
            title="Machine 2"
            checked={machine2}
            onPress={() => setMachine2(!machine2)}
          />
          <CheckBox
            title="Machine 3"
            checked={machine3}
            onPress={() => setMachine3(!machine3)}
          />
        </View>
      </View>
      <View style={styles.downloadContainer}>
        <Button
          title="Download PDF"
          buttonStyle={[styles.downloadButton, { backgroundColor: 'dodgerblue' }]}
        />
        <Button
          title="Download CSV"
          buttonStyle={[styles.downloadButton, { backgroundColor: 'dodgerblue' }]}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'ghostwhite',
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  datePicker: {
    flex: 1,
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  dateText: {
    fontSize: 16,
    marginTop: 10,
  },
  machineBox: {
    width: '100%',
    padding: 20,
    borderWidth: 1,
    borderColor: 'white',
    borderRadius: 10,
    marginBottom: 20,
    backgroundColor: "white",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.1,
    shadowRadius: 5.84,
    elevation: 8,
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  machineContainer: {
    width: '100%',
  },
  downloadContainer: {
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
  },
  downloadButton: {
    borderRadius: 50,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 10,
  },
  button: {
    backgroundColor: 'dodgerblue',
    borderRadius: 50,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
});