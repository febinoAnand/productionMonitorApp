import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { BaseURL } from '../../config/appconfig';

const DashboardScreen = () => {
  const [groups, setGroups] = useState([]);
  const intervalRef = useRef(null);
  const navigation = useNavigation();

  const checkToken = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return false;

      await axios.get(`${BaseURL}Userauth/check-token/`, {
        headers: { Authorization: `Token ${token}` },
      });

      return true;
    } catch (error) {
      console.log('Token validation failed:', error);
      return false;
    }
  };

  const fetchGroupData = async () => {
    const isTokenValid = await checkToken();
    if (!isTokenValid) {
      navigation.navigate('Login');
      return;
    }
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${BaseURL}data/dashboard-data/`, {
        headers: { Authorization: `Token ${token}` },
      });
  
      const responseData = response.data;
      if (responseData && Array.isArray(responseData.groups)) {
        const updatedGroups = responseData.groups.map(group => ({
          ...group,
          machines: group.machines.map(machine => ({
            ...machine,
            production_count: machine.production_count || 0,
            target_production: machine.target_production || 0,
          })),
        }));

        setGroups(updatedGroups.reverse());
      } else {
        console.error('Expected an array inside "groups", but received:', responseData.groups);
        setGroups([]);
      }
    } catch (error) {
      console.error('Error fetching group data:', error);
      setGroups([]);
    }
  };

  const startFetchingData = () => {
    console.log('Starting data fetch interval');
    fetchGroupData();
    intervalRef.current = setInterval(() => {
      console.log('Fetching data...');
      fetchGroupData();
    }, 20000);
  };
  
  const stopFetchingData = () => {
    if (intervalRef.current) {
      console.log('Stopping data fetch interval');
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useFocusEffect(
    useCallback(() => {
      startFetchingData();
      return () => {
        stopFetchingData();
      };
    }, [])
  );

  useEffect(() => {
    return () => {
      stopFetchingData();
    };
  }, []);

  const handleSquarePress = (machine) => {
    console.log('Selected Machine ID:', machine.machine_id);
    navigation.navigate('WORK CENTER', { id: machine.machine_id });
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollViewContent}>
      <View style={{ height: 20 }}></View>
      <View style={styles.container}>
        {groups.map((group) => {
          if (group.machines.length === 0) return null;

          return (
            <View key={group.group_id} style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeaderText}>{group.group_name}</Text>
              </View>
              <View style={styles.squareContainer}>
                {group.machines.map((machine) => (
                  <TouchableOpacity
                    key={machine.machine_id}
                    style={styles.square}
                    onPress={() => handleSquarePress(machine)}
                  >
                    <Text style={styles.squareText}>{machine.machine_name}</Text>
                    <View style={styles.oval}>
                      <Text style={styles.ovalText}>
                        {machine.production_count} / {machine.target_production}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
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
  squareContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    marginTop: 10,
  },
  square: {
    width: '32.5%',
    height: 110,
    backgroundColor: 'ghostwhite',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 1,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.1,
    shadowRadius: 5.84,
    elevation: 8,
  },
  oval: {
    width: '60%',
    height: '60%',
    top: 35,
    backgroundColor: '#59adff',
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
    bottom: 36,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
});

export default DashboardScreen;