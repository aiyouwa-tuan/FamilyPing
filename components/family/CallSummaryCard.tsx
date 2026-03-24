import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, fonts, spacing, borderRadius } from '../../lib/theme';

interface CallHighlight {
  text: string;
  timestamp_seconds: number;
}

interface KeyTopic {
  topic: string;
  sentiment: 'positive' | 'concerned' | 'neutral';
}

interface CallData {
  summary: string;
  mood_score: number;
  duration_seconds: number;
  key_topics: KeyTopic[];
  highlights: CallHighlight[];
  started_at: string;
}

interface CallSummaryCardProps {
  call: CallData;
  onListenHighlights?: () => void;
  onPress?: () => void;
}

const getMoodEmoji = (score: number): string => {
  if (score >= 9) return '\uD83E\uDD29';
  if (score >= 7) return '\uD83D\uDE0A';
  if (score >= 5) return '\uD83D\uDE42';
  if (score >= 4) return '\uD83D\uDE10';
  if (score >= 2) return '\uD83D\uDE1F';
  return '\uD83D\uDE22';
};

const getMoodColor = (score: number): string => {
  if (score >= 7) return colors.moodGreat;
  if (score >= 4) return colors.moodOk;
  return colors.moodNotGreat;
};

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const formatTimestamp = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const sentimentColor: Record<string, string> = {
  positive: colors.success,
  concerned: colors.warning,
  neutral: colors.textLight,
};

const sentimentBg: Record<string, string> = {
  positive: colors.successLight,
  concerned: colors.warningLight,
  neutral: '#F0F0F0',
};

export default function CallSummaryCard({ call, onListenHighlights, onPress }: CallSummaryCardProps) {
  const [expanded, setExpanded] = useState(false);

  const callDate = new Date(call.started_at);
  const isToday = new Date().toDateString() === callDate.toDateString();
  const dateLabel = isToday
    ? "Today's Call with Mom"
    : `Call with Mom - ${callDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={onPress ? 0.7 : 1}
      onPress={onPress}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerEmoji}>{'\uD83D\uDCDE'}</Text>
          <Text style={styles.headerTitle}>{dateLabel}</Text>
        </View>
        <Text style={styles.duration}>{formatDuration(call.duration_seconds)}</Text>
      </View>

      {/* Mood Score */}
      <View style={styles.moodRow}>
        <Text style={styles.moodLabel}>Mood</Text>
        <View style={[styles.moodBadge, { backgroundColor: getMoodColor(call.mood_score) + '18' }]}>
          <Text style={styles.moodEmoji}>{getMoodEmoji(call.mood_score)}</Text>
          <Text style={[styles.moodScore, { color: getMoodColor(call.mood_score) }]}>
            {call.mood_score}/10
          </Text>
        </View>
      </View>

      {/* Summary */}
      <Text style={styles.summaryText}>{call.summary}</Text>

      {/* Key Topics */}
      {call.key_topics.length > 0 && (
        <View style={styles.topicsRow}>
          {call.key_topics.map((topic, i) => (
            <View
              key={i}
              style={[styles.topicPill, { backgroundColor: sentimentBg[topic.sentiment] }]}
            >
              <Text style={[styles.topicText, { color: sentimentColor[topic.sentiment] }]}>
                {topic.topic}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Highlights */}
      {call.highlights.length > 0 && (
        <View style={styles.highlightsSection}>
          <TouchableOpacity
            style={styles.highlightsToggle}
            onPress={() => setExpanded(!expanded)}
            activeOpacity={0.7}
          >
            <Text style={styles.highlightsLabel}>
              {'\u2728'} Notable Moments ({call.highlights.length})
            </Text>
            <Text style={styles.expandIcon}>{expanded ? '\u25B2' : '\u25BC'}</Text>
          </TouchableOpacity>

          {expanded && (
            <View style={styles.highlightsList}>
              {call.highlights.map((h, i) => (
                <View key={i} style={styles.highlightItem}>
                  <Text style={styles.highlightTimestamp}>
                    {formatTimestamp(h.timestamp_seconds)}
                  </Text>
                  <Text style={styles.highlightText}>{h.text}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Listen button */}
      <TouchableOpacity
        style={styles.listenButton}
        onPress={onListenHighlights}
        activeOpacity={0.7}
      >
        <Text style={styles.listenEmoji}>{'\uD83C\uDFA7'}</Text>
        <Text style={styles.listenText}>Listen to highlights</Text>
      </TouchableOpacity>

      {/* AI badge */}
      <View style={styles.aiBadge}>
        <Text style={styles.aiBadgeText}>Powered by AI</Text>
      </View>
    </TouchableOpacity>
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
    flex: 1,
  },
  headerEmoji: {
    fontSize: 20,
  },
  headerTitle: {
    fontSize: fonts.subtitle,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  duration: {
    fontSize: fonts.small,
    fontWeight: '600',
    color: colors.textSecondary,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  moodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  moodLabel: {
    fontSize: fonts.small,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  moodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  moodEmoji: {
    fontSize: 18,
  },
  moodScore: {
    fontSize: fonts.small,
    fontWeight: '700',
  },
  summaryText: {
    fontSize: fonts.body,
    color: colors.text,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  topicsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  topicPill: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 1,
    borderRadius: borderRadius.full,
  },
  topicText: {
    fontSize: fonts.tiny,
    fontWeight: '600',
  },
  highlightsSection: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  highlightsToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.xs,
  },
  highlightsLabel: {
    fontSize: fonts.small,
    fontWeight: '600',
    color: colors.text,
  },
  expandIcon: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  highlightsList: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  highlightItem: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  highlightTimestamp: {
    fontSize: fonts.tiny,
    color: colors.primary,
    fontWeight: '700',
    width: 36,
  },
  highlightText: {
    fontSize: fonts.small,
    color: colors.text,
    flex: 1,
    lineHeight: 20,
  },
  listenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  listenEmoji: {
    fontSize: 16,
  },
  listenText: {
    fontSize: fonts.body,
    fontWeight: '700',
    color: colors.primary,
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
