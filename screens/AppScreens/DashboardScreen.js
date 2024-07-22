import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { BaseURL } from '../../config/appconfig';

const DashboardScreen = () => {
  const [orientation, setOrientation] = useState(ScreenOrientation.Orientation.UNKNOWN);
  const [groups, setGroups] = useState([]);
  const navigation = useNavigation();

  useEffect(() => {
    const lockOrientation = async () => {
      await ScreenOrientation.lockAsync(ScreenOrientation.Orientation.PORTRAIT_UP);
      setOrientation(ScreenOrientation.Orientation.PORTRAIT_UP);
    };

    lockOrientation();

    const orientationChangeListener = ({ orientationInfo }) => {
      setOrientation(orientationInfo.orientation);
    };

    const subscription = ScreenOrientation.addOrientationChangeListener(orientationChangeListener);
    return () => {
      ScreenOrientation.removeOrientationChangeListener(subscription);
    };
  }, []);

  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        const response = await axios.get(`${BaseURL}data/dashboard/`);
        if (Array.isArray(response.data)) {
          setGroups(response.data);
        } else {
          console.error('Invalid response structure:', response.data);
          setGroups([]);
        }
      } catch (error) {
        console.error('Error fetching group data:', error);
        setGroups([]);
      }
    };

    fetchGroupData();
  }, []);

  const handleSquarePress = (machineName) => {
    navigation.navigate('WORK CENTER', { machineName });
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollViewContent}>
      <View style={styles.container}>
        {groups.map((group) => {
          const numberOfMachines = group.machines.length;
          const rows = Math.ceil(numberOfMachines / 3);
          const rectangleHeight = rows * 120;

          return (
            <View key={group.group_id} style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeaderText}>{group.group_name}</Text>
              </View>
              <View style={[styles.rectangle, { height: rectangleHeight }]}>
                <View style={styles.squareContainer}>
                  {group.machines.map((machine) => (
                    <TouchableOpacity
                      key={machine.machine_id}
                      style={styles.square}
                      onPress={() => handleSquarePress(machine.machine_name)}
                    >
                      <View style={styles.oval}>
                        <Text style={styles.ovalText}>
                          {machine.production_count} / {machine.target_production}
                        </Text>
                      </View>
                      <Text style={styles.squareText}>{machine.machine_name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollViewContent: {
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
  sectionContainer: {
    width: '90%',
    marginBottom: 20,
  },
  sectionHeader: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  sectionHeaderText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  rectangle: {
    width: '100%',
    top: 10,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: 10,
    borderRadius: 5,
    borderColor: '#ccc',
    borderWidth: 1,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.1,
    shadowRadius: 5.84,
    elevation: 8,
  },
  squareContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    height: '100%',
  },
  square: {
    width: '30%',
    height: 100,
    backgroundColor: 'ghostwhite',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 5,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.1,
    shadowRadius: 5.84,
    elevation: 8,
  },
  oval: {
    width: '80%',
    height: '50%',
    bottom: 10,
    backgroundColor: 'dodgerblue',
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
  },
  ovalText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  squareText: {
    bottom: 24,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
});

export default DashboardScreen;