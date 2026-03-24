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
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, fonts, spacing, borderRadius } from '../../lib/theme';
import { useAuthStore } from '../../lib/store';
import type { User, Family } from '../../lib/types';

export default function JoinScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ code?: string }>();
  const login = useAuthStore((s) => s.login);

  const [step, setStep] = useState<'code' | 'profile'>('code');
  const [inviteCode, setInviteCode] = useState(params.code || '');
  const [name, setName] = useState('');
  const [checkinTime, setCheckinTime] = useState(new Date(2000, 0, 1, 9, 0));
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [joining, setJoining] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const formatTime = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${displayHour}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  const handleVerifyCode = () => {
    if (inviteCode.trim().length < 4) {
      Alert.alert('Invalid Code', 'Please enter a valid invite code.');
      return;
    }
    setVerifying(true);
    // Mock code verification
    setTimeout(() => {
      setVerifying(false);
      setStep('profile');
    }, 1000);
  };

  const handleJoin = () => {
    if (!name.trim()) {
      Alert.alert('Name Required', 'Please enter your name.');
      return;
    }
    setJoining(true);

    // Mock joining family
    setTimeout(() => {
      const hours = checkinTime.getHours().toString().padStart(2, '0');
      const minutes = checkinTime.getMinutes().toString().padStart(2, '0');

      const family: Family = {
        id: 'fam-joined-001',
        name: 'Robinson Family',
        invite_code: inviteCode.trim(),
        plan: 'free',
        plan_expires_at: null,
        created_at: new Date().toISOString(),
      };

      const user: User = {
        id: `user-parent-${Date.now()}`,
        family_id: family.id,
        role: 'parent',
        name: name.trim(),
        phone: '+1234567890',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        checkin_time: `${hours}:${minutes}`,
        alert_delay_minutes: 120,
        push_token: null,
        avatar_emoji: '👵',
        created_at: new Date().toISOString(),
        last_active_at: new Date().toISOString(),
      };

      login(user, family);
      setJoining(false);
      router.replace('/parent/home');
    }, 1500);
  };

  const handleTimeChange = (_event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (selectedDate) {
      setCheckinTime(selectedDate);
    }
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
          onPress={() => {
            if (step === 'profile') {
              setStep('code');
            } else {
              router.back();
            }
          }}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        {step === 'code' ? (
          <>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerEmoji}>🔑</Text>
              <Text style={styles.title}>Join Your Family</Text>
              <Text style={styles.subtitle}>
                Enter the invite code your family member shared with you
              </Text>
            </View>

            {/* Invite Code Input */}
            <View style={styles.form}>
              <View style={styles.field}>
                <Text style={styles.label}>Invite Code</Text>
                <TextInput
                  style={styles.codeInput}
                  placeholder="e.g. FP2024"
                  placeholderTextColor={colors.textLight}
                  value={inviteCode}
                  onChangeText={(text) => setInviteCode(text.toUpperCase())}
                  autoCapitalize="characters"
                  autoFocus
                  maxLength={10}
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  inviteCode.trim().length < 4 && styles.buttonDisabled,
                ]}
                onPress={handleVerifyCode}
                disabled={inviteCode.trim().length < 4 || verifying}
                activeOpacity={0.8}
              >
                {verifying ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.primaryButtonText}>Continue</Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerEmoji}>👋</Text>
              <Text style={styles.title}>Welcome!</Text>
              <Text style={styles.subtitle}>
                Set up your profile and choose your daily check-in time
              </Text>
            </View>

            {/* Profile Form */}
            <View style={styles.form}>
              <View style={styles.field}>
                <Text style={styles.label}>Your Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Mom"
                  placeholderTextColor={colors.textLight}
                  value={name}
                  onChangeText={setName}
                  autoFocus
                />
              </View>

              {/* Check-in Time */}
              <View style={styles.field}>
                <Text style={styles.label}>Daily Check-in Time</Text>
                <Text style={styles.fieldHint}>
                  We'll send a gentle reminder at this time each day
                </Text>
                <TouchableOpacity
                  style={styles.timeButton}
                  onPress={() => setShowTimePicker(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.timeIcon}>⏰</Text>
                  <Text style={styles.timeText}>{formatTime(checkinTime)}</Text>
                  <Text style={styles.timeChange}>Change</Text>
                </TouchableOpacity>
              </View>

              {showTimePicker && (
                <View style={styles.pickerContainer}>
                  <DateTimePicker
                    value={checkinTime}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleTimeChange}
                    minuteInterval={5}
                  />
                  {Platform.OS === 'ios' && (
                    <TouchableOpacity
                      style={styles.pickerDone}
                      onPress={() => setShowTimePicker(false)}
                    >
                      <Text style={styles.pickerDoneText}>Done</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Info Card */}
              <View style={styles.infoCard}>
                <Text style={styles.infoEmoji}>💡</Text>
                <Text style={styles.infoText}>
                  Each day at your check-in time, you'll get a simple prompt to let your family know how you're doing. It takes less than 10 seconds!
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  !name.trim() && styles.buttonDisabled,
                ]}
                onPress={handleJoin}
                disabled={!name.trim() || joining}
                activeOpacity={0.8}
              >
                {joining ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.primaryButtonText}>Join Family</Text>
                )}
              </TouchableOpacity>
            </View>
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
  fieldHint: {
    fontSize: fonts.small,
    color: colors.textLight,
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
  codeInput: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    fontSize: fonts.title,
    fontWeight: '700',
    color: colors.text,
    borderWidth: 2,
    borderColor: colors.border,
    textAlign: 'center',
    letterSpacing: 4,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: colors.border,
    gap: spacing.md,
  },
  timeIcon: {
    fontSize: 24,
  },
  timeText: {
    fontSize: fonts.subtitle,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  timeChange: {
    fontSize: fonts.small,
    fontWeight: '600',
    color: colors.primary,
  },
  pickerContainer: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  pickerDone: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  pickerDoneText: {
    fontSize: fonts.body,
    fontWeight: '700',
    color: colors.primary,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.secondaryLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  infoEmoji: {
    fontSize: 20,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: fonts.small,
    color: colors.textSecondary,
    lineHeight: 20,
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
});
