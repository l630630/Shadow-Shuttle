/**
 * Shadow Shuttle Mobile App
 * Main application entry point
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { DeviceListScreen } from './src/screens/DeviceListScreen';
import { QRScannerScreen } from './src/screens/QRScannerScreen';
import { TerminalScreen } from './src/screens/TerminalScreen';

const Stack = createStackNavigator();

function App(): React.JSX.Element {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="DeviceList"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen
          name="DeviceList"
          component={DeviceListScreen}
        />
        <Stack.Screen
          name="QRScanner"
          component={QRScannerScreen}
        />
        <Stack.Screen
          name="Terminal"
          component={TerminalScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
