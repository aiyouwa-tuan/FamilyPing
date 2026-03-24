import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, fonts, spacing, borderRadius } from '../../lib/theme';

interface Highlight {
  text: string;
  type: 'positive' | 'neutral' | 'concern';
}

interface WeeklySummary {
  summary_text: string;
  week_start: string;
  highlights: Highlight[];
  suggestion?: {
    label: string;
    action: string;
  };
}

interface WeeklySummaryCardProps {
  summary: WeeklySummary;
  onAction?: (action: string) => void;
}

export default function WeeklySummaryCard({ summary, onAction }: WeeklySummaryCardProps) {
  const weekEnd = new Date(summary.week_start);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const highlightIcon: Record<string, string> = {
    positive: '\u2705',
    neutral: '\u2139\uFE0F',
    concern: '\u26A0\uFE0F',
  };

  const highlightColor: Record<string, string> = {
    positive: colors.success,
    neutral: colors.textSecondary,
    concern: colors.warning,
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerEmoji}>{'\uD83D\uDCCA'}</Text>
          <Text style={styles.headerTitle}>Weekly Summary</Text>
        </View>
        <Text style={styles.dateRange}>
          {formatDate(summary.week_start)} - {formatDate(weekEnd.toISOString())}
        </Text>
      </View>

      {/* Summary text */}
      <Text style={styles.summaryText}>{summary.summary_text}</Text>

      {/* Highlights */}
      {summary.highlights.length > 0 && (
        <View style={styles.highlightsSection}>
          {summary.highlights.map((h, i) => (
            <View key={i} style={styles.highlightRow}>
              <Text style={styles.highlightIcon}>{highlightIcon[h.type] || '\u2022'}</Text>
              <Text style={[styles.highlightText, { color: highlightColor[h.type] || colors.text }]}>
                {h.text}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Action button */}
      {summary.suggestion && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onAction?.(summary.suggestion!.action)}
          activeOpacity={0.7}
        >
          <Text style={styles.actionText}>{summary.suggestion.label}</Text>
        </TouchableOpacity>
      )}

      {/* AI badge */}
      <View style={styles.aiBadge}>
        <Text style={styles.aiBadgeText}>Powered by AI</Text>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
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
  dateRange: {
    fontSize: fonts.tiny,
    color: colors.textSecondary,
  },
  summaryText: {
    fontSize: fonts.body,
    color: colors.text,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  highlightsSection: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  highlightIcon: {
    fontSize: 14,
    marginTop: 2,
  },
  highlightText: {
    fontSize: fonts.small,
    flex: 1,
    lineHeight: 20,
  },
  actionButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    alignSelf: 'flex-start',
    marginBottom: spacing.md,
  },
  actionText: {
    fontSize: fonts.body,
    fontWeight: '700',
    color: colors.white,
  },
  aiBadge: {
    alignSelf: 'flex-end',
  },
  aiBadgeText: {
    fontSize: fonts.tiny,
    color: colors.textLight,
    fontStyle: 'italic',
  },
});
