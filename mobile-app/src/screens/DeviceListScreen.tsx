/**
 * Device List Screen
 * Displays all paired devices with their status
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useDeviceStore } from '../stores/deviceStore';
import { useVPNStore } from '../stores/vpnStore';
import { Device } from '../types/device';

interface DeviceListScreenProps {
  navigation: any;
}

export const DeviceListScreen: React.FC<DeviceListScreenProps> = ({ navigation }) => {
  const { devices, loading, loadDevices, refreshDeviceStatuses } = useDeviceStore();
  const { status, connect, disconnect } = useVPNStore();
  
  useEffect(() => {
    loadDevices();
    
    // Auto-refresh device statuses every 30 seconds
    const interval = setInterval(() => {
      if (status.connected) {
        refreshDeviceStatuses();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [status.connected]);
  
  const handleRefresh = async () => {
    await loadDevices();
    if (status.connected) {
      await refreshDeviceStatuses();
    }
  };
  
  const handleDevicePress = (device: Device) => {
    navigation.navigate('Terminal', { device });
  };
  
  const handleAddDevice = () => {
    navigation.navigate('QRScanner');
  };
  
  const handleVPNToggle = async () => {
    if (status.connected) {
      await disconnect();
    } else {
      await connect();
    }
  };
  
  const renderDevice = ({ item }: { item: Device }) => (
    <TouchableOpacity
      style={styles.deviceCard}
      onPress={() => handleDevicePress(item)}
    >
      <View style={styles.deviceInfo}>
        <Text style={styles.deviceName}>{item.name}</Text>
        <Text style={styles.deviceDetails}>
          {item.hostname} • {item.os}
        </Text>
        <Text style={styles.deviceIP}>{item.meshIP}</Text>
      </View>
      <View style={[
        styles.statusIndicator,
        { backgroundColor: item.online ? '#4CAF50' : '#9E9E9E' }
      ]} />
    </TouchableOpacity>
  );
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Shadow Shuttle</Text>
        <TouchableOpacity
          style={[
            styles.vpnButton,
            { backgroundColor: status.connected ? '#4CAF50' : '#2196F3' }
          ]}
          onPress={handleVPNToggle}
        >
          <Text style={styles.vpnButtonText}>
            {status.connected ? 'VPN Connected' : 'Connect VPN'}
          </Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={devices}
        renderItem={renderDevice}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No devices paired</Text>
            <Text style={styles.emptySubtext}>
              Tap the + button to add a device
            </Text>
          </View>
        }
      />
      
      <TouchableOpacity
        style={styles.addButton}
        onPress={handleAddDevice}
      >
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  vpnButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  vpnButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  deviceCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  deviceDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  deviceIP: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'monospace',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    alignSelf: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2196F3',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  addButtonText: {
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: '300',
  },
});
