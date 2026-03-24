import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, fonts, spacing, borderRadius } from '../../lib/theme';
import type { DailyQuestion as DailyQuestionType } from '../../lib/types';

interface DailyQuestionProps {
  question: DailyQuestionType;
  onAnswer: (answer: string) => void;
  onSkip: () => void;
}

export default function DailyQuestion({ question, onAnswer, onSkip }: DailyQuestionProps) {
  const [answer, setAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (answer.trim()) {
      onAnswer(answer.trim());
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <View style={styles.container}>
        <Text style={styles.sent}>✅ Answer sent to your family!</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>📝 Today&apos;s Question</Text>
      <Text style={styles.question}>{question.text_en}</Text>
      <TextInput
        style={styles.input}
        placeholder="Type your answer..."
        placeholderTextColor={colors.textLight}
        value={answer}
        onChangeText={setAnswer}
        multiline
        maxLength={500}
      />
      <View style={styles.actions}>
        <TouchableOpacity onPress={onSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleSubmit}
          style={[styles.sendButton, !answer.trim() && styles.sendDisabled]}
          disabled={!answer.trim()}
        >
          <Text style={styles.sendText}>Send 💌</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.secondaryLight,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  label: {
    fontSize: fonts.parentSmall,
    color: colors.secondary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  question: {
    fontSize: fonts.parentBody,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.md,
    lineHeight: 30,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fonts.parentSmall,
    color: colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    gap: spacing.md,
  },
  skipButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  skipText: {
    fontSize: fonts.parentSmall,
    color: colors.textSecondary,
  },
  sendButton: {
    backgroundColor: colors.secondary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
  },
  sendDisabled: {
    opacity: 0.4,
  },
  sendText: {
    fontSize: fonts.parentSmall,
    color: colors.white,
    fontWeight: '700',
  },
  sent: {
    fontSize: fonts.parentBody,
    color: colors.success,
    textAlign: 'center',
    fontWeight: '600',
  },
});
