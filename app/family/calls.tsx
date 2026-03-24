import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors, fonts, spacing, borderRadius } from '../../lib/theme';
import CallSummaryCard from '../../components/family/CallSummaryCard';
import MoodTrendChart from '../../components/family/MoodTrendChart';
import TopicTracker from '../../components/family/TopicTracker';

// --- Mock Data ---

const MOCK_LATEST_CALL = {
  id: 'call-1',
  summary:
    'Mom sounded cheerful today. She talked about her morning walk in the garden and mentioned she slept much better last night. She asked about your upcoming trip.',
  mood_score: 8,
  duration_seconds: 272,
  key_topics: [
    { topic: 'Garden', sentiment: 'positive' as const },
    { topic: 'Sleep', sentiment: 'positive' as const },
    { topic: 'Your trip', sentiment: 'neutral' as const },
    { topic: 'Knee pain', sentiment: 'concerned' as const },
  ],
  highlights: [
    { text: 'Mom said she walked 20 minutes without knee pain today', timestamp_seconds: 45 },
    { text: 'She mentioned sleeping 7 hours - best in weeks', timestamp_seconds: 112 },
    { text: "Asked about grandson's birthday party plans", timestamp_seconds: 198 },
  ],
  started_at: new Date().toISOString(),
};

const MOCK_PAST_CALLS = [
  {
    id: 'call-2',
    date: new Date(Date.now() - 1 * 86400000).toISOString(),
    duration_seconds: 315,
    mood_score: 6,
    summary_snippet: 'A quieter day. Mom mentioned some knee discomfort but enjoyed watching her shows.',
  },
  {
    id: 'call-3',
    date: new Date(Date.now() - 2 * 86400000).toISOString(),
    duration_seconds: 198,
    mood_score: 7,
    summary_snippet: 'Good conversation about the garden. She planted new tomatoes and seemed excited.',
  },
  {
    id: 'call-4',
    date: new Date(Date.now() - 3 * 86400000).toISOString(),
    duration_seconds: 420,
    mood_score: 4,
    summary_snippet: "Mom seemed a bit low. She mentioned missing Dad and didn't sleep well.",
  },
  {
    id: 'call-5',
    date: new Date(Date.now() - 5 * 86400000).toISOString(),
    duration_seconds: 256,
    mood_score: 9,
    summary_snippet: "Great mood! Grandson visited and they baked cookies together. She couldn't stop smiling.",
  },
];

const MOCK_MOOD_DATA = Array.from({ length: 30 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (29 - i));
  // Generate realistic mood data with some variation
  const base = 6.5;
  const wave = Math.sin(i * 0.3) * 1.5;
  const noise = (Math.random() - 0.5) * 2;
  const score = Math.max(1, Math.min(10, Math.round(base + wave + noise)));
  return {
    date: date.toISOString().split('T')[0],
    score,
  };
});

