import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../hooks/useTheme';
import { typography, spacing } from '../styles/theme';

interface EmptyStateProps {
  icon: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
}) => {
  const themeColors = useTheme();

  return (
    <View style={styles.container}>
      <Icon name={icon} size={64} color={themeColors.textMuted} />
      <Text style={[styles.title, { color: themeColors.textPrimary }]}>
        {title}
      </Text>
      {description && (
        <Text style={[styles.description, { color: themeColors.textSecondary }]}>
          {description}
        </Text>
      )}
      {action}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['5xl'],
    paddingHorizontal: spacing.xl,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  description: {
    fontSize: typography.fontSize.base,
    textAlign: 'center',
  },
});
