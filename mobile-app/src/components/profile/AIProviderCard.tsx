/**
 * AI Provider Card Component
 * AI 提供商配置卡片组件
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { AIProvider } from '../../types/nlc';
import { colors, spacing, borderRadius } from '../../styles/theme';
import { useTheme } from '../../hooks/useTheme';

interface AIProviderCardProps {
  provider: AIProvider;
  name: string;
  description: string;
  icon: string;
  color: string;
  placeholder: string;
  isSelected: boolean;
  hasKey: boolean;
  isEditing: boolean;
  isValidating: boolean;
  isPasswordVisible: boolean;
  isSaving: boolean;
  apiKey: string;
  maskedKey: string | null;
  onSelect: () => void;
  onSave: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onCancel: () => void;
  onTogglePassword: () => void;
  onChangeText: (text: string) => void;
}

export const AIProviderCard: React.FC<AIProviderCardProps> = ({
  provider,
  name,
  description,
  icon,
  color,
  placeholder,
  isSelected,
  hasKey,
  isEditing,
  isValidating,
  isPasswordVisible,
  isSaving,
  apiKey,
  maskedKey,
  onSelect,
  onSave,
  onDelete,
  onEdit,
  onCancel,
  onTogglePassword,
  onChangeText,
}) => {
  const themeColors = useTheme();

  return (
    <View
      style={[
        isSelected ? styles.providerActive : styles.providerInactive,
        {
          backgroundColor: isSelected ? `${color}1A` : themeColors.surfaceDarker,
        },
        isSelected && { borderColor: `${color}80`, borderWidth: 2 },
      ]}
    >
      {/* Provider Header */}
      <TouchableOpacity
        style={styles.providerHeader}
        onPress={onSelect}
        activeOpacity={0.7}
        disabled={!hasKey || isValidating}
      >
        {isSelected && !isValidating && (
          <View style={[styles.activeBadge, { backgroundColor: color }]}>
            <Text style={styles.activeBadgeText}>已激活</Text>
          </View>
        )}

        <View
          style={[
            styles.providerIcon,
            { backgroundColor: isSelected ? color : 'rgba(255,255,255,0.05)' },
          ]}
        >
          <Icon
            name={icon}
            size={24}
            color={isSelected ? '#FFFFFF' : themeColors.textSecondary}
          />
        </View>

        <View style={styles.providerContent}>
          <View style={styles.providerTitleRow}>
            <Text
              style={[
                styles.providerTitle,
                { color: isSelected ? themeColors.textPrimary : '#CBD5E1' },
              ]}
            >
              {name}
            </Text>
            {isSelected && !isValidating && (
              <Icon name="verified" size={14} color={color} />
            )}
            {isValidating && <ActivityIndicator size="small" color={color} />}
          </View>
          <Text
            style={[
              styles.providerDesc,
              { color: isSelected ? themeColors.textSecondary : '#64748B' },
            ]}
          >
            {description}
          </Text>
        </View>

        {!isValidating && (
          <View
            style={
              isSelected ? styles.radioActive : styles.radioInactive
            }
          />
        )}
      </TouchableOpacity>

      {/* API Key Section */}
      {hasKey && !isEditing ? (
        // Show masked key
        <View style={styles.keySection}>
          <View style={[styles.keyDisplay, { backgroundColor: themeColors.background }]}>
            <Icon name="vpn-key" size={16} color={themeColors.textSecondary} />
            <Text style={[styles.keyText, { color: themeColors.textSecondary }]}>
              {maskedKey}
            </Text>
            <View style={[styles.validBadge, { backgroundColor: `${colors.success}1A` }]}>
              <Icon name="check-circle" size={12} color={colors.success} />
              <Text style={[styles.validText, { color: colors.success }]}>有效</Text>
            </View>
          </View>

          <View style={styles.keyActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onEdit}
              activeOpacity={0.7}
            >
              <Icon name="edit" size={16} color={themeColors.textSecondary} />
              <Text style={[styles.actionText, { color: themeColors.textSecondary }]}>
                更新
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={onDelete}
              activeOpacity={0.7}
            >
              <Icon name="delete" size={16} color={colors.error} />
              <Text style={[styles.actionText, { color: colors.error }]}>删除</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        // Show input for new/edit key
        <View style={styles.keySection}>
          <View style={[styles.keyInput, { backgroundColor: themeColors.background }]}>
            <Icon name="vpn-key" size={16} color={themeColors.textSecondary} />
            <TextInput
              style={[styles.keyTextInput, { color: themeColors.textPrimary }]}
              value={apiKey}
              onChangeText={onChangeText}
              placeholder={placeholder}
              placeholderTextColor={themeColors.textMuted}
              secureTextEntry={!isPasswordVisible}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus={isEditing}
              returnKeyType="done"
              onSubmitEditing={() => {
                if (apiKey) {
                  onSave();
                }
              }}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={onTogglePassword}
              activeOpacity={0.7}
            >
              <Icon
                name={isPasswordVisible ? 'visibility' : 'visibility-off'}
                size={20}
                color={themeColors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.keyActions}>
            {isEditing && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={onCancel}
                activeOpacity={0.7}
              >
                <Text style={[styles.actionText, { color: themeColors.textSecondary }]}>
                  取消
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.saveButton,
                { backgroundColor: color },
                (!apiKey || isSaving) && { opacity: 0.5 },
              ]}
              onPress={onSave}
              disabled={!apiKey || isSaving}
              activeOpacity={0.8}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Icon name="save" size={16} color="#FFFFFF" />
                  <Text style={styles.saveText}>保存</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.keyHint}>
            <Icon name="info-outline" size={14} color={themeColors.textMuted} />
            <Text style={[styles.keyHintText, { color: themeColors.textMuted }]}>
              密钥通过 MMKV 加密存储
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  providerActive: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  providerInactive: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  providerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  activeBadge: {
    position: 'absolute',
    top: -spacing.md,
    right: -spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  activeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  providerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  providerContent: {
    flex: 1,
  },
  providerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  providerTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: spacing.xs,
  },
  providerDesc: {
    fontSize: 13,
  },
  radioActive: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 6,
    borderColor: colors.primary,
  },
  radioInactive: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#475569',
  },
  keySection: {
    marginTop: spacing.md,
  },
  keyDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  keyText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'monospace',
    marginLeft: spacing.sm,
  },
  validBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  validText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  keyInput: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  keyTextInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'monospace',
    marginLeft: spacing.sm,
    padding: 0,
  },
  eyeButton: {
    padding: spacing.xs,
  },
  keyActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    gap: 4,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '500',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    gap: 4,
  },
  saveText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  keyHint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: 4,
  },
  keyHintText: {
    fontSize: 11,
  },
});