const MOCK_TOPICS = [
  {
    topic: 'Knee pain',
    sentiment: 'concerned' as const,
    mention_count: 12,
    first_mentioned_at: new Date(Date.now() - 25 * 86400000).toISOString(),
    last_mentioned_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    topic: "Grandson's birthday",
    sentiment: 'positive' as const,
    mention_count: 8,
    first_mentioned_at: new Date(Date.now() - 14 * 86400000).toISOString(),
    last_mentioned_at: new Date().toISOString(),
  },
  {
    topic: 'Garden',
    sentiment: 'positive' as const,
    mention_count: 15,
    first_mentioned_at: new Date(Date.now() - 28 * 86400000).toISOString(),
    last_mentioned_at: new Date().toISOString(),
  },
  {
    topic: 'Sleep',
    sentiment: 'concerned' as const,
    mention_count: 10,
    first_mentioned_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    last_mentioned_at: new Date().toISOString(),
  },
  {
    topic: 'Morning walks',
    sentiment: 'positive' as const,
    mention_count: 7,
    first_mentioned_at: new Date(Date.now() - 18 * 86400000).toISOString(),
    last_mentioned_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    topic: 'Missing Dad',
    sentiment: 'concerned' as const,
    mention_count: 4,
    first_mentioned_at: new Date(Date.now() - 22 * 86400000).toISOString(),
    last_mentioned_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    topic: 'TV shows',
    sentiment: 'neutral' as const,
    mention_count: 6,
    first_mentioned_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    last_mentioned_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    topic: 'Cooking',
    sentiment: 'positive' as const,
    mention_count: 5,
    first_mentioned_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    last_mentioned_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
];

// --- Helpers ---

const getMoodEmoji = (score: number): string => {
  if (score >= 9) return '\uD83E\uDD29';
  if (score >= 7) return '\uD83D\uDE0A';
  if (score >= 5) return '\uD83D\uDE42';
  if (score >= 4) return '\uD83D\uDE10';
  if (score >= 2) return '\uD83D\uDE1F';
  return '\uD83D\uDE22';
};

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// --- Component ---

export default function CallsScreen() {
  const router = useRouter();
  const [proxyMessage, setProxyMessage] = useState('');
  const [messageSent, setMessageSent] = useState(false);

  const handleSendProxyMessage = () => {
    if (!proxyMessage.trim()) return;
    Alert.alert(
      'Message Queued',
      'Your message will be relayed to Mom during the next AI call.',
      [{ text: 'OK' }]
    );
    setMessageSent(true);
    setProxyMessage('');
    setTimeout(() => setMessageSent(false), 3000);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
            <Text style={styles.backArrow}>{'\u2190'}</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{'\uD83D\uDCDE'} Voice Calls</Text>
            <Text style={styles.headerSubtitle}>AI call insights for Mom</Text>
          </View>
          <View style={{ width: 24 }} />
        </View>

        {/* Latest Call Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Latest Call</Text>
          <CallSummaryCard
            call={MOCK_LATEST_CALL}
            onListenHighlights={() =>
              Alert.alert('Coming Soon', 'Audio highlights will be available in V3.1')
            }
            onPress={() => router.push('/family/call-detail')}
          />
        </View>

        {/* Mood Trend */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mood Over Time</Text>
          <MoodTrendChart data={MOCK_MOOD_DATA} showDays={30} />
        </View>

        {/* Topic Tracker */}
        <View style={styles.section}>
          <TopicTracker topics={MOCK_TOPICS} />
        </View>

        {/* Proxy Message */}
        <View style={styles.section}>
          <View style={styles.proxyCard}>
            <View style={styles.proxyHeader}>
              <Text style={styles.proxyEmoji}>{'\uD83D\uDCE8'}</Text>
              <Text style={styles.proxyTitle}>Send a Message via AI</Text>
            </View>
            <Text style={styles.proxyDesc}>
              The AI will naturally relay your message during the next call with Mom.
            </Text>
            {messageSent ? (
              <View style={styles.messageSentCard}>
                <Text style={styles.messageSentText}>
                  {'\u2705'} Message queued for next call!
                </Text>
              </View>
            ) : (
              <View style={styles.messageInputRow}>
                <TextInput
                  style={styles.messageInput}
                  placeholder="e.g., Ask Mom if she needs anything from the store..."
                  placeholderTextColor={colors.textLight}
                  value={proxyMessage}
                  onChangeText={setProxyMessage}
                  multiline
                />
                <TouchableOpacity
                  style={[styles.sendButton, !proxyMessage.trim() && styles.sendDisabled]}
                  onPress={handleSendProxyMessage}
                  disabled={!proxyMessage.trim()}
                >
                  <Text style={styles.sendButtonText}>Send</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Past Calls */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Past Calls</Text>
          <View style={styles.pastCallsList}>
            {MOCK_PAST_CALLS.map((call) => {
              const d = new Date(call.date);
              return (
                <TouchableOpacity
                  key={call.id}
                  style={styles.pastCallItem}
                  activeOpacity={0.7}
                  onPress={() => router.push('/family/call-detail')}
                >
                  <View style={styles.pastCallLeft}>
                    <Text style={styles.pastCallDate}>
                      {d.toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                    <Text style={styles.pastCallDuration}>
                      {formatDuration(call.duration_seconds)}
                    </Text>
                  </View>
                  <Text style={styles.pastCallMood}>{getMoodEmoji(call.mood_score)}</Text>
                  <Text style={styles.pastCallSummary} numberOfLines={2}>
                    {call.summary_snippet}
                  </Text>
                  <Text style={styles.pastCallArrow}>{'\u203A'}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Back */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>{'\u2190'} Back to Dashboard</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  backArrow: {
    fontSize: 24,
    color: colors.text,
    padding: spacing.xs,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: fonts.title,
    fontWeight: '800',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: fonts.small,
    color: colors.textSecondary,
    marginTop: 2,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: fonts.subtitle,
    fontWeight: '700',
    color: colors.text,
  },
  proxyCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: colors.secondary,
  },
  proxyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  proxyEmoji: {
    fontSize: 20,
  },
  proxyTitle: {
    fontSize: fonts.subtitle,
    fontWeight: '700',
    color: colors.text,
  },
  proxyDesc: {
    fontSize: fonts.small,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  messageInputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-end',
  },
  messageInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fonts.body,
    color: colors.text,
    minHeight: 44,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: colors.secondary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    justifyContent: 'center',
  },
  sendDisabled: {
    opacity: 0.4,
  },
  sendButtonText: {
    fontSize: fonts.body,
    fontWeight: '700',
    color: colors.white,
  },
  messageSentCard: {
    backgroundColor: colors.successLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  messageSentText: {
    fontSize: fonts.body,
    color: colors.success,
    fontWeight: '600',
  },
  pastCallsList: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  pastCallItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pastCallLeft: {
    width: 80,
  },
  pastCallDate: {
    fontSize: fonts.small,
    fontWeight: '600',
    color: colors.text,
  },
  pastCallDuration: {
    fontSize: fonts.tiny,
    color: colors.textSecondary,
  },
  pastCallMood: {
    fontSize: 22,
  },
  pastCallSummary: {
    fontSize: fonts.small,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  pastCallArrow: {
    fontSize: 20,
    color: colors.textLight,
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  backText: {
    fontSize: fonts.small,
    color: colors.textLight,
  },
});
