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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors, fonts, spacing, borderRadius } from '../../lib/theme';

interface DiaryEntry {
  id: string;
  date: string;
  mood: string;
  moodLabel: string;
  journal: string;
}

const moodOptions = [
  { emoji: '\uD83D\uDE0A', label: 'Great', color: colors.moodGreat },
  { emoji: '\uD83D\uDE42', label: 'Good', color: colors.success },
  { emoji: '\uD83D\uDE10', label: 'Okay', color: colors.moodOk },
  { emoji: '\uD83D\uDE14', label: 'Low', color: colors.moodNotGreat },
  { emoji: '\uD83D\uDE22', label: 'Sad', color: colors.danger },
];

const mockEntries: DiaryEntry[] = [
  {
    id: '1',
    date: new Date(Date.now() - 86400000).toISOString(),
    mood: '\uD83D\uDE0A',
    moodLabel: 'Great',
    journal: 'Had a wonderful day! Dorothy came over for tea and we looked at old photo albums. The weather was perfect for sitting on the porch.',
  },
  {
    id: '2',
    date: new Date(Date.now() - 2 * 86400000).toISOString(),
    mood: '\uD83D\uDE42',
    moodLabel: 'Good',
    journal: 'Quiet day at home. Watched my favorite show and made soup. Sarah called in the evening which was lovely.',
  },
  {
    id: '3',
    date: new Date(Date.now() - 3 * 86400000).toISOString(),
    mood: '\uD83D\uDE10',
    moodLabel: 'Okay',
    journal: 'Feeling a bit tired today. Did not sleep well last night. Managed a short walk around the block though.',
  },
  {
    id: '4',
    date: new Date(Date.now() - 4 * 86400000).toISOString(),
    mood: '\uD83D\uDE0A',
    moodLabel: 'Great',
    journal: 'Baked apple pie with the recipe from Mom. The whole house smelled wonderful. Saved a slice for the mailman!',
  },
  {
    id: '5',
    date: new Date(Date.now() - 5 * 86400000).toISOString(),
    mood: '\uD83D\uDE42',
    moodLabel: 'Good',
    journal: 'Went to the garden center. Bought some new flowers for the front yard. Spring is on its way!',
  },
  {
    id: '6',
    date: new Date(Date.now() - 6 * 86400000).toISOString(),
    mood: '\uD83D\uDE14',
    moodLabel: 'Low',
    journal: 'Missing your father today. Some days are harder than others. But the grandkids sent me drawings which cheered me up.',
  },
  {
    id: '7',
    date: new Date(Date.now() - 7 * 86400000).toISOString(),
    mood: '\uD83D\uDE0A',
    moodLabel: 'Great',
    journal: 'Church group meeting was wonderful. We are planning a community potluck next month. I volunteered to bring my famous casserole.',
  },
];

