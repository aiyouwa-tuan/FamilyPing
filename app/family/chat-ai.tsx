import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors, fonts, spacing, borderRadius } from '../../lib/theme';

interface DataPoint {
  label: string;
  value: string;
}

interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
  dataPoints?: DataPoint[];
  timestamp: Date;
}

const quickQuestions = [
  'How was Mom this week?',
  'Sleep patterns?',
  'Activity trends?',
  'Mood history?',
  'Any concerns?',
];

const mockResponses: Record<string, { text: string; dataPoints: DataPoint[] }> = {
  'How was Mom this week?': {
    text: "Mom had a solid week overall! Her mood was positive on 5 out of 7 days, and she maintained a good check-in streak. Her step count averaged 3,800 steps per day, which is slightly above her monthly average. She seemed especially happy on Wednesday when she talked about her garden.",
    dataPoints: [
      { label: 'Avg Mood', value: 'Positive (5/7 days)' },
      { label: 'Avg Steps', value: '3,800/day' },
      { label: 'Check-in Streak', value: '12 days' },
      { label: 'Best Day', value: 'Wednesday' },
    ],
  },
  'Sleep patterns?': {
    text: "Based on Mom's check-in times, she's been waking up around 7:30-8:00 AM consistently this week. Her morning check-ins have been earlier than last month, which could indicate improved sleep quality. On two days, she checked in later around 10 AM, which might suggest restless nights.",
    dataPoints: [
      { label: 'Avg Wake Time', value: '7:45 AM' },
      { label: 'Earliest Check-in', value: '7:15 AM (Tue)' },
      { label: 'Latest Check-in', value: '10:20 AM (Sat)' },
      { label: 'Consistency', value: '71% on schedule' },
    ],
  },
  'Activity trends?': {
    text: "Mom's activity has been on a gentle upward trend this month! Her daily steps went from an average of 2,900 last month to 3,800 this week. She's most active in the mornings between 9-11 AM. Weekends tend to be her quieter days.",
    dataPoints: [
      { label: 'This Week Avg', value: '3,800 steps' },
      { label: 'Last Month Avg', value: '2,900 steps' },
      { label: 'Trend', value: '+31% improvement' },
      { label: 'Peak Activity', value: '9-11 AM' },
    ],
  },
  'Mood history?': {
    text: "Over the past 30 days, Mom has reported feeling great 18 days, okay 9 days, and not great 3 days. Her mood tends to dip slightly on Mondays and is best on Wednesdays and Thursdays. The three lower days correlated with rainy weather in her area.",
    dataPoints: [
      { label: 'Great Days', value: '18/30' },
      { label: 'OK Days', value: '9/30' },
      { label: 'Tough Days', value: '3/30' },
      { label: 'Best Day', value: 'Wednesday' },
    ],
  },
  'Any concerns?': {
    text: "No major concerns at this time. A few things worth noting: Mom's activity dipped last Saturday, and she checked in 2 hours late on Monday. Both are minor and could be weather-related. Her overall trend is positive with improving activity and consistent mood.",
    dataPoints: [
      { label: 'Overall Status', value: 'Good' },
      { label: 'Late Check-ins', value: '1 this week' },
      { label: 'Activity Dips', value: '1 (Saturday)' },
      { label: 'Trend', value: 'Positive' },
    ],
  },
};

const defaultResponse = {
  text: "Based on the data I have, Mom is doing well overall. Her check-ins are regular, mood is mostly positive, and activity levels are healthy for her age. Is there anything specific you'd like me to look into?",
  dataPoints: [
    { label: 'Check-in Rate', value: '95%' },
    { label: 'Avg Mood', value: 'Positive' },
    { label: 'Activity', value: 'Normal' },
  ],
};

