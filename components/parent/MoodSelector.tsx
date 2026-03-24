import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';
import { colors, fonts, spacing, borderRadius } from '../../lib/theme';
import type { Mood } from '../../lib/types';

interface MoodSelectorProps {
  onSelect: (mood: Mood) => void;
  disabled?: boolean;
  selectedMood?: Mood | null;
}

const moodOptions: { mood: Mood; emoji: string; label: string; color: string }[] = [
  { mood: 'great', emoji: '😊', label: 'Great', color: colors.moodGreat },
  { mood: 'ok', emoji: '😐', label: 'OK', color: colors.moodOk },
  { mood: 'not_great', emoji: '😔', label: 'Not great', color: colors.moodNotGreat },
];

export default function MoodSelector({ onSelect, disabled, selectedMood }: MoodSelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>How are you feeling today?</Text>
      <View style={styles.buttons}>
        {moodOptions.map((option) => {
          const isSelected = selectedMood === option.mood;
          return (
            <TouchableOpacity
              key={option.mood}
              onPress={() => onSelect(option.mood)}
              disabled={disabled}
              activeOpacity={0.7}
              style={[
                styles.button,
                {
                  backgroundColor: isSelected ? option.color : colors.white,
                  borderColor: option.color,
                  opacity: disabled && !isSelected ? 0.4 : 1,
                  transform: [{ scale: isSelected ? 1.05 : 1 }],
                },
              ]}
            >
              <Text style={styles.emoji}>{option.emoji}</Text>
              <Text
                style={[
                  styles.label,
                  { color: isSelected ? colors.white : option.color },
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  title: {
    fontSize: fonts.parentBody,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  buttons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  button: {
    flex: 1,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    minHeight: 100,
    gap: spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emoji: {
    fontSize: 48,
  },
  label: {
    fontSize: fonts.parentSmall,
    fontWeight: '700',
  },
});
