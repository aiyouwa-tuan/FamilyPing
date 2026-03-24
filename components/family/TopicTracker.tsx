import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, spacing, borderRadius } from '../../lib/theme';

interface TrackedTopic {
  topic: string;
  sentiment: 'positive' | 'concerned' | 'neutral';
  mention_count: number;
  first_mentioned_at: string;
  last_mentioned_at: string;
}

interface TopicTrackerProps {
  topics: TrackedTopic[];
}

const sentimentDotColor: Record<string, string> = {
  positive: colors.success,
  concerned: colors.warning,
  neutral: colors.textLight,
};

const sentimentLabel: Record<string, string> = {
  positive: 'Positive',
  concerned: 'Concerned',
  neutral: 'Neutral',
};

const getDaysAgo = (dateStr: string): number => {
  const now = new Date();
  const then = new Date(dateStr);
  return Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24));
};

const formatDaysAgo = (days: number): string => {
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
};

export default function TopicTracker({ topics }: TopicTrackerProps) {
  const sorted = [...topics].sort((a, b) => b.mention_count - a.mention_count);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.headerEmoji}>{'\uD83E\uDDE0'}</Text>
        <Text style={styles.headerTitle}>Conversation Topics</Text>
      </View>
      <Text style={styles.subtitle}>Topics from AI memory across calls</Text>

      <View style={styles.topicsList}>
        {sorted.map((topic, i) => {
          const firstDays = getDaysAgo(topic.first_mentioned_at);
          const lastDays = getDaysAgo(topic.last_mentioned_at);

          return (
            <View
              key={i}
              style={[styles.topicRow, i < sorted.length - 1 && styles.topicBorder]}
            >
              <View style={styles.topicLeft}>
                <View style={styles.topicNameRow}>
                  <View
                    style={[
                      styles.sentimentDot,
                      { backgroundColor: sentimentDotColor[topic.sentiment] },
                    ]}
                  />
                  <Text style={styles.topicName}>{topic.topic}</Text>
                </View>
                <Text style={styles.topicMeta}>
                  First mentioned {firstDays} days ago {'\u00B7'} Last {formatDaysAgo(lastDays)}
                </Text>
              </View>
              <View style={styles.topicRight}>
                <Text style={styles.mentionCount}>{topic.mention_count}</Text>
                <Text style={styles.mentionLabel}>mentions</Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* AI badge */}
      <View style={styles.aiBadge}>
        <Text style={styles.aiBadgeText}>Powered by AI Memory</Text>
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
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  headerEmoji: {
    fontSize: 20,
  },
  headerTitle: {
    fontSize: fonts.subtitle,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: fonts.tiny,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  topicsList: {
    gap: 0,
    marginBottom: spacing.md,
  },
  topicRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
  },
  topicBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  topicLeft: {
    flex: 1,
    marginRight: spacing.md,
  },
  topicNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 2,
  },
  sentimentDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  topicName: {
    fontSize: fonts.body,
    fontWeight: '600',
    color: colors.text,
  },
  topicMeta: {
    fontSize: fonts.tiny,
    color: colors.textSecondary,
    marginLeft: spacing.sm + 10,
  },
  topicRight: {
    alignItems: 'center',
    minWidth: 50,
  },
  mentionCount: {
    fontSize: fonts.subtitle,
    fontWeight: '700',
    color: colors.primary,
  },
  mentionLabel: {
    fontSize: 10,
    color: colors.textSecondary,
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
