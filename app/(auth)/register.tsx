import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { colors, fonts, spacing, borderRadius } from '../../lib/theme';
import { useAuthStore } from '../../lib/store';
import type { User, Family } from '../../lib/types';

export default function RegisterScreen() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [name, setName] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(false);
  const [inviteCode, setInviteCode] = useState('');

  const handleCreate = () => {
    if (!name.trim()) {
      Alert.alert('Name Required', 'Please enter your name.');
      return;
    }
    if (!familyName.trim()) {
      Alert.alert('Family Name Required', 'Please enter a family name.');
      return;
    }

    setCreating(true);

    // Mock family creation
    setTimeout(() => {
      const generatedCode = `FP${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      setInviteCode(generatedCode);

      const family: Family = {
        id: `fam-${Date.now()}`,
        name: familyName.trim(),
        invite_code: generatedCode,
        plan: 'free',
        plan_expires_at: null,
        created_at: new Date().toISOString(),
      };

      const user: User = {
        id: `user-${Date.now()}`,
        family_id: family.id,
        role: 'family',
        name: name.trim(),
        phone: '+1234567890',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        checkin_time: null,
        alert_delay_minutes: 120,
        push_token: null,
        avatar_emoji: '👩',
        created_at: new Date().toISOString(),
        last_active_at: new Date().toISOString(),
      };

      login(user, family);
      setCreating(false);
      setCreated(true);
    }, 1500);
  };

  const handleCopyCode = async () => {
    await Clipboard.setStringAsync(inviteCode);
    Alert.alert('Copied!', 'Invite code copied to clipboard.');
  };

  const handleContinue = () => {
    router.replace('/family/dashboard');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        {!created ? (
          <>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerEmoji}>👨‍👩‍👧</Text>
              <Text style={styles.title}>Set Up Your Family</Text>
              <Text style={styles.subtitle}>
                Create a family group and invite your parents to join
              </Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              <View style={styles.field}>
                <Text style={styles.label}>Your Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Sarah"
                  placeholderTextColor={colors.textLight}
                  value={name}
                  onChangeText={setName}
                  autoFocus
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Family Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Robinson Family"
                  placeholderTextColor={colors.textLight}
                  value={familyName}
                  onChangeText={setFamilyName}
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  (!name.trim() || !familyName.trim()) && styles.buttonDisabled,
                ]}
                onPress={handleCreate}
                disabled={!name.trim() || !familyName.trim() || creating}
                activeOpacity={0.8}
              >
                {creating ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.primaryButtonText}>Create Family</Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            {/* Success */}
            <View style={styles.successSection}>
              <Text style={styles.successEmoji}>🎉</Text>
              <Text style={styles.successTitle}>Family Created!</Text>
              <Text style={styles.successDesc}>
                Share this invite code with your parent so they can join FamilyPing
              </Text>
            </View>

            {/* Invite Code */}
            <View style={styles.codeCard}>
              <Text style={styles.codeLabel}>Invite Code</Text>
              <Text style={styles.codeValue}>{inviteCode}</Text>
              <TouchableOpacity
                style={styles.copyButton}
                onPress={handleCopyCode}
                activeOpacity={0.8}
              >
                <Text style={styles.copyButtonText}>📋  Copy Code</Text>
              </TouchableOpacity>
            </View>

            {/* Share instructions */}
            <View style={styles.instructionCard}>
              <Text style={styles.instructionTitle}>Next Steps</Text>
              <View style={styles.instructionRow}>
                <Text style={styles.instructionNumber}>1</Text>
                <Text style={styles.instructionText}>
                  Share the invite code with your parent
                </Text>
              </View>
              <View style={styles.instructionRow}>
                <Text style={styles.instructionNumber}>2</Text>
                <Text style={styles.instructionText}>
                  They'll download FamilyPing and enter the code
                </Text>
              </View>
              <View style={styles.instructionRow}>
                <Text style={styles.instructionNumber}>3</Text>
                <Text style={styles.instructionText}>
                  Choose a daily check-in time together
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleContinue}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>Go to Dashboard</Text>
            </TouchableOpacity>
          </>
        )}
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
    paddingBottom: spacing.xxl,
  },
  backButton: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    alignSelf: 'flex-start',
  },
  backText: {
    fontSize: fonts.body,
    color: colors.textSecondary,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  headerEmoji: {
    fontSize: 56,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: fonts.title,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: fonts.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.md,
  },
  form: {
    gap: spacing.lg,
  },
  field: {
    gap: spacing.sm,
  },
  label: {
    fontSize: fonts.small,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    fontSize: fonts.body,
    color: colors.text,
    borderWidth: 2,
    borderColor: colors.border,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.sm,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  primaryButtonText: {
    fontSize: fonts.subtitle,
    fontWeight: '700',
    color: colors.white,
  },
  successSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  successEmoji: {
    fontSize: 64,
    marginBottom: spacing.sm,
  },
  successTitle: {
    fontSize: fonts.title,
    fontWeight: '800',
    color: colors.text,
  },
  successDesc: {
    fontSize: fonts.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.md,
  },
  codeCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  codeLabel: {
    fontSize: fonts.small,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  codeValue: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 4,
  },
  copyButton: {
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  copyButtonText: {
    fontSize: fonts.body,
    fontWeight: '600',
    color: colors.primary,
  },
  instructionCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  instructionTitle: {
    fontSize: fonts.subtitle,
    fontWeight: '700',
    color: colors.text,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  instructionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    color: colors.primary,
    fontSize: fonts.small,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 28,
    overflow: 'hidden',
  },
  instructionText: {
    flex: 1,
    fontSize: fonts.body,
    color: colors.textSecondary,
    lineHeight: 22,
  },
});
