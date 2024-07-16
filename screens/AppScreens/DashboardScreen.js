import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useNavigation } from '@react-navigation/native';

const DashboardScreen = () => {
  const [orientation, setOrientation] = useState(ScreenOrientation.Orientation.UNKNOWN);
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
  }, [orientation]);

  const handleSquarePress = () => {
    navigation.navigate('WORK CENTER');
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollViewContent}>
      <View style={styles.container}>
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>MCLM</Text>
          </View>
          <View style={styles.rectangle}>
            <View style={styles.squareContainer}>
              <TouchableOpacity style={styles.square} onPress={handleSquarePress}>
                <View style={styles.oval}>
                  <Text style={styles.ovalText}>Count / Targ / ct</Text>
                </View>
                <Text style={styles.squareText}>Square 1</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.square} onPress={handleSquarePress}>
                <View style={styles.oval}>
                  <Text style={styles.ovalText}>Count / Targ / ct</Text>
                </View>
                <Text style={styles.squareText}>Square 2</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.square} onPress={handleSquarePress}>
                <View style={styles.oval}>
                  <Text style={styles.ovalText}>Count / Targ / ct</Text>
                </View>
                <Text style={styles.squareText}>Square 3</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>HSGMI</Text>
          </View>
          <View style={styles.rectangle}>
            <View style={styles.squareContainer}>
              <TouchableOpacity style={styles.square} onPress={handleSquarePress}>
                <View style={styles.oval}>
                  <Text style={styles.ovalText}>Count / Targ / ct</Text>
                </View>
                <Text style={styles.squareText}>Square 4</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.square} onPress={handleSquarePress}>
                <View style={styles.oval}>
                  <Text style={styles.ovalText}>Count / Targ / ct</Text>
                </View>
                <Text style={styles.squareText}>Square 5</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.square} onPress={handleSquarePress}>
                <View style={styles.oval}>
                  <Text style={styles.ovalText}>Count / Targ / ct</Text>
                </View>
                <Text style={styles.squareText}>Square 6</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.rectangle}>
            <View style={styles.squareContainer}>
              <TouchableOpacity style={styles.square} onPress={handleSquarePress}>
                <View style={styles.oval}>
                  <Text style={styles.ovalText}>Count / Targ / ct</Text>
                </View>
                <Text style={styles.squareText}>Square 4</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.square} onPress={handleSquarePress}>
                <View style={styles.oval}>
                  <Text style={styles.ovalText}>Count / Targ / ct</Text>
                </View>
                <Text style={styles.squareText}>Square 5</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.square} onPress={handleSquarePress}>
                <View style={styles.oval}>
                  <Text style={styles.ovalText}>Count / Targ / ct</Text>
                </View>
                <Text style={styles.squareText}>Square 6</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.rectangle}>
            <View style={styles.squareContainer}>
              <TouchableOpacity style={styles.square} onPress={handleSquarePress}>
                <View style={styles.oval}>
                  <Text style={styles.ovalText}>Count / Targ / ct</Text>
                </View>
                <Text style={styles.squareText}>Square 4</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>CRRMI</Text>
          </View>
          <View style={styles.rectangle}>
            <View style={styles.squareContainer}>
              <TouchableOpacity style={styles.square} onPress={handleSquarePress}>
                <View style={styles.oval}>
                  <Text style={styles.ovalText}>Count / Targ / ct</Text>
                </View>
                <Text style={styles.squareText}>Square 1</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.square} onPress={handleSquarePress}>
                <View style={styles.oval}>
                  <Text style={styles.ovalText}>Count / Targ / ct</Text>
                </View>
                <Text style={styles.squareText}>Square 2</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.square} onPress={handleSquarePress}>
                <View style={styles.oval}>
                  <Text style={styles.ovalText}>Count / Targ / ct</Text>
                </View>
                <Text style={styles.squareText}>Square 3</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.rectangle}>
            <View style={styles.squareContainer}>
              <TouchableOpacity style={styles.square} onPress={handleSquarePress}>
                <View style={styles.oval}>
                  <Text style={styles.ovalText}>Count / Targ / ct</Text>
                </View>
                <Text style={styles.squareText}>Square 1</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.square} onPress={handleSquarePress}>
                <View style={styles.oval}>
                  <Text style={styles.ovalText}>Count / Targ / ct</Text>
                </View>
                <Text style={styles.squareText}>Square 2</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.square} onPress={handleSquarePress}>
                <View style={styles.oval}>
                  <Text style={styles.ovalText}>Count / Targ / ct</Text>
                </View>
                <Text style={styles.squareText}>Square 3</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.rectangle}>
            <View style={styles.squareContainer}>
              <TouchableOpacity style={styles.square} onPress={handleSquarePress}>
                <View style={styles.oval}>
                  <Text style={styles.ovalText}>Count / Targ / ct</Text>
                </View>
                <Text style={styles.squareText}>Square 1</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>CALPI</Text>
          </View>
          <View style={styles.rectangle}>
            <View style={styles.squareContainer}>
              <TouchableOpacity style={styles.square} onPress={handleSquarePress}>
                <View style={styles.oval}>
                  <Text style={styles.ovalText}>Count / Targ / ct</Text>
                </View>
                <Text style={styles.squareText}>Square 1</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
    height: 150,
    top: 10,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '100%',
  },
  square: {
    width: '33%',
    height: '100%',
    backgroundColor: 'ghostwhite',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
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
