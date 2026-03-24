import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors, fonts, spacing, borderRadius } from '../../lib/theme';

// --- Mock Data ---

interface TranscriptLine {
  speaker: 'AI' | 'Mom';
  text: string;
  timestamp_seconds: number;
  is_highlight?: boolean;
}

const MOCK_TRANSCRIPT: TranscriptLine[] = [
  { speaker: 'AI', text: 'Good morning! How are you feeling today?', timestamp_seconds: 0 },
  { speaker: 'Mom', text: 'Oh, I\'m doing pretty well today! I went for a walk in the garden this morning.', timestamp_seconds: 8 },
  { speaker: 'AI', text: 'That sounds lovely! How was the garden looking?', timestamp_seconds: 18 },
  { speaker: 'Mom', text: 'Beautiful! The tomatoes are really coming along. I spent about 20 minutes out there and my knee didn\'t bother me at all.', timestamp_seconds: 24, is_highlight: true },
  { speaker: 'AI', text: 'That\'s wonderful to hear about your knee! Have you been doing the exercises the doctor recommended?', timestamp_seconds: 42 },
  { speaker: 'Mom', text: 'Yes, every morning. I think they\'re really helping. And you know what else? I slept almost 7 hours last night!', timestamp_seconds: 52, is_highlight: true },
  { speaker: 'AI', text: 'Seven hours! That\'s your best in a while. What do you think helped?', timestamp_seconds: 68 },
  { speaker: 'Mom', text: 'I think the chamomile tea before bed is making a difference. And I stopped watching TV so late.', timestamp_seconds: 78 },
  { speaker: 'AI', text: 'Those are great habits. Your family will be happy to hear you\'re sleeping better. Speaking of family, any plans coming up?', timestamp_seconds: 92 },
  { speaker: 'Mom', text: 'Oh yes! I wanted to ask - do you know when the birthday party for my grandson is? I need to get him a present.', timestamp_seconds: 108, is_highlight: true },
  { speaker: 'AI', text: 'I can pass that question along to your family. Is there anything specific you\'re thinking of getting him?', timestamp_seconds: 125 },
  { speaker: 'Mom', text: 'He loves those building blocks. Maybe one of those big sets. And I want to bake him a cake too.', timestamp_seconds: 138 },
  { speaker: 'AI', text: 'That sounds like a wonderful idea! He\'ll love a homemade cake from grandma. How about we check in again tomorrow?', timestamp_seconds: 155 },
  { speaker: 'Mom', text: 'Yes, same time works for me. Thank you for chatting, dear.', timestamp_seconds: 170 },
  { speaker: 'AI', text: 'Of course! Have a wonderful rest of your day. Enjoy the garden!', timestamp_seconds: 180 },
];

const MOCK_KEY_TOPICS = [
  { topic: 'Garden', sentiment: 'positive' as const },
  { topic: 'Knee pain', sentiment: 'positive' as const },
  { topic: 'Sleep', sentiment: 'positive' as const },
  { topic: "Grandson's birthday", sentiment: 'neutral' as const },
  { topic: 'Chamomile tea', sentiment: 'positive' as const },
];

const MOCK_HIGHLIGHTS = [
  { text: 'Walked 20 minutes without knee pain', timestamp_seconds: 24 },
  { text: 'Slept 7 hours - best in weeks', timestamp_seconds: 52 },
  { text: "Asked about grandson's birthday party", timestamp_seconds: 108 },
];

const MOOD_SCORE = 8;
const DURATION_SECONDS = 272;
const CALL_DATE = new Date().toISOString();

// --- Helpers ---

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

