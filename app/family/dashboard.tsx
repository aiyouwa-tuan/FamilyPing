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
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors, fonts, spacing, borderRadius } from '../../lib/theme';
import { useAuthStore, useFamilyStore, useCheckinStore } from '../../lib/store';
import ParentStatusCard from '../../components/family/ParentStatusCard';
import WeekCalendar from '../../components/family/WeekCalendar';

export default function FamilyDashboardScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const family = useAuthStore((s) => s.family);
  const members = useFamilyStore((s) => s.members);
  const parentStatuses = useFamilyStore((s) => s.parentStatuses);
  const messages = useFamilyStore((s) => s.messages);
  const history = useCheckinStore((s) => s.history);
  const streak = useCheckinStore((s) => s.streak);
  const [messageText, setMessageText] = useState('');
  const [messageSent, setMessageSent] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const parentMember = members.find((m) => m.role === 'parent');
  const parentStatus = parentMember ? parentStatuses[parentMember.id] : null;

  const avgCheckinTime = () => {
    if (history.length === 0) return '--';
    const totalMinutes = history.reduce((sum, c) => {
      const d = new Date(c.checked_in_at);
      return sum + d.getHours() * 60 + d.getMinutes();
    }, 0);
    const avg = totalMinutes / history.length;
    const hours = Math.floor(avg / 60);
    const mins = Math.round(avg % 60);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${displayHour}:${mins.toString().padStart(2, '0')} ${ampm}`;
  };

  const moodDistribution = () => {
    const dist = { great: 0, ok: 0, not_great: 0 };
    history.forEach((c) => dist[c.mood]++);
    return dist;
  };

  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    setMessageSent(true);
    setMessageText('');
    setTimeout(() => setMessageSent(false), 3000);
  };

  const handleCall = () => {
    if (parentMember?.phone) {
      Alert.alert('Calling Mom', `Dialing ${parentMember.phone}...`, [{ text: 'OK' }]);
    }
  };

  const dist = moodDistribution();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.appName}>FamilyPing</Text>
            <Text style={styles.familyName}>{family?.name || 'My Family'}</Text>
          </View>
          <TouchableOpacity style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.avatar_emoji || '👤'}</Text>
          </TouchableOpacity>
        </View>

        {/* Parent Status Card */}
        {parentMember && (
          <ParentStatusCard
            parent={parentMember}
            checkin={parentStatus?.checkin || null}
            streak={streak}
          />
        )}

        {/* Week Calendar */}
        <WeekCalendar checkins={history} />

        {/* Health Section */}
        <TouchableOpacity
          style={styles.healthCard}
          onPress={() => router.push('/family/health')}
          activeOpacity={0.7}
        >
          <View style={styles.healthHeader}>
            <Text style={styles.healthEmoji}>{'\u2764\uFE0F'}</Text>
            <Text style={styles.healthTitle}>Health</Text>
          </View>
          <View style={styles.healthSteps}>
            <Text style={styles.healthStepsValue}>3,600</Text>
            <Text style={styles.healthStepsLabel}>steps today</Text>
            <Text style={[styles.healthTrend, { color: colors.success }]}>{'\u2191'} 4%</Text>
          </View>
          <View style={styles.healthSummarySnippet}>
            <Text style={styles.healthSummaryIcon}>{'\uD83D\uDCCA'}</Text>
            <Text style={styles.healthSummaryText} numberOfLines={1}>
              Weekly Summary: Moderately active week, Saturday dipped...
            </Text>
          </View>
          <Text style={styles.healthTap}>Tap to view details</Text>
        </TouchableOpacity>

        {/* AI Insights Card */}
        <TouchableOpacity
          style={styles.insightsCard}
          onPress={() => router.push('/family/insights')}
          activeOpacity={0.7}
        >
          <View style={styles.insightsHeader}>
            <Text style={styles.insightsEmoji}>{'\uD83E\uDDE0'}</Text>
            <Text style={styles.insightsTitle}>AI Insights</Text>
            <View style={styles.insightsStatusDot} />
          </View>
          <Text style={styles.insightsSnippet} numberOfLines={2}>
            Mom had a great day! Checked in on time with a positive mood. Step count is up 12% from last week.
          </Text>
          <Text style={styles.insightsTap}>View insights {'\u2192'}</Text>
        </TouchableOpacity>

        {/* Voice Calls Card */}
        <TouchableOpacity
          style={styles.voiceCallCard}
          onPress={() => router.push('/family/calls')}
          activeOpacity={0.7}
        >
          <View style={styles.voiceCallHeader}>
            <Text style={styles.voiceCallEmoji}>{'\uD83D\uDCDE'}</Text>
            <Text style={styles.voiceCallTitle}>Voice Calls</Text>
            <View style={styles.voiceCallBadge}>
              <Text style={styles.voiceCallBadgeText}>V3.0</Text>
            </View>
          </View>
          {/* Show today's call summary or scheduled time */}
          {true ? (
            <View style={styles.voiceCallContent}>
              <Text style={styles.voiceCallSummaryLabel}>
                {'\uD83D\uDCDE'} Today's Call {'\uD83D\uDE0A'}
              </Text>
              <Text style={styles.voiceCallSnippet} numberOfLines={2}>
                Mom sounded cheerful today. She talked about her morning walk and mentioned sleeping much better.
              </Text>
            </View>
          ) : (
            <View style={styles.voiceCallContent}>
              <Text style={styles.voiceCallScheduled}>
                {'\uD83D\uDD52'} Scheduled for 2:00 PM
              </Text>
            </View>
          )}
          <Text style={styles.voiceCallTap}>View call insights {'\u2192'}</Text>
        </TouchableOpacity>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>⏱</Text>
            <Text style={styles.statValue}>{avgCheckinTime()}</Text>
            <Text style={styles.statLabel}>Avg check-in</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>🔥</Text>
            <Text style={styles.statValue}>{streak}</Text>
            <Text style={styles.statLabel}>Day streak</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>😊</Text>
            <Text style={styles.statValue}>{dist.great}</Text>
            <Text style={styles.statLabel}>Great days</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
            <Text style={styles.actionEmoji}>📞</Text>
            <Text style={styles.actionLabel}>Call Mom</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.actionSecondary]}
            onPress={() => setShowHistory(!showHistory)}
          >
            <Text style={styles.actionEmoji}>📋</Text>
            <Text style={styles.actionLabel}>History</Text>
          </TouchableOpacity>
        </View>

        {/* History */}
        {showHistory && (
          <View style={styles.historySection}>
            <Text style={styles.sectionTitle}>Check-in History</Text>
            {history.slice().reverse().map((c) => {
              const d = new Date(c.checked_in_at);
              const moodEmoji = { great: '😊', ok: '😐', not_great: '😔' }[c.mood];
              return (
                <View key={c.id} style={styles.historyItem}>
                  <Text style={styles.historyDate}>
                    {d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </Text>
                  <Text style={styles.historyMood}>{moodEmoji}</Text>
                  <Text style={styles.historyTime}>
                    {d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                  </Text>
                  {c.question_answer && (
                    <Text style={styles.historyAnswer} numberOfLines={1}>
                      📝 {c.question_answer}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Send Message */}
        <View style={styles.messageSection}>
          <Text style={styles.sectionTitle}>💬 Send Mom a Message</Text>
          {messageSent ? (
            <View style={styles.messageSentCard}>
              <Text style={styles.messageSentText}>✅ Message sent!</Text>
            </View>
          ) : (
            <View style={styles.messageInputRow}>
              <TextInput
                style={styles.messageInput}
                placeholder="Type a message for Mom..."
                placeholderTextColor={colors.textLight}
                value={messageText}
                onChangeText={setMessageText}
              />
              <TouchableOpacity
                style={[styles.sendButton, !messageText.trim() && styles.sendDisabled]}
                onPress={handleSendMessage}
                disabled={!messageText.trim()}
              >
                <Text style={styles.sendButtonText}>Send</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Invite Family (PRO) */}
        <TouchableOpacity style={styles.proCard} activeOpacity={0.8}>
          <Text style={styles.proEmoji}>👨‍👩‍👧</Text>
          <View style={styles.proInfo}>
            <Text style={styles.proTitle}>Invite Family Members</Text>
            <Text style={styles.proDesc}>Add siblings to share caregiving</Text>
          </View>
          <View style={styles.proBadge}>
            <Text style={styles.proBadgeText}>PRO</Text>
          </View>
        </TouchableOpacity>

        {/* Back to demo */}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  appName: {
    fontSize: fonts.title,
    fontWeight: '800',
    color: colors.primary,
  },
  familyName: {
    fontSize: fonts.small,
    color: colors.textSecondary,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
  },
  healthCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: colors.danger,
  },
  healthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  healthEmoji: {
    fontSize: 20,
  },
  healthTitle: {
    fontSize: fonts.subtitle,
    fontWeight: '700',
    color: colors.text,
  },
  healthSteps: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  healthStepsValue: {
    fontSize: fonts.title,
    fontWeight: '800',
    color: colors.text,
  },
  healthStepsLabel: {
    fontSize: fonts.small,
    color: colors.textSecondary,
  },
  healthTrend: {
    fontSize: fonts.small,
    fontWeight: '700',
  },
  healthSummarySnippet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  healthSummaryIcon: {
    fontSize: 14,
  },
  healthSummaryText: {
    fontSize: fonts.small,
    color: colors.textSecondary,
    flex: 1,
  },
  healthTap: {
    fontSize: fonts.tiny,
    color: colors.textLight,
    textAlign: 'right',
  },
  insightsCard: {
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
  insightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  insightsEmoji: {
    fontSize: 20,
  },
  insightsTitle: {
    fontSize: fonts.subtitle,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  insightsStatusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.success,
  },
  insightsSnippet: {
    fontSize: fonts.small,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  insightsTap: {
    fontSize: fonts.small,
    color: colors.secondary,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  statEmoji: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: fonts.subtitle,
    fontWeight: '700',
    color: colors.text,
  },
  statLabel: {
    fontSize: fonts.tiny,
    color: colors.textSecondary,
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  actionSecondary: {
    backgroundColor: colors.secondary,
    shadowColor: colors.secondary,
  },
  actionEmoji: {
    fontSize: 20,
  },
  actionLabel: {
    fontSize: fonts.body,
    fontWeight: '700',
    color: colors.white,
  },
  historySection: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: fonts.subtitle,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  historyDate: {
    fontSize: fonts.small,
    color: colors.textSecondary,
    width: 100,
  },
  historyMood: {
    fontSize: 20,
  },
  historyTime: {
    fontSize: fonts.small,
    color: colors.textSecondary,
    flex: 1,
  },
  historyAnswer: {
    fontSize: fonts.tiny,
    color: colors.primary,
    flex: 2,
  },
  messageSection: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  messageInputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  messageInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fonts.body,
    color: colors.text,
  },
  sendButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
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
  proCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  proEmoji: {
    fontSize: 32,
  },
  proInfo: {
    flex: 1,
  },
  proTitle: {
    fontSize: fonts.body,
    fontWeight: '700',
    color: colors.text,
  },
  proDesc: {
    fontSize: fonts.small,
    color: colors.textSecondary,
    marginTop: 2,
  },
  proBadge: {
    backgroundColor: colors.warningLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  proBadgeText: {
    fontSize: fonts.tiny,
    fontWeight: '700',
    color: colors.warning,
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  backText: {
    fontSize: fonts.small,
    color: colors.textLight,
  },
  voiceCallCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  voiceCallHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  voiceCallEmoji: {
    fontSize: 20,
  },
  voiceCallTitle: {
    fontSize: fonts.subtitle,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  voiceCallBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  voiceCallBadgeText: {
    fontSize: fonts.tiny,
    fontWeight: '700',
    color: colors.primary,
  },
  voiceCallContent: {
    marginBottom: spacing.sm,
  },
  voiceCallSummaryLabel: {
    fontSize: fonts.small,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  voiceCallSnippet: {
    fontSize: fonts.small,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  voiceCallScheduled: {
    fontSize: fonts.small,
    color: colors.textSecondary,
  },
  voiceCallTap: {
    fontSize: fonts.small,
    color: colors.primary,
    fontWeight: '600',
  },
});
