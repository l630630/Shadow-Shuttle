/**
 * Account Form Component
 * 账户信息表单组件
 */

import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, spacing, borderRadius } from '../../styles/theme';
import { useTheme } from '../../hooks/useTheme';

interface AccountFormProps {
  username: string;
  email: string;
  bio: string;
  onEmailChange: (value: string) => void;
  onBioChange: (value: string) => void;
  onSave: () => void;
}

export const AccountForm: React.FC<AccountFormProps> = ({
  username,
  email,
  bio,
  onEmailChange,
  onBioChange,
  onSave,
}) => {
  const themeColors = useTheme();

  return (
    <View style={styles.form}>
      <View style={styles.formGroup}>
        <Text style={styles.label}>用户名 (不可更改)</Text>
        <View style={[styles.inputContainer, { backgroundColor: themeColors.surfaceDarker }]}>
          <TextInput
            style={[styles.input, { color: themeColors.textSecondary }]}
            value={username}
            editable={false}
          />
          <Icon name="lock" size={16} color="#475569" style={styles.icon} />
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>邮箱</Text>
        <TextInput
          style={[
            styles.inputContainer,
            styles.input,
            {
              backgroundColor: themeColors.surfaceDarker,
              color: themeColors.textPrimary,
            },
          ]}
          value={email}
          onChangeText={onEmailChange}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>简介</Text>
        <TextInput
          style={[
            styles.inputContainer,
            styles.textArea,
            {
              backgroundColor: themeColors.surfaceDarker,
              color: themeColors.textPrimary,
            },
          ]}
          value={bio}
          onChangeText={onBioChange}
          multiline
          numberOfLines={2}
          textAlignVertical="top"
        />
      </View>

      <TouchableOpacity
        style={[styles.saveButton, { backgroundColor: colors.primary }]}
        onPress={onSave}
      >
        <Text style={styles.saveButtonText}>保存更改</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  form: {
    padding: spacing.md,
  },
  formGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  icon: {
    marginLeft: spacing.sm,
  },
  textArea: {
    minHeight: 80,
    paddingTop: spacing.sm,
  },
  saveButton: {
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