export default function ChatAIScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'ai',
      text: "Hi! I'm your FamilyPing AI assistant. Ask me anything about Mom's wellbeing, activity, or mood patterns. You can also tap a quick question below to get started.",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedData, setExpandedData] = useState<Record<string, boolean>>({});

  const sendMessage = (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    // Simulate AI response after delay
    setTimeout(() => {
      const response = mockResponses[text.trim()] || defaultResponse;
      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        role: 'ai',
        text: response.text,
        dataPoints: response.dataPoints,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }, 1500);

    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const toggleDataPoints = (msgId: string) => {
    setExpandedData((prev) => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>{'\u2190'}</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerEmoji}>{'\uD83E\uDDE0'}</Text>
            <Text style={styles.headerTitle}>Ask AI</Text>
          </View>
          <View style={styles.placeholder} />
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          style={styles.messagesScroll}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((msg) => (
            <View
              key={msg.id}
              style={[
                styles.messageBubble,
                msg.role === 'user' ? styles.userBubble : styles.aiBubble,
              ]}
            >
              {msg.role === 'ai' && (
                <Text style={styles.aiLabel}>{'\uD83E\uDDE0'} FamilyPing AI</Text>
              )}
              <Text
                style={[
                  styles.messageText,
                  msg.role === 'user' ? styles.userText : styles.aiText,
                ]}
              >
                {msg.text}
              </Text>

              {/* Data Points (collapsible) */}
              {msg.dataPoints && msg.dataPoints.length > 0 && (
                <View style={styles.dataSection}>
                  <TouchableOpacity
                    onPress={() => toggleDataPoints(msg.id)}
                    style={styles.dataToggle}
                  >
                    <Text style={styles.dataToggleText}>
                      {expandedData[msg.id] ? '\u25BC' : '\u25B6'} Data Referenced (
                      {msg.dataPoints.length})
                    </Text>
                  </TouchableOpacity>
                  {expandedData[msg.id] && (
                    <View style={styles.dataGrid}>
                      {msg.dataPoints.map((dp, i) => (
                        <View key={i} style={styles.dataItem}>
                          <Text style={styles.dataLabel}>{dp.label}</Text>
                          <Text style={styles.dataValue}>{dp.value}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}

              <Text style={styles.timestamp}>
                {msg.timestamp.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                })}
              </Text>
            </View>
          ))}

          {/* Typing indicator */}
          {isLoading && (
            <View style={[styles.messageBubble, styles.aiBubble]}>
              <View style={styles.typingRow}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.typingText}>Analyzing data...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Quick Questions */}
        {messages.length <= 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.quickScroll}
            contentContainerStyle={styles.quickContent}
          >
            {quickQuestions.map((q, i) => (
              <TouchableOpacity
                key={i}
                style={styles.quickChip}
                onPress={() => sendMessage(q)}
                activeOpacity={0.7}
              >
                <Text style={styles.quickChipText}>{q}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Input */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            placeholder="Ask about Mom's wellbeing..."
            placeholderTextColor={colors.textLight}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={() => sendMessage(inputText)}
            blurOnSubmit
          />
          <TouchableOpacity
            style={[styles.sendBtn, !inputText.trim() && styles.sendDisabled]}
            onPress={() => sendMessage(inputText)}
            disabled={!inputText.trim() || isLoading}
            activeOpacity={0.7}
          >
            <Text style={styles.sendBtnText}>{'\u2191'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    fontSize: 18,
    color: colors.text,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerEmoji: {
    fontSize: 22,
  },
  headerTitle: {
    fontSize: fonts.subtitle,
    fontWeight: '700',
    color: colors.text,
  },
  placeholder: {
    width: 36,
  },
  messagesScroll: {
    flex: 1,
  },
  messagesContent: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
  messageBubble: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    maxWidth: '85%',
  },
  userBubble: {
    backgroundColor: colors.primary,
    alignSelf: 'flex-end',
    borderBottomRightRadius: spacing.xs,
  },
  aiBubble: {
    backgroundColor: colors.white,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  aiLabel: {
    fontSize: fonts.tiny,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  messageText: {
    fontSize: fonts.body,
    lineHeight: 22,
  },
  userText: {
    color: colors.white,
  },
  aiText: {
    color: colors.text,
  },
  dataSection: {
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  dataToggle: {
    paddingVertical: spacing.xs,
  },
  dataToggleText: {
    fontSize: fonts.small,
    color: colors.primary,
    fontWeight: '600',
  },
  dataGrid: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  dataItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
  },
  dataLabel: {
    fontSize: fonts.small,
    color: colors.textSecondary,
  },
  dataValue: {
    fontSize: fonts.small,
    fontWeight: '600',
    color: colors.text,
  },
  timestamp: {
    fontSize: fonts.tiny,
    color: colors.textLight,
    marginTop: spacing.xs,
    alignSelf: 'flex-end',
  },
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  typingText: {
    fontSize: fonts.small,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  quickScroll: {
    maxHeight: 48,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
  },
  quickContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  quickChip: {
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  quickChipText: {
    fontSize: fonts.small,
    color: colors.primary,
    fontWeight: '600',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: fonts.body,
    color: colors.text,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: {
    opacity: 0.4,
  },
  sendBtnText: {
    fontSize: 20,
    color: colors.white,
    fontWeight: '700',
  },
});