export default function MoodDiaryScreen() {
  const router = useRouter();
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [selectedMoodLabel, setSelectedMoodLabel] = useState<string>('');
  const [journalText, setJournalText] = useState('');
  const [entries, setEntries] = useState<DiaryEntry[]>(mockEntries);
  const [todaySaved, setTodaySaved] = useState(false);

  const handleSave = () => {
    if (!selectedMood) {
      Alert.alert('Select a Mood', 'Please tap how you are feeling before saving.');
      return;
    }
    const newEntry: DiaryEntry = {
      id: `d-${Date.now()}`,
      date: new Date().toISOString(),
      mood: selectedMood,
      moodLabel: selectedMoodLabel,
      journal: journalText.trim(),
    };
    setEntries([newEntry, ...entries]);
    setTodaySaved(true);
    Alert.alert('Saved!', 'Your mood diary entry has been saved. Thank you for sharing!');
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  const now = new Date();
  const todayStr = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
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
            <Text style={styles.headerTitle}>My Mood Diary</Text>
            <View style={styles.placeholderBtn} />
          </View>

          {/* Date */}
          <Text style={styles.dateText}>{todayStr}</Text>

          {/* Today's entry */}
          {todaySaved ? (
            <View style={styles.savedCard}>
              <Text style={styles.savedEmoji}>{selectedMood}</Text>
              <Text style={styles.savedTitle}>Today's Entry Saved!</Text>
              <Text style={styles.savedText}>
                Thank you for sharing how you feel. Your family appreciates it.
              </Text>
            </View>
          ) : (
            <View style={styles.todayCard}>
              <Text style={styles.todayTitle}>How are you feeling today?</Text>
              <Text style={styles.todaySubtitle}>
                Tap the face that matches your mood
              </Text>

              {/* Mood selector - large for parent */}
              <View style={styles.moodRow}>
                {moodOptions.map((m) => (
                  <TouchableOpacity
                    key={m.label}
                    style={[
                      styles.moodOption,
                      selectedMood === m.emoji && {
                        backgroundColor: m.color + '20',
                        borderColor: m.color,
                      },
                    ]}
                    onPress={() => {
                      setSelectedMood(m.emoji);
                      setSelectedMoodLabel(m.label);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.moodEmoji}>{m.emoji}</Text>
                    <Text
                      style={[
                        styles.moodLabel,
                        selectedMood === m.emoji && { color: m.color, fontWeight: '700' },
                      ]}
                    >
                      {m.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Journal entry */}
              <Text style={styles.journalLabel}>
                Tell us more (optional)
              </Text>
              <TextInput
                style={styles.journalInput}
                placeholder="What is on your mind today?"
                placeholderTextColor={colors.textLight}
                value={journalText}
                onChangeText={setJournalText}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              {/* Save button */}
              <TouchableOpacity
                style={[styles.saveButton, !selectedMood && styles.saveDisabled]}
                onPress={handleSave}
                activeOpacity={0.7}
                disabled={!selectedMood}
              >
                <Text style={styles.saveButtonText}>Save Entry</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Past 7 Days */}
          <Text style={styles.sectionTitle}>Past 7 Days</Text>
          {entries.slice(0, 7).map((entry) => (
            <View key={entry.id} style={styles.entryCard}>
              <View style={styles.entryHeader}>
                <Text style={styles.entryMood}>{entry.mood}</Text>
                <View style={styles.entryHeaderText}>
                  <Text style={styles.entryDate}>{formatDate(entry.date)}</Text>
                  <Text style={styles.entryMoodLabel}>Feeling {entry.moodLabel}</Text>
                </View>
              </View>
              {entry.journal ? (
                <Text style={styles.entryJournal}>{entry.journal}</Text>
              ) : null}
            </View>
          ))}

          {/* Back */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Text style={styles.backText}>{'\u2190'} Back to Home</Text>
          </TouchableOpacity>
        </ScrollView>
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
    width: 48,
    height: 48,
    borderRadius: 24,
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
    fontSize: fonts.parentBody,
    color: colors.text,
  },
  headerTitle: {
    fontSize: fonts.parentTitle,
    fontWeight: '800',
    color: colors.text,
  },
  placeholderBtn: {
    width: 48,
  },
  dateText: {
    fontSize: fonts.parentSmall,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  todayCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  todayTitle: {
    fontSize: fonts.parentBody,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  todaySubtitle: {
    fontSize: fonts.parentSmall,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.lg,
  },
  moodOption: {
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 60,
  },
  moodEmoji: {
    fontSize: 40,
    marginBottom: spacing.xs,
  },
  moodLabel: {
    fontSize: fonts.parentSmall,
    color: colors.textSecondary,
  },
  journalLabel: {
    fontSize: fonts.parentBody,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  journalInput: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fonts.parentBody,
    color: colors.text,
    minHeight: 120,
    marginBottom: spacing.lg,
    lineHeight: 30,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveDisabled: {
    opacity: 0.4,
  },
  saveButtonText: {
    fontSize: fonts.parentButton,
    fontWeight: '700',
    color: colors.white,
  },
  savedCard: {
    backgroundColor: colors.successLight,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  savedEmoji: {
    fontSize: 56,
  },
  savedTitle: {
    fontSize: fonts.parentBody,
    fontWeight: '700',
    color: colors.success,
  },
  savedText: {
    fontSize: fonts.parentSmall,
    color: colors.success,
    textAlign: 'center',
    lineHeight: 26,
  },
  sectionTitle: {
    fontSize: fonts.parentBody,
    fontWeight: '700',
    color: colors.text,
  },
  entryCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  entryMood: {
    fontSize: 36,
  },
  entryHeaderText: {
    flex: 1,
  },
  entryDate: {
    fontSize: fonts.parentSmall,
    fontWeight: '600',
    color: colors.text,
  },
  entryMoodLabel: {
    fontSize: fonts.parentSmall,
    color: colors.textSecondary,
    marginTop: 2,
  },
  entryJournal: {
    fontSize: fonts.parentSmall,
    color: colors.textSecondary,
    lineHeight: 26,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  backText: {
    fontSize: fonts.parentSmall,
    color: colors.textLight,
  },
});
