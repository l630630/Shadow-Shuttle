/**
 * Shadow Shuttle Mobile - Design System
 * 基于 shadow-shuttle web 版本的设计系统
 */

export const colors = {
  // Primary Colors
  primary: '#2196F3',
  primaryDark: '#1976D2',
  primaryLight: '#BBDEFB',
  
  // Background Colors
  background: {
    light: '#F5F5F5',
    dark: '#101622',
  },
  
  // Surface Colors (Cards, Modals)
  surface: {
    light: '#FFFFFF',
    dark: '#18202F',
    darker: '#111722',
  },
  
  // Border Colors
  border: {
    light: '#E0E0E0',
    dark: 'rgba(255, 255, 255, 0.05)',
    darkMedium: 'rgba(255, 255, 255, 0.1)',
  },
  
  // Text Colors
  text: {
    primary: {
      light: '#333333',
      dark: '#FFFFFF',
    },
    secondary: {
      light: '#666666',
      dark: '#94A3B8',
    },
    muted: {
      light: '#999999',
      dark: '#64748B',
    },
    disabled: {
      light: '#CCCCCC',
      dark: '#475569',
    },
  },
  
  // Status Colors
  status: {
    success: '#4CAF50',
    successLight: '#E8F5E9',
    error: '#F44336',
    errorLight: '#FFEBEE',
    warning: '#FFC107',
    warningLight: '#FFF3E0',
    info: '#2196F3',
    infoLight: '#E3F2FD',
  },
  
  // Shorthand status colors
  success: '#4CAF50',
  error: '#F44336',
  warning: '#FFC107',
  
  // Device Status
  online: '#4CAF50',
  offline: '#F44336',
  
  // Special Colors
  terminal: {
    background: '#0d1117',
    text: '#00FF00',
    prompt: '#4CAF50',
  },
  
  // Gradient Colors
  gradient: {
    primary: ['#2196F3', '#9C27B0'],
    success: ['#4CAF50', '#8BC34A'],
    danger: ['#F44336', '#E91E63'],
  },
};

export const typography = {
  // Font Families
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
    mono: 'Courier',
  },
  
  // Font Sizes
  fontSize: {
    xs: 11,
    sm: 13,
    base: 15,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
  },
  
  // Font Weights
  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    black: '900' as const,
  },
  
  // Line Heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  // Primary color shadow
  primary: {
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
};

export const layout = {
  // Container
  containerPadding: spacing.lg,
  maxWidth: 768,
  
  // Header
  headerHeight: 56,
  
  // Bottom Navigation
  bottomNavHeight: 64,
  
  // FAB
  fabSize: 56,
  fabBottom: 80,
  fabRight: 24,
};

export const animation = {
  duration: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
  easing: {
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },
};

// Helper function to get theme colors based on color scheme
export const getThemeColors = (isDarkMode: boolean) => ({
  background: isDarkMode ? colors.background.dark : colors.background.light,
  surface: isDarkMode ? colors.surface.dark : colors.surface.light,
  surfaceDarker: isDarkMode ? colors.surface.darker : colors.surface.light,
  border: isDarkMode ? colors.border.dark : colors.border.light,
  borderMedium: isDarkMode ? colors.border.darkMedium : colors.border.light,
  textPrimary: isDarkMode ? colors.text.primary.dark : colors.text.primary.light,
  textSecondary: isDarkMode ? colors.text.secondary.dark : colors.text.secondary.light,
  textMuted: isDarkMode ? colors.text.muted.dark : colors.text.muted.light,
  textDisabled: isDarkMode ? colors.text.disabled.dark : colors.text.disabled.light,
});

export default {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  layout,
  animation,
  getThemeColors,
};
