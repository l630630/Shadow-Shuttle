/**
 * Terminal Screen
 * Interactive SSH terminal interface
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Device } from '../types/device';
import { getSSHService, SSHConnectionConfig } from '../services/sshService';

interface TerminalScreenProps {
  route: {
    params: {
      device: Device;
    };
  };
  navigation: any;
}

export const TerminalScreen: React.FC<TerminalScreenProps> = ({
  route,
  navigation,
}) => {
  const { device } = route.params;
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [output, setOutput] = useState<string>('');
  const [input, setInput] = useState<string>('');
  const [connecting, setConnecting] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);
  const sshService = getSSHService();
  
  useEffect(() => {
    connectToDevice();
    
    return () => {
      if (sessionId) {
        sshService.disconnect(sessionId);
      }
    };
  }, []);
  
  const connectToDevice = async () => {
    try {
      setOutput('Connecting to ' + device.name + '...\n');
      
      const config: SSHConnectionConfig = {
        host: device.meshIP,
        port: device.sshPort,
        username: 'user', // TODO: Get from secure storage
        // privateKey: await getPrivateKey(), // TODO: Implement
      };
      
      const newSessionId = await sshService.connect(device, config);
      setSessionId(newSessionId);
      
      // Register callbacks
      sshService.onData(newSessionId, (data) => {
        setOutput(prev => prev + data);
        // Auto-scroll to bottom
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      });
      
      sshService.onError(newSessionId, (error) => {
        setOutput(prev => prev + `\nError: ${error.message}\n`);
      });
      
      sshService.onClose(newSessionId, () => {
        setOutput(prev => prev + '\nConnection closed.\n');
        Alert.alert(
          'Connection Closed',
          'SSH connection has been closed.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      });
      
      setConnecting(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      setOutput(prev => prev + `\nFailed to connect: ${errorMessage}\n`);
      setConnecting(false);
      
      Alert.alert(
        'Connection Failed',
        errorMessage,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
  };
  
  const handleSendCommand = async () => {
    if (!sessionId || !input.trim()) {
      return;
    }
    
    try {
      await sshService.write(sessionId, input + '\n');
      setInput('');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send command';
      Alert.alert('Error', errorMessage);
    }
  };
  
  const handleDisconnect = () => {
    Alert.alert(
      'Disconnect',
      'Are you sure you want to disconnect?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: () => {
            if (sessionId) {
              sshService.disconnect(sessionId);
            }
            navigation.goBack();
          },
        },
      ]
    );
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.deviceName}>{device.name}</Text>
          <Text style={styles.deviceInfo}>
            {device.meshIP}:{device.sshPort}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.disconnectButton}
          onPress={handleDisconnect}
        >
          <Text style={styles.disconnectButtonText}>Disconnect</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView
        ref={scrollViewRef}
        style={styles.terminalOutput}
        contentContainerStyle={styles.terminalContent}
      >
        <Text style={styles.terminalText}>{output}</Text>
      </ScrollView>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={handleSendCommand}
          placeholder="Enter command..."
          placeholderTextColor="#666"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="send"
          editable={!connecting && !!sessionId}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!sessionId || !input.trim()) && styles.sendButtonDisabled,
          ]}
          onPress={handleSendCommand}
          disabled={!sessionId || !input.trim()}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#2D2D2D',
    borderBottomWidth: 1,
    borderBottomColor: '#3D3D3D',
  },
  headerLeft: {
    flex: 1,
  },
  deviceName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  deviceInfo: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'monospace',
  },
  disconnectButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#D32F2F',
    borderRadius: 6,
  },
  disconnectButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  terminalOutput: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  terminalContent: {
    padding: 12,
  },
  terminalText: {
    fontFamily: 'monospace',
    fontSize: 14,
    color: '#00FF00',
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#2D2D2D',
    borderTopWidth: 1,
    borderTopColor: '#3D3D3D',
  },
  input: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    color: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
    fontSize: 14,
    fontFamily: 'monospace',
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#555',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
