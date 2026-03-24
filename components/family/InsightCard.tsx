import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, fonts, spacing, borderRadius } from '../../lib/theme';

interface InsightItem {
  icon: string;
  text: string;
}

interface Suggestion {
  action: 'call' | 'message' | 'none';
  reason: string;
  priority: 'low' | 'medium' | 'high';
}

interface WeatherAlert {
  description: string;
  temperature: string;
  advice: string;
}

export interface DailyInsight {
  status: 'good' | 'watch' | 'concern';
  summary: string;
  insights: InsightItem[];
  suggestion: Suggestion;
  weather_alert?: WeatherAlert;
  date: string;
}

interface InsightCardProps {
  insight: DailyInsight;
  onSuggestionAction?: (action: string) => void;
  compact?: boolean;
}

const statusConfig: Record<string, { color: string; label: string }> = {
  good: { color: colors.success, label: 'All Good' },
  watch: { color: colors.warning, label: 'Watch' },
  concern: { color: colors.danger, label: 'Concern' },
};

const priorityConfig: Record<string, { color: string; bg: string }> = {
  low: { color: colors.success, bg: colors.successLight },
  medium: { color: colors.warning, bg: colors.warningLight },
  high: { color: colors.danger, bg: colors.dangerLight },
};

export default function InsightCard({ insight, onSuggestionAction, compact }: InsightCardProps) {
  const status = statusConfig[insight.status] || statusConfig.good;
  const priority = priorityConfig[insight.suggestion.priority] || priorityConfig.low;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.statusDot, { backgroundColor: status.color }]} />
          <Text style={styles.headerTitle}>AI Daily Insight</Text>
          <View style={[styles.statusBadge, { backgroundColor: status.color + '18' }]}>
            <Text style={[styles.statusBadgeText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>
        <Text style={styles.dateText}>{formatDate(insight.date)}</Text>
      </View>

      {/* Summary */}
      <Text style={styles.summaryText} numberOfLines={compact ? 2 : undefined}>
        {insight.summary}
      </Text>

      {/* Insights bullets */}
      {!compact && insight.insights.length > 0 && (
        <View style={styles.insightsSection}>
          {insight.insights.map((item, i) => (
            <View key={i} style={styles.insightRow}>
              <Text style={styles.insightIcon}>{item.icon}</Text>
              <Text style={styles.insightText}>{item.text}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Weather Alert */}
      {!compact && insight.weather_alert && (
        <View style={styles.weatherBanner}>
          <View style={styles.weatherHeader}>
            <Text style={styles.weatherIcon}>{'\u26C5'}</Text>
            <Text style={styles.weatherTemp}>{insight.weather_alert.temperature}</Text>
          </View>
          <Text style={styles.weatherDesc}>{insight.weather_alert.description}</Text>
          <Text style={styles.weatherAdvice}>{insight.weather_alert.advice}</Text>
        </View>
      )}

      {/* Suggestion card */}
      {!compact && insight.suggestion.action !== 'none' && (
        <View style={styles.suggestionCard}>
          <View style={styles.suggestionHeader}>
            <Text style={styles.suggestionTitle}>Suggested Action</Text>
            <View style={[styles.priorityBadge, { backgroundColor: priority.bg }]}>
              <Text style={[styles.priorityText, { color: priority.color }]}>
                {insight.suggestion.priority.toUpperCase()}
              </Text>
            </View>
          </View>
          <Text style={styles.suggestionReason}>{insight.suggestion.reason}</Text>
          <TouchableOpacity
            style={styles.suggestionButton}
            onPress={() => onSuggestionAction?.(insight.suggestion.action)}
            activeOpacity={0.7}
          >
            <Text style={styles.suggestionButtonText}>
              {insight.suggestion.action === 'call' ? '\uD83D\uDCDE Call Mom' : '\uD83D\uDCAC Send Message'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* AI badge */}
      <View style={styles.aiBadge}>
        <Text style={styles.aiBadgeText}>Powered by FamilyPing AI</Text>
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
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  headerTitle: {
    fontSize: fonts.subtitle,
    fontWeight: '700',
    color: colors.text,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  statusBadgeText: {
    fontSize: fonts.tiny,
    fontWeight: '600',
  },
  dateText: {
    fontSize: fonts.tiny,
    color: colors.textSecondary,
  },
  summaryText: {
    fontSize: fonts.body,
    color: colors.text,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  insightsSection: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  insightIcon: {
    fontSize: 16,
    marginTop: 1,
  },
  insightText: {
    fontSize: fonts.small,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  weatherBanner: {
    backgroundColor: '#EBF5FB',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: '#3498DB',
  },
  weatherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  weatherIcon: {
    fontSize: 18,
  },
  weatherTemp: {
    fontSize: fonts.body,
    fontWeight: '700',
    color: '#2980B9',
  },
  weatherDesc: {
    fontSize: fonts.small,
    color: '#2C3E50',
    marginBottom: spacing.xs,
  },
  weatherAdvice: {
    fontSize: fonts.small,
    color: '#2980B9',
    fontStyle: 'italic',
  },
  suggestionCard: {
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  suggestionTitle: {
    fontSize: fonts.small,
    fontWeight: '700',
    color: colors.text,
  },
  priorityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  priorityText: {
    fontSize: fonts.tiny,
    fontWeight: '700',
  },
  suggestionReason: {
    fontSize: fonts.small,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  suggestionButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    alignSelf: 'flex-start',
  },
  suggestionButtonText: {
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
