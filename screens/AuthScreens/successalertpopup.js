import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import AntDesign from '@expo/vector-icons/AntDesign';

const SuccessAlertPopup = ({ visible, onClose, message }) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.alertContainer}>
        <Text style={styles.message}></Text>
        <AntDesign name="checkcircle" size={50} color="white" />
          <Text style={styles.message}>{message}</Text>
          <Text style={styles.message}>{"Please Wait..."}</Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertContainer: {
    backgroundColor: '#59adff',
    width: 300,
    height: 180,
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  icon: {
    marginBottom: 10,
  },
  message: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 10,
    color: 'white',
  },
  button: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  buttonText: {
    fontSize: 16,
    color: '#59adff',
    fontWeight: 'bold',
  },
});

export default SuccessAlertPopup;