import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, spacing, borderRadius } from '../../lib/theme';
import type { Checkin, User } from '../../lib/types';

interface ParentStatusCardProps {
  parent: User;
  checkin: Checkin | null;
  streak: number;
}

export default function ParentStatusCard({ parent, checkin, streak }: ParentStatusCardProps) {
  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const moodEmoji = {
    great: '😊',
    ok: '😐',
    not_great: '😔',
  };

  const moodLabel = {
    great: 'Great',
    ok: 'OK',
    not_great: 'Not great',
  };

  const moodColor = {
    great: colors.moodGreat,
    ok: colors.moodOk,
    not_great: colors.moodNotGreat,
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.avatar}>{parent.avatar_emoji}</Text>
        <View style={styles.headerInfo}>
          <Text style={styles.name}>{parent.name}</Text>
          {checkin ? (
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: moodColor[checkin.mood] }]} />
              <Text style={styles.statusText}>
                Checked in at {formatTime(checkin.checked_in_at)}
              </Text>
            </View>
          ) : (
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: colors.warning }]} />
              <Text style={[styles.statusText, { color: colors.warning }]}>
                Hasn&apos;t checked in yet
              </Text>
            </View>
          )}
        </View>
      </View>

      {checkin && (
        <View style={styles.moodRow}>
          <Text style={styles.moodEmoji}>{moodEmoji[checkin.mood]}</Text>
          <Text style={[styles.moodText, { color: moodColor[checkin.mood] }]}>
            Feeling {moodLabel[checkin.mood]}
          </Text>
        </View>
      )}

      {streak > 0 && (
        <View style={styles.streakRow}>
          <Text style={styles.streakText}>🔥 {streak}-day streak</Text>
        </View>
      )}

      {checkin?.question_answer && (
        <View style={styles.answerCard}>
          <Text style={styles.answerLabel}>📝 Today&apos;s answer:</Text>
          <Text style={styles.answerText}>&ldquo;{checkin.question_answer}&rdquo;</Text>
        </View>
      )}
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
    gap: spacing.md,
  },
  avatar: {
    fontSize: 48,
  },
  headerInfo: {
    flex: 1,
  },
  name: {
    fontSize: fonts.title,
    fontWeight: '700',
    color: colors.text,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: fonts.body,
    color: colors.textSecondary,
  },
  moodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  moodEmoji: {
    fontSize: 28,
  },
  moodText: {
    fontSize: fonts.subtitle,
    fontWeight: '600',
  },
  streakRow: {
    marginTop: spacing.sm,
  },
  streakText: {
    fontSize: fonts.body,
    color: colors.primary,
    fontWeight: '600',
  },
  answerCard: {
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  answerLabel: {
    fontSize: fonts.small,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  answerText: {
    fontSize: fonts.body,
    color: colors.text,
    fontStyle: 'italic',
    lineHeight: 22,
  },
});
