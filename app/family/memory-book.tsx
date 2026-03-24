import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors, fonts, spacing, borderRadius } from '../../lib/theme';

interface MemoryEntry {
  id: string;
  date: string;
  question: string;
  answer: string;
  mood: string;
  photo?: string;
}

// Mock data grouped by month
const mockEntries: MemoryEntry[] = [
  {
    id: '1',
    date: '2026-03-24',
    question: 'What is your favorite childhood memory?',
    answer: 'Playing in the backyard with my siblings during summer. We would catch fireflies and stay out until the stars came out.',
    mood: '\uD83D\uDE0A',
  },
  {
    id: '2',
    date: '2026-03-23',
    question: 'What made you smile today?',
    answer: 'My neighbor brought over fresh cookies. We sat on the porch and chatted for an hour.',
    mood: '\uD83D\uDE04',
  },
  {
    id: '3',
    date: '2026-03-21',
    question: 'What song reminds you of your younger days?',
    answer: 'Moon River. Your father and I used to dance to it in the kitchen after dinner.',
    mood: '\uD83E\uDD72',
  },
  {
    id: '4',
    date: '2026-03-19',
    question: 'What is a skill you are proud of?',
    answer: 'My apple pie recipe! It took years to perfect. I should teach you kids before I forget the secret.',
    mood: '\uD83D\uDE0A',
  },
  {
    id: '5',
    date: '2026-03-17',
    question: 'What is the best advice you ever received?',
    answer: "My mother told me: \"Worry is like a rocking chair. It gives you something to do but doesn't get you anywhere.\"",
    mood: '\uD83D\uDE0C',
  },
  {
    id: '6',
    date: '2026-02-28',
    question: 'Tell us about a place you loved visiting.',
    answer: 'The lake house where we spent summers. The kids would swim all day and we would grill fish your dad caught.',
    mood: '\uD83D\uDE0A',
  },
  {
    id: '7',
    date: '2026-02-25',
    question: 'What is something you are grateful for?',
    answer: "My children checking on me every day. It means more than they know. I'm never really alone.",
    mood: '\u2764\uFE0F',
  },
  {
    id: '8',
    date: '2026-02-20',
    question: 'What was your first job?',
    answer: 'I worked at the five-and-dime downtown. I made 75 cents an hour and thought I was rich!',
    mood: '\uD83D\uDE04',
  },
];

function groupByMonth(entries: MemoryEntry[]): Record<string, MemoryEntry[]> {
  const groups: Record<string, MemoryEntry[]> = {};
  entries.forEach((entry) => {
    const d = new Date(entry.date);
    const key = d.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    if (!groups[key]) groups[key] = [];
    groups[key].push(entry);
  });
  return groups;
}

export default function MemoryBookScreen() {
  const router = useRouter();
  const [entries] = useState<MemoryEntry[]>(mockEntries);

  const grouped = groupByMonth(entries);
  const months = Object.keys(grouped);

  const handleExport = () => {
    Alert.alert(
      'Export Memory Book',
      'Your Memory Book PDF is being prepared. You will receive a notification when it is ready to download.',
      [{ text: 'OK' }]
    );
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  };

  if (entries.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>{'\u2190'}</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerEmoji}>{'\uD83D\uDCD6'}</Text>
            <Text style={styles.headerTitle}>Memory Book</Text>
          </View>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>{'\uD83D\uDCD6'}</Text>
          <Text style={styles.emptyTitle}>No Memories Yet</Text>
          <Text style={styles.emptyDesc}>
            When Mom answers daily questions, her responses will appear here as precious memories to cherish.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

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
            <Text style={styles.headerEmoji}>{'\uD83D\uDCD6'}</Text>
            <Text style={styles.headerTitle}>Memory Book</Text>
          </View>
          <View style={styles.placeholder} />
        </View>

        {/* Intro */}
        <View style={styles.introCard}>
          <Text style={styles.introText}>
            A collection of Mom's stories, memories, and daily reflections. Each answer is a treasure.
          </Text>
        </View>

        {/* Entries grouped by month */}
        {months.map((month) => (
          <View key={month} style={styles.monthSection}>
            <Text style={styles.monthTitle}>{month}</Text>
            {grouped[month].map((entry) => (
              <View key={entry.id} style={styles.entryCard}>
                <View style={styles.entryHeader}>
                  <Text style={styles.entryDate}>{formatDate(entry.date)}</Text>
                  <Text style={styles.entryMood}>{entry.mood}</Text>
                </View>
                <Text style={styles.entryQuestion}>{entry.question}</Text>
                <View style={styles.answerSection}>
                  <View style={styles.quoteBar} />
                  <Text style={styles.entryAnswer}>{entry.answer}</Text>
                </View>
              </View>
            ))}
          </View>
        ))}

        {/* Export Button */}
        <TouchableOpacity
          style={styles.exportButton}
          onPress={handleExport}
          activeOpacity={0.7}
        >
          <Text style={styles.exportEmoji}>{'\uD83D\uDCC4'}</Text>
          <Text style={styles.exportText}>Export as PDF</Text>
        </TouchableOpacity>

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
  introCard: {
    backgroundColor: '#FFF5E6',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#F5DEB3',
  },
  introText: {
    fontSize: fonts.body,
    color: '#8B7355',
    lineHeight: 22,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  monthSection: {
    gap: spacing.md,
  },
  monthTitle: {
    fontSize: fonts.subtitle,
    fontWeight: '700',
    color: colors.primary,
    paddingBottom: spacing.xs,
    borderBottomWidth: 2,
    borderBottomColor: colors.primaryLight,
  },
  entryCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  entryDate: {
    fontSize: fonts.small,
    color: colors.textSecondary,
  },
  entryMood: {
    fontSize: 22,
  },
  entryQuestion: {
    fontSize: fonts.body,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  answerSection: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  quoteBar: {
    width: 3,
    backgroundColor: colors.primary + '40',
    borderRadius: 2,
  },
  entryAnswer: {
    fontSize: fonts.body,
    color: colors.textSecondary,
    lineHeight: 24,
    flex: 1,
    fontStyle: 'italic',
  },
  exportButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  exportEmoji: {
    fontSize: 20,
  },
  exportText: {
    fontSize: fonts.body,
    fontWeight: '700',
    color: colors.white,
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  backText: {
    fontSize: fonts.small,
    color: colors.textLight,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  emptyEmoji: {
    fontSize: 64,
  },
  emptyTitle: {
    fontSize: fonts.title,
    fontWeight: '700',
    color: colors.text,
  },
  emptyDesc: {
    fontSize: fonts.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