const formatTimestamp = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const formatDuration = (seconds: number): string => {
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

// --- Component ---

export default function CallDetailScreen() {
  const router = useRouter();
  const callDate = new Date(CALL_DATE);

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
            <Text style={styles.headerTitle}>Call Detail</Text>
            <Text style={styles.headerSubtitle}>
              {callDate.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </View>
          <View style={{ width: 24 }} />
        </View>

        {/* Call Info Bar */}
        <View style={styles.infoBar}>
          <View style={styles.infoItem}>
            <Text style={styles.infoEmoji}>{'\u23F1'}</Text>
            <Text style={styles.infoValue}>{formatDuration(DURATION_SECONDS)}</Text>
            <Text style={styles.infoLabel}>Duration</Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoItem}>
            <Text style={styles.infoEmoji}>{getMoodEmoji(MOOD_SCORE)}</Text>
            <Text style={[styles.infoValue, { color: getMoodColor(MOOD_SCORE) }]}>
              {MOOD_SCORE}/10
            </Text>
            <Text style={styles.infoLabel}>Mood</Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoItem}>
            <Text style={styles.infoEmoji}>{'\u2728'}</Text>
            <Text style={styles.infoValue}>{MOCK_HIGHLIGHTS.length}</Text>
            <Text style={styles.infoLabel}>Highlights</Text>
          </View>
        </View>

        {/* Key Topics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Topics</Text>
          <View style={styles.topicsRow}>
            {MOCK_KEY_TOPICS.map((topic, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.topicPill, { backgroundColor: sentimentBg[topic.sentiment] }]}
                activeOpacity={0.7}
                onPress={() =>
                  Alert.alert(topic.topic, 'Topic history view coming in V3.1')
                }
              >
                <Text style={[styles.topicText, { color: sentimentColor[topic.sentiment] }]}>
                  {topic.topic}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Audio Player Placeholder */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Highlighted Clips</Text>
          <View style={styles.audioPlayer}>
            <Text style={styles.audioEmoji}>{'\uD83C\uDFA7'}</Text>
            <View style={styles.audioInfo}>
              <Text style={styles.audioTitle}>
                {MOCK_HIGHLIGHTS.length} highlighted moments
              </Text>
              <View style={styles.audioBar}>
                <View style={styles.audioBarFill} />
              </View>
            </View>
            <TouchableOpacity
              style={styles.playButton}
              onPress={() => Alert.alert('Coming Soon', 'Audio playback in V3.1')}
              activeOpacity={0.7}
            >
              <Text style={styles.playIcon}>{'\u25B6'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Transcript */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Full Transcript</Text>
          <View style={styles.transcriptCard}>
            {MOCK_TRANSCRIPT.map((line, i) => {
              const isAI = line.speaker === 'AI';
              return (
                <View
                  key={i}
                  style={[
                    styles.transcriptLine,
                    line.is_highlight && styles.transcriptHighlight,
                  ]}
                >
                  <View style={styles.transcriptMeta}>
                    <Text
                      style={[
                        styles.speakerLabel,
                        { color: isAI ? colors.secondary : colors.primary },
                      ]}
                    >
                      {line.speaker === 'AI' ? '\uD83E\uDD16 AI' : '\uD83D\uDC69 Mom'}
                    </Text>
                    <Text style={styles.transcriptTimestamp}>
                      {formatTimestamp(line.timestamp_seconds)}
                    </Text>
                  </View>
                  <Text style={styles.transcriptText}>{line.text}</Text>
                  {line.is_highlight && (
                    <View style={styles.highlightBadge}>
                      <Text style={styles.highlightBadgeText}>{'\u2728'} Highlight</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* Share Button */}
        <TouchableOpacity
          style={styles.shareButton}
          onPress={() =>
            Alert.alert(
              'Share Call Summary',
              'This will share the call summary with your family members.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Share', onPress: () => Alert.alert('Shared!', 'Summary sent to family.') },
              ]
            )
          }
          activeOpacity={0.7}
        >
          <Text style={styles.shareEmoji}>{'\uD83D\uDC68\u200D\uD83D\uDC69\u200D\uD83D\uDC67'}</Text>
          <Text style={styles.shareText}>Share with family</Text>
        </TouchableOpacity>

        {/* AI Badge */}
        <View style={styles.aiBadge}>
          <Text style={styles.aiBadgeText}>Transcript generated by AI</Text>
        </View>

        {/* Back */}
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>{'\u2190'} Back to Calls</Text>
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
  infoBar: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    alignItems: 'center',
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
  },
  infoEmoji: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  infoValue: {
    fontSize: fonts.subtitle,
    fontWeight: '700',
    color: colors.text,
  },
  infoLabel: {
    fontSize: fonts.tiny,
    color: colors.textSecondary,
    marginTop: 2,
  },
  infoDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: fonts.subtitle,
    fontWeight: '700',
    color: colors.text,
  },
  topicsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  topicPill: {
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
  },
  topicText: {
    fontSize: fonts.small,
    fontWeight: '600',
  },
  audioPlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  audioEmoji: {
    fontSize: 24,
  },
  audioInfo: {
    flex: 1,
  },
  audioTitle: {
    fontSize: fonts.small,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  audioBar: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
  },
  audioBarFill: {
    width: '0%',
    height: 4,
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    fontSize: 16,
    color: colors.white,
    marginLeft: 2,
  },
  transcriptCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  transcriptLine: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  transcriptHighlight: {
    backgroundColor: '#FFF9E6',
    borderRadius: borderRadius.sm,
    borderBottomWidth: 0,
    marginVertical: spacing.xs,
  },
  transcriptMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  speakerLabel: {
    fontSize: fonts.small,
    fontWeight: '700',
  },
  transcriptTimestamp: {
    fontSize: fonts.tiny,
    color: colors.textLight,
  },
  transcriptText: {
    fontSize: fonts.body,
    color: colors.text,
    lineHeight: 22,
  },
  highlightBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.warningLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginTop: spacing.xs,
  },
  highlightBadgeText: {
    fontSize: fonts.tiny,
    color: colors.warning,
    fontWeight: '600',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  shareEmoji: {
    fontSize: 20,
  },
  shareText: {
    fontSize: fonts.body,
    fontWeight: '700',
    color: colors.white,
  },
  aiBadge: {
    alignSelf: 'center',
  },
  aiBadgeText: {
    fontSize: fonts.tiny,
    color: colors.textLight,
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
});
