import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import { colors, fonts, spacing, borderRadius } from '../../lib/theme';

interface Suggestion {
  action: 'call' | 'message' | 'none';
  reason: string;
  priority: 'low' | 'medium' | 'high';
}

interface ActionSuggestionCardProps {
  suggestion: Suggestion;
  onAction?: () => void;
  onDismiss?: () => void;
  phoneNumber?: string;
}

const priorityConfig: Record<string, { color: string; bg: string; border: string }> = {
  low: { color: colors.success, bg: colors.successLight, border: colors.success },
  medium: { color: colors.warning, bg: colors.warningLight, border: colors.warning },
  high: { color: colors.danger, bg: colors.dangerLight, border: colors.danger },
};

export default function ActionSuggestionCard({
  suggestion,
  onAction,
  onDismiss,
  phoneNumber = '+1234567890',
}: ActionSuggestionCardProps) {
  const priority = priorityConfig[suggestion.priority] || priorityConfig.low;

  const handleAction = () => {
    if (suggestion.action === 'call') {
      Linking.openURL(`tel:${phoneNumber}`).catch(() => {
        Alert.alert('Unable to Call', 'Could not open the phone dialer.');
      });
    } else if (suggestion.action === 'message') {
      Linking.openURL(`sms:${phoneNumber}`).catch(() => {
        Alert.alert('Unable to Message', 'Could not open messaging app.');
      });
    }
    onAction?.();
  };

  if (suggestion.action === 'none') return null;

  return (
    <View style={[styles.card, { borderLeftColor: priority.border }]}>
      {/* Priority Badge */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerEmoji}>
            {suggestion.action === 'call' ? '\uD83D\uDCDE' : '\uD83D\uDCAC'}
          </Text>
          <Text style={styles.headerTitle}>Suggested Action</Text>
        </View>
        <View style={[styles.priorityBadge, { backgroundColor: priority.bg }]}>
          <Text style={[styles.priorityText, { color: priority.color }]}>
            {suggestion.priority.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Reason */}
      <Text style={styles.reasonText}>{suggestion.reason}</Text>

      {/* Action Buttons */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: priority.border }]}
          onPress={handleAction}
          activeOpacity={0.7}
        >
          <Text style={styles.actionButtonText}>
            {suggestion.action === 'call' ? '\uD83D\uDCDE Call Mom' : '\uD83D\uDCAC Send Message'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.dismissButton}
          onPress={onDismiss}
          activeOpacity={0.7}
        >
          <Text style={styles.dismissText}>Later</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerEmoji: {
    fontSize: 20,
  },
  headerTitle: {
    fontSize: fonts.subtitle,
    fontWeight: '700',
    color: colors.text,
  },
  priorityBadge: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  priorityText: {
    fontSize: fonts.tiny,
    fontWeight: '700',
  },
  reasonText: {
    fontSize: fonts.body,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  actionButton: {
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
  },
  actionButtonText: {
    fontSize: fonts.body,
    fontWeight: '700',
    color: colors.white,
  },
  dismissButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  dismissText: {
    fontSize: fonts.body,
    color: colors.textLight,
    fontWeight: '600',
  },
});
