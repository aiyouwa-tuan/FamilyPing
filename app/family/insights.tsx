import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors, fonts, spacing, borderRadius } from '../../lib/theme';
import InsightCard, { DailyInsight } from '../../components/family/InsightCard';
import ActionSuggestionCard from '../../components/family/ActionSuggestionCard';

// Mock data
const todayInsight: DailyInsight = {
  status: 'good',
  summary:
    "Mom had a great day! She checked in on time at 9:15 AM with a positive mood. Her step count is up 12% from last week, and she answered today's question with enthusiasm.",
  insights: [
    { icon: '\uD83D\uDE0A', text: 'Mood has been consistently positive for 5 days' },
    { icon: '\uD83D\uDEB6', text: 'Step count: 4,200 steps (above her weekly average)' },
    { icon: '\uD83D\uDCAC', text: 'Responded to daily question about favorite childhood memory' },
    { icon: '\u23F0', text: 'Check-in time was earlier than usual, suggesting good sleep' },
  ],
  suggestion: {
    action: 'call',
    reason:
      "Mom mentioned she's been thinking about family lately. A quick call would brighten her day!",
    priority: 'low',
  },
  weather_alert: {
    description: 'Heat advisory in effect for Mom\'s area',
    temperature: '95\u00B0F / 35\u00B0C',
    advice: 'Remind Mom to stay hydrated and avoid going outside during peak hours.',
  },
  date: new Date().toISOString(),
};

const pastInsights: DailyInsight[] = [
  {
    status: 'watch',
    summary:
      'Mom checked in a bit late today and reported feeling "okay." Her activity was lower than usual. Nothing alarming, but worth keeping an eye on.',
    insights: [
      { icon: '\u23F0', text: 'Check-in was 2 hours later than her average time' },
      { icon: '\uD83D\uDEB6', text: 'Step count dropped to 1,800 (below weekly average)' },
      { icon: '\uD83D\uDE10', text: 'Mood reported as "okay" - neutral' },
    ],
    suggestion: {
      action: 'message',
      reason:
        'A simple "thinking of you" message might help if Mom is having a quieter day.',
      priority: 'medium',
    },
    date: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    status: 'good',
    summary:
      'Another active day for Mom! She went for a morning walk and called her friend Dorothy. Very engaged and positive.',
    insights: [
      { icon: '\uD83D\uDE0A', text: 'Great mood - mentioned feeling energetic' },
      { icon: '\uD83D\uDEB6', text: 'Step count: 5,100 steps (her best this week!)' },
      { icon: '\uD83D\uDCDE', text: 'Social activity detected: phone call at 2 PM' },
    ],
    suggestion: {
      action: 'none',
      reason: 'Mom is doing great, no action needed today.',
      priority: 'low',
    },
    date: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
];

export default function InsightsScreen() {
  const router = useRouter();
  const [dismissedSuggestion, setDismissedSuggestion] = useState(false);

  const handleSuggestionAction = (action: string) => {
    if (action === 'call') {
      Linking.openURL('tel:+1234567890').catch(() => {
        Alert.alert('Unable to Call', 'Could not open the phone dialer.');
      });
    } else if (action === 'message') {
      Linking.openURL('sms:+1234567890').catch(() => {
        Alert.alert('Unable to Message', 'Could not open messaging app.');
      });
    }
  };

  const showActionSuggestion =
    !dismissedSuggestion &&
    (todayInsight.suggestion.priority === 'medium' ||
      todayInsight.suggestion.priority === 'high');

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>{'\u2190'}</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerEmoji}>{'\uD83E\uDDE0'}</Text>
            <Text style={styles.headerTitle}>AI Insights</Text>
          </View>
          <View style={styles.placeholder} />
        </View>

        {/* Today's Insight */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today</Text>
          <InsightCard
            insight={todayInsight}
            onSuggestionAction={handleSuggestionAction}
          />
        </View>

        {/* Action Suggestion (standalone) */}
        {showActionSuggestion && (
          <ActionSuggestionCard
            suggestion={todayInsight.suggestion}
            onAction={() => handleSuggestionAction(todayInsight.suggestion.action)}
            onDismiss={() => setDismissedSuggestion(true)}
          />
        )}

        {/* Weather Alert standalone */}
        {todayInsight.weather_alert && (
          <View style={styles.weatherStandalone}>
            <View style={styles.weatherRow}>
              <Text style={styles.weatherIcon}>{'\u26C5'}</Text>
              <Text style={styles.weatherLabel}>Weather Alert</Text>
            </View>
            <Text style={styles.weatherTemp}>
              {todayInsight.weather_alert.temperature}
            </Text>
            <Text style={styles.weatherDesc}>
              {todayInsight.weather_alert.description}
            </Text>
            <Text style={styles.weatherAdvice}>
              {todayInsight.weather_alert.advice}
            </Text>
          </View>
        )}

        {/* Past 7 Days */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Past Insights</Text>
          {pastInsights.map((insight, index) => (
            <InsightCard
              key={index}
              insight={insight}
              onSuggestionAction={handleSuggestionAction}
              compact
            />
          ))}
        </View>

        {/* Back to dashboard */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>{'\u2190'} Back to Dashboard</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Ask AI FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/family/chat-ai')}
        activeOpacity={0.8}
      >
        <Text style={styles.fabEmoji}>{'\uD83E\uDDE0'}</Text>
        <Text style={styles.fabText}>Ask AI</Text>
      </TouchableOpacity>
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
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  backBtnText: {
    fontSize: 20,
    color: colors.text,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerEmoji: {
    fontSize: 24,
  },
  headerTitle: {
    fontSize: fonts.title,
    fontWeight: '800',
    color: colors.text,
  },
  placeholder: {
    width: 40,
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: fonts.subtitle,
    fontWeight: '700',
    color: colors.text,
  },
  weatherStandalone: {
    backgroundColor: '#EBF5FB',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: '#3498DB',
  },
  weatherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  weatherIcon: {
    fontSize: 20,
  },
  weatherLabel: {
    fontSize: fonts.subtitle,
    fontWeight: '700',
    color: '#2980B9',
  },
  weatherTemp: {
    fontSize: fonts.title,
    fontWeight: '800',
    color: '#2C3E50',
    marginBottom: spacing.xs,
  },
  weatherDesc: {
    fontSize: fonts.body,
    color: '#2C3E50',
    marginBottom: spacing.xs,
  },
  weatherAdvice: {
    fontSize: fonts.small,
    color: '#2980B9',
    fontStyle: 'italic',
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  backText: {
    fontSize: fonts.small,
    color: colors.textLight,
  },
  fab: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fabEmoji: {
    fontSize: 20,
  },
  fabText: {
    fontSize: fonts.body,
    fontWeight: '700',
    color: colors.white,
  },
});
