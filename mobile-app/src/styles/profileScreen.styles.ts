import { StyleSheet } from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from './theme';

export const profileScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(24, 32, 47, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 50,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },

  // Main View
  mainView: {
    flex: 1,
    padding: spacing.lg,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginBottom: spacing.xl,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    flex: 1,
    textAlign: 'center',
  },

  // User Card
  userCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    ...shadows.xl,
    overflow: 'hidden',
  },
  userCardBlob: {
    position: 'absolute',
    top: -64,
    right: -64,
    width: 128,
    height: 128,
    backgroundColor: `${colors.primary}1A`,
    borderRadius: 64,
  },
  userCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: spacing.lg,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 16,
    height: 16,
    backgroundColor: colors.success,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#18202F',
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.primary}1A`,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
    gap: 4,
  },
  badgeText: {
    fontSize: typography.fontSize.xs,
    fontFamily: 'monospace',
    color: colors.primary,
  },

  // Stats
  statsContainer: {
    flexDirection: 'row',
    paddingTop: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    color: '#64748B',
    textTransform: 'uppercase',
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 0.5,
  },

  // Menu Section
  menuSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
    marginLeft: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: typography.fontSize.xs,
  },

  // Logout Button
  logoutButton: {
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing['3xl'],
  },
  logoutButtonText: {
    color: colors.error,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },

  // Sub View
  subViewContainer: {
    flex: 1,
  },
  subViewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(100,116,139,0.5)',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subViewTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  subViewContent: {
    flex: 1,
    padding: spacing.lg,
  },

  // Privacy Shield Card
  privacyShieldCard: {
    flexDirection: 'row',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(100,116,139,0.3)',
    ...shadows.lg,
  },
  privacyShieldLeft: {
    flex: 2,
    justifyContent: 'space-between',
  },
  privacyShieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  privacyShieldTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
  },
  privacyShieldDesc: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.lg,
  },
  privacyShieldToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  privacyShieldStatus: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  privacyShieldRight: {
    width: 96,
    borderRadius: borderRadius.md,
    backgroundColor: '#94A3B8',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginLeft: spacing.lg,
  },
  privacyShieldImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: `${colors.primary}66`,
  },

  // Settings Section
  settingsSection: {
    marginBottom: spacing.xl,
  },
  settingsSectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.sm,
  },

  // Controls List
  controlsList: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  controlItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  controlItemLeft: {
    flex: 1,
  },
  controlItemTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    marginBottom: 2,
  },
  controlItemDesc: {
    fontSize: typography.fontSize.xs,
  },
  controlItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  controlItemValue: {
    fontSize: typography.fontSize.sm,
  },

  // AI Providers
  aiProvidersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: spacing.sm,
  },
  aiConnectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  aiConnectedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  aiConnectedText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.primary,
  },
  aiProviderActive: {
    backgroundColor: '#18202F',
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    borderColor: colors.primary,
    marginBottom: spacing.md,
    ...shadows.lg,
    overflow: 'hidden',
  },
  aiProviderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiProviderActiveBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderBottomLeftRadius: borderRadius.md,
  },
  aiProviderActiveBadgeText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  aiProviderInactive: {
    backgroundColor: '#18202F',
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(100,116,139,0.5)',
    marginBottom: spacing.md,
  },
  aiProviderIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  aiProviderContent: {
    flex: 1,
  },
  aiProviderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 2,
  },
  aiProviderTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  aiProviderDesc: {
    fontSize: typography.fontSize.xs,
  },
  aiProviderRadioActive: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 5,
    borderColor: colors.primary,
    backgroundColor: '#FFFFFF',
    marginRight: 4,
  },
  aiProviderRadioInactive: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#475569',
    marginRight: 4,
  },

  // AI Key Section
  aiKeySection: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(100,116,139,0.3)',
  },
  aiKeyDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(100,116,139,0.3)',
    marginBottom: spacing.sm,
  },
  aiKeyText: {
    flex: 1,
    fontSize: typography.fontSize.xs,
    fontFamily: 'monospace',
  },
  aiKeyValidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  aiKeyValidText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.semibold,
  },
  aiKeyActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'flex-end',
  },
  aiKeyActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(100,116,139,0.3)',
  },
  aiKeyActionText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.semibold,
  },
  aiKeyInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(100,116,139,0.3)',
    marginBottom: spacing.sm,
  },
  aiKeyTextInput: {
    flex: 1,
    fontSize: typography.fontSize.xs,
    fontFamily: 'monospace',
    padding: 0,
  },
  aiKeyEyeButton: {
    padding: 4,
  },
  aiKeySaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
  },
  aiKeySaveText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  aiKeyHint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: spacing.xs,
  },
  aiKeyHintText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 14,
  },

  // Account Form
  accountForm: {
    gap: spacing.lg,
  },
  formGroup: {
    gap: spacing.sm,
  },
  formLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: '#64748B',
    textTransform: 'uppercase',
  },
  formInputContainer: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#475569',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  formInput: {
    fontSize: typography.fontSize.sm,
    flex: 1,
    padding: 0,
  },
  formInputIcon: {
    marginLeft: spacing.sm,
  },
  formTextArea: {
    height: 60,
    textAlignVertical: 'top',
    paddingTop: spacing.md,
  },
  saveButton: {
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
  },

  // Security Items
  securityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: '#475569',
    marginBottom: spacing.md,
  },
  securityItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  securityItemIcon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  securityItemTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    marginBottom: 2,
  },
  securityItemDesc: {
    fontSize: 10,
    color: '#94A3B8',
  },

  // Sessions
  sessionsSection: {
    marginTop: spacing.lg,
  },
  sessionsSectionTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: '#64748B',
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  sessionItemCurrent: {
    backgroundColor: 'rgba(33,150,243,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(33,150,243,0.2)',
  },
  sessionInfo: {
    flex: 1,
  },
  sessionDevice: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    marginBottom: 2,
  },
  sessionLocation: {
    fontSize: 10,
  },
  sessionKickButton: {
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  sessionKickText: {
    fontSize: 10,
    color: colors.error,
  },
  sessionsEmpty: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  sessionsEmptyText: {
    fontSize: 10,
    color: '#475569',
  },

  // Password Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 320,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#475569',
    ...shadows.xl,
  },
  modalTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.lg,
  },
  modalForm: {
    gap: spacing.md,
  },
  modalFormGroup: {
    gap: spacing.xs,
  },
  modalLabel: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  modalInput: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#475569',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.sm,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  modalButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
  },
  modalButtonCancel: {
    backgroundColor: '#475569',
  },
  modalButtonCancelText: {
    color: '#CBD5E1',
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  modalButtonSave: {
    backgroundColor: colors.primary,
  },
  modalButtonSaveText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  modalButtonDisabled: {
    opacity: 0.5,
  },

  // Version Footer
  versionFooter: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  versionText: {
    fontSize: 10,
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: typography.fontWeight.semibold,
  },
});
