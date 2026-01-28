/**
 * Fingerprint Verification Component
 * Displays device fingerprint for first-time connection verification
 */

import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

interface FingerprintVerificationProps {
  visible: boolean;
  deviceName: string;
  fingerprint: string;
  onAccept: () => void;
  onReject: () => void;
}

export const FingerprintVerification: React.FC<FingerprintVerificationProps> = ({
  visible,
  deviceName,
  fingerprint,
  onAccept,
  onReject,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onReject}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Verify Device Fingerprint</Text>
          </View>
          
          <View style={styles.content}>
            <Text style={styles.warningText}>
              The authenticity of host '{deviceName}' can't be established.
            </Text>
            
            <Text style={styles.label}>Device Fingerprint:</Text>
            <View style={styles.fingerprintContainer}>
              <Text style={styles.fingerprint}>{fingerprint}</Text>
            </View>
            
            <Text style={styles.instructionText}>
              Please verify this fingerprint matches the one displayed on the device.
            </Text>
            
            <Text style={styles.securityNote}>
              ⚠️ Only accept if you trust this device. This fingerprint will be
              saved for future connections.
            </Text>
          </View>
          
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.rejectButton]}
              onPress={onReject}
            >
              <Text style={styles.rejectButtonText}>Reject</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.acceptButton]}
              onPress={onAccept}
            >
              <Text style={styles.acceptButtonText}>Accept & Connect</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    padding: 20,
  },
  warningText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  fingerprintContainer: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  fingerprint: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#2196F3',
    lineHeight: 18,
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  securityNote: {
    fontSize: 12,
    color: '#FF9800',
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 6,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  rejectButton: {
    backgroundColor: '#F5F5F5',
  },
  rejectButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
