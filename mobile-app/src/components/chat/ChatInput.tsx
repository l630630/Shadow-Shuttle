/**
 * 聊天输入组件
 * 包含文本输入框、语音按钮、附件按钮
 */

import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, spacing, borderRadius, shadows } from '../../styles/theme';
import { useTheme } from '../../hooks/useTheme';

interface ChatInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onVoiceStart: () => void;
  onVoiceStop: () => void;
  deviceName?: string;
  isProcessing?: boolean;
  isRecording?: boolean;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChangeText,
  onSend,
  onVoiceStart,
  onVoiceStop,
  deviceName = '设备',
  isProcessing = false,
  isRecording = false,
  disabled = false,
}) => {
  const themeColors = useTheme();

  const handleAttachment = () => {
    Alert.alert('附件', '附件功能开发中...');
  };

  const canSend = value.trim().length > 0 && !isProcessing && !disabled;

  return (
    <View style={[styles.container, { backgroundColor: themeColors.surface, borderTopColor: themeColors.border }]}>
      <View style={styles.inputRow}>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: themeColors.background,
              color: themeColors.textPrimary,
              borderColor: themeColors.border,
            },
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={`发送指令给 ${deviceName}...`}
          placeholderTextColor={themeColors.textMuted}
          multiline
          maxLength={500}
          editable={!isProcessing && !isRecording && !disabled}
          keyboardType="default"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TouchableOpacity
          style={styles.attachButton}
          onPress={handleAttachment}
          activeOpacity={0.7}
          disabled={disabled}
        >
          <Icon name="attach-file" size={20} color={themeColors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.sendIconButton}
          onPress={onSend}
          disabled={!canSend}
          activeOpacity={0.7}
        >
          <Icon
            name="send"
            size={20}
            color={canSend ? colors.primary : themeColors.textMuted}
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[
          styles.voiceButton,
          { backgroundColor: isRecording ? colors.status.error : colors.primary },
          shadows.md,
        ]}
        onPressIn={onVoiceStart}
        onPressOut={onVoiceStop}
        activeOpacity={0.8}
        disabled={disabled}
      >
        <Icon name="mic" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    fontSize: 15,
    lineHeight: 20,
  },
  attachButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.xs,
  },
  sendIconButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.xs,
  },
  voiceButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
});
