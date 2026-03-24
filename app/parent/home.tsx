import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, fonts, spacing, borderRadius } from '../../lib/theme';
import { useAuthStore, useFamilyStore, useCheckinStore } from '../../lib/store';
import { getTodayQuestion } from '../../lib/questions';
import WeatherCard from '../../components/parent/WeatherCard';
import MessageBubble from '../../components/parent/MessageBubble';
import MoodSelector from '../../components/parent/MoodSelector';
import SOSButton from '../../components/parent/SOSButton';
import DailyQuestion from '../../components/parent/DailyQuestion';
import type { Mood, Checkin } from '../../lib/types';

export default function ParentHomeScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const weather = useFamilyStore((s) => s.weather);
  const messages = useFamilyStore((s) => s.messages);
  const todayCheckin = useCheckinStore((s) => s.todayCheckin);
  const setTodayCheckin = useCheckinStore((s) => s.setTodayCheckin);
  const [showQuestion, setShowQuestion] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening';
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const question = getTodayQuestion();
  const latestMessage = messages.find((m) => m.recipient_role === 'parent' || m.recipient_role === 'all');

  const handleMoodSelect = (mood: Mood) => {
    const checkin: Checkin = {
      id: `ck-${Date.now()}`,
      user_id: user?.id || '',
      mood,
      checked_in_at: new Date().toISOString(),
      question_id: question.id,
      question_answer: null,
      checkin_delay_minutes: 0,
      created_at: new Date().toISOString(),
    };
    setTodayCheckin(checkin);
    setCheckedIn(true);
    setShowQuestion(true);
  };

  const handleSOS = () => {
    Alert.alert(
      '🚨 SOS Sent!',
      'Your family has been notified with your location.',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting */}
        <View style={styles.greetingSection}>
          <Text style={styles.greeting}>{greeting}, {user?.name || 'Mom'}!</Text>
          <Text style={styles.date}>{dateStr}</Text>
        </View>

        {/* Weather */}
        {weather && <WeatherCard weather={weather} />}

        {/* Child Message */}
        {latestMessage && (
          <MessageBubble senderName="Sarah" content={latestMessage.content} />
        )}

        {/* Check-in done indicator */}
        {checkedIn && !showQuestion && (
          <View style={styles.doneCard}>
            <Text style={styles.doneEmoji}>✅</Text>
            <Text style={styles.doneText}>Sent! Your family knows you&apos;re OK</Text>
          </View>
        )}

        {/* Mood Check-in */}
        {!checkedIn && (
          <MoodSelector
            onSelect={handleMoodSelect}
            selectedMood={todayCheckin?.mood || null}
            disabled={!!todayCheckin}
          />
        )}

        {/* Daily Question */}
        {showQuestion && (
          <DailyQuestion
            question={question}
            onAnswer={(answer) => {
              setShowQuestion(false);
            }}
            onSkip={() => setShowQuestion(false)}
          />
        )}

        {/* Tools Row */}
        <View style={styles.toolsRow}>
          <TouchableOpacity
            style={styles.toolCard}
            onPress={() => router.push('/parent/phonebook')}
            activeOpacity={0.7}
          >
            <Text style={styles.toolEmoji}>{'\uD83D\uDCDE'}</Text>
            <Text style={styles.toolLabel}>Phonebook</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.toolCard}
            onPress={() => router.push('/parent/magnifier')}
            activeOpacity={0.7}
          >
            <Text style={styles.toolEmoji}>{'\uD83D\uDD0D'}</Text>
            <Text style={styles.toolLabel}>Magnifier</Text>
          </TouchableOpacity>
        </View>

        {/* SOS */}
        <SOSButton onTrigger={handleSOS} />

        {/* Back to welcome for demo */}
        <TouchableOpacity
          onPress={() => router.replace('/')}
          style={styles.backButton}
        >
          <Text style={styles.backText}>← Back to Demo Menu</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  greetingSection: {
    marginTop: spacing.md,
  },
  greeting: {
    fontSize: fonts.parentTitle,
    fontWeight: '800',
    color: colors.text,
  },
  date: {
    fontSize: fonts.parentSmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  doneCard: {
    backgroundColor: colors.successLight,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  doneEmoji: {
    fontSize: 48,
  },
  doneText: {
    fontSize: fonts.parentBody,
    color: colors.success,
    fontWeight: '600',
    textAlign: 'center',
  },
  toolsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  toolCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 100,
    gap: spacing.sm,
  },
  toolEmoji: {
    fontSize: 36,
  },
  toolLabel: {
    fontSize: fonts.parentBody,
    fontWeight: '700',
    color: colors.text,
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.md,
  },
  backText: {
    fontSize: fonts.parentSmall,
    color: colors.textLight,
  },
});
