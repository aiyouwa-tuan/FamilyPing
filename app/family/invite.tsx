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
import * as Clipboard from 'expo-clipboard';
import { colors, fonts, spacing, borderRadius } from '../../lib/theme';
import { useAuthStore } from '../../lib/store';

const mockMembers = [
  { id: 'user-parent-001', name: 'Mom', emoji: '👵', role: 'parent', phone: '+1234567890' },
  { id: 'user-family-001', name: 'Sarah', emoji: '👩', role: 'family', phone: '+1987654321' },
  { id: 'user-family-002', name: 'James', emoji: '👨', role: 'family', phone: '+1555555555' },
];

export default function FamilyInviteScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const family = useAuthStore((s) => s.family);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [copied, setCopied] = useState(false);

  const inviteCode = family?.invite_code || 'FP2024';
  const isPaidPlan = family?.plan !== 'free';

  const handleCopyCode = async () => {
    try {
      await Clipboard.setStringAsync(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      Alert.alert('Copied!', `Invite code: ${inviteCode}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSendInvite = () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Enter phone number', 'Please enter a phone number to send an invite.');
      return;
    }
    if (!isPaidPlan) {
      Alert.alert('Family Plan Required', 'Upgrade to a Family plan to invite more members.');
      return;
    }
    Alert.alert(
      'Invite Sent!',
      `SMS invitation sent to ${phoneNumber} with code ${inviteCode}.`,
      [{ text: 'OK' }]
    );
    setPhoneNumber('');
  };

  const handleUpgrade = () => {
    router.push('/family/paywall');
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
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>{'<'} Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Invite Family</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Free Plan Banner */}
        {!isPaidPlan && (
          <View style={styles.upgradeBanner}>
            <Text style={styles.upgradeBannerIcon}>👑</Text>
            <View style={styles.upgradeBannerContent}>
              <Text style={styles.upgradeBannerTitle}>Family Plan required</Text>
              <Text style={styles.upgradeBannerDesc}>
                Upgrade to invite more family members and unlock messaging.
              </Text>
            </View>
            <TouchableOpacity style={styles.upgradeBannerBtn} onPress={handleUpgrade}>
              <Text style={styles.upgradeBannerBtnText}>Upgrade</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Invite Code */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your Family Code</Text>
          <Text style={styles.cardDesc}>Share this code with family members to join.</Text>
          <View style={styles.codeRow}>
            <View style={styles.codeBox}>
              <Text style={styles.codeText}>{inviteCode}</Text>
            </View>
            <TouchableOpacity style={styles.copyButton} onPress={handleCopyCode}>
              <Text style={styles.copyButtonText}>{copied ? 'Copied!' : 'Copy'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* SMS Invite */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Invite by Phone</Text>
          <Text style={styles.cardDesc}>Send an SMS invite with the family code.</Text>
          <View style={styles.phoneRow}>
            <TextInput
              style={styles.phoneInput}
              placeholder="+1 (555) 000-0000"
              placeholderTextColor={colors.textLight}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />
            <TouchableOpacity
              style={[styles.inviteButton, !phoneNumber.trim() && styles.inviteButtonDisabled]}
              onPress={handleSendInvite}
              disabled={!phoneNumber.trim()}
            >
              <Text style={styles.inviteButtonText}>Send</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Current Members */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Family Members</Text>
          <Text style={styles.cardDesc}>{mockMembers.length} members in your family.</Text>
          {mockMembers.map((member) => (
            <View key={member.id} style={styles.memberRow}>
              <View style={styles.memberAvatar}>
                <Text style={styles.memberAvatarText}>{member.emoji}</Text>
              </View>
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>
                  {member.name}
                  {member.id === user?.id ? ' (You)' : ''}
                </Text>
                <Text style={styles.memberRole}>
                  {member.role === 'parent' ? 'Parent' : 'Family Member'}
                </Text>
              </View>
              <Text style={styles.memberPhone}>{member.phone}</Text>
            </View>
          ))}
        </View>

        {/* Back to dashboard */}
        <TouchableOpacity
          onPress={() => router.replace('/family/dashboard')}
          style={styles.backLink}
        >
          <Text style={styles.backLinkText}>{'<-'} Back to Dashboard</Text>
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
    paddingVertical: spacing.xs,
  },
  backBtnText: {
    fontSize: fonts.body,
    color: colors.primary,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: fonts.title,
    fontWeight: '800',
    color: colors.text,
  },
  headerSpacer: {
    width: 60,
  },
  upgradeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.warningLight,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  upgradeBannerIcon: {
    fontSize: 28,
  },
  upgradeBannerContent: {
    flex: 1,
  },
  upgradeBannerTitle: {
    fontSize: fonts.body,
    fontWeight: '700',
    color: colors.text,
  },
  upgradeBannerDesc: {
    fontSize: fonts.small,
    color: colors.textSecondary,
    marginTop: 2,
  },
  upgradeBannerBtn: {
    backgroundColor: colors.warning,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  upgradeBannerBtnText: {
    fontSize: fonts.small,
    fontWeight: '700',
    color: colors.white,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: fonts.subtitle,
    fontWeight: '700',
    color: colors.text,
  },
  cardDesc: {
    fontSize: fonts.small,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  codeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  codeBox: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  codeText: {
    fontSize: fonts.title,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 4,
  },
  copyButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  copyButtonText: {
    fontSize: fonts.body,
    fontWeight: '700',
    color: colors.white,
  },
  phoneRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  phoneInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fonts.body,
    color: colors.text,
  },
  inviteButton: {
    backgroundColor: colors.secondary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  inviteButtonDisabled: {
    opacity: 0.4,
  },
  inviteButtonText: {
    fontSize: fonts.body,
    fontWeight: '700',
    color: colors.white,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: {
    fontSize: 20,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: fonts.body,
    fontWeight: '600',
    color: colors.text,
  },
  memberRole: {
    fontSize: fonts.small,
    color: colors.textSecondary,
    marginTop: 2,
  },
  memberPhone: {
    fontSize: fonts.small,
    color: colors.textLight,
  },
  backLink: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  backLinkText: {
    fontSize: fonts.small,
    color: colors.textLight,
  },
});
