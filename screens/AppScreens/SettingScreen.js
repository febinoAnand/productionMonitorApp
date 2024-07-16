import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Input, Text, Button } from 'react-native-elements';
import Icon from 'react-native-vector-icons/FontAwesome';

export default function SettingScreen() {
  const [username, setUsername] = React.useState('');
  const [mobileNo, setMobileNo] = React.useState('');
  const [designation, setDesignation] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [appVersion, setAppVersion] = React.useState('');
  const [lastLogin, setLastLogin] = React.useState('');

  const handleLogout = () => {
    console.log("Logging Out");
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.box}>
        <Text style={styles.header}>Profile</Text>
        <Input
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          leftIcon={<Icon name="user" type="font-awesome" size={24} color="dodgerblue" />}
          inputStyle={styles.inputStyle}
        />
        <Input
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          leftIcon={<Icon name="envelope" type="font-awesome" size={24} color="dodgerblue" />}
          inputStyle={styles.inputStyle}
        />
        <View style={styles.rowContainer}>
          <Input
            placeholder="Designation"
            value={designation}
            onChangeText={setDesignation}
            autoCapitalize="words"
            leftIcon={<Icon name="briefcase" type="font-awesome" size={24} color="dodgerblue" />}
            inputStyle={styles.inputStyle}
            containerStyle={styles.inputContainer}
          />
          <Input
            placeholder="Mobile No"
            value={mobileNo}
            onChangeText={setMobileNo}
            keyboardType="phone-pad"
            leftIcon={<Icon name="phone" type="font-awesome" size={24} color="dodgerblue" />}
            inputStyle={styles.inputStyle}
            containerStyle={styles.inputContainer}
          />
        </View>
      </View>
      <View style={styles.box}>
        <Text style={styles.header}>Device</Text>
        <Input
          placeholder="App Version"
          value={appVersion}
          onChangeText={setAppVersion}
          autoCapitalize="none"
          leftIcon={<Icon name="mobile" type="font-awesome" size={24} color="dodgerblue" />}
          inputStyle={styles.inputStyle}
        />
        <Input
          placeholder="Last Login"
          value={lastLogin}
          onChangeText={setLastLogin}
          autoCapitalize="none"
          leftIcon={<Icon name="clock-o" type="font-awesome" size={24} color="dodgerblue" />}
          inputStyle={styles.inputStyle}
        />
      </View>
      <View style={styles.logoutButtonContainer}>
        <Button
          title="Logout"
          onPress={handleLogout}
          buttonStyle={styles.logoutButton}
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
  box: {
    width: '90%',
    padding: 20,
    borderWidth: 1,
    borderColor: 'white',
    borderRadius: 10,
    backgroundColor: 'white',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    marginBottom: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: 'white',
    paddingVertical: 10,
    borderRadius: 5,
    backgroundColor: 'dodgerblue',
  },
  inputStyle: {
    fontSize: 16,
    marginLeft: 10,
    color: 'black',
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  inputContainer: {
    flex: 1,
    marginRight: 10,
  },
  logoutButtonContainer: {
    width: '90%',
    alignItems: 'center',
  },
  logoutButton: {
    backgroundColor: 'dodgerblue',
    borderRadius: 50,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 10,
  },
});