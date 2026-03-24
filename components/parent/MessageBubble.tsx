import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, spacing, borderRadius } from '../../lib/theme';

interface MessageBubbleProps {
  senderName: string;
  content: string;
}

export default function MessageBubble({ senderName, content }: MessageBubbleProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>💌 From {senderName}</Text>
      <Text style={styles.content}>{content}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  label: {
    fontSize: fonts.parentSmall,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  content: {
    fontSize: fonts.parentBody,
    color: colors.text,
    lineHeight: 30,
  },
});
