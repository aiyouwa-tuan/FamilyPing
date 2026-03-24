import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, fonts, spacing, borderRadius } from '../lib/theme';
import { loadMockData } from '../lib/store';

export default function WelcomeScreen() {
  const router = useRouter();

  const handleParentDemo = () => {
    loadMockData('parent');
    router.replace('/parent/home');
  };

  const handleFamilyDemo = () => {
    loadMockData('family');
    router.replace('/family/dashboard');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>🏠</Text>
        <Text style={styles.title}>FamilyPing</Text>
        <Text style={styles.subtitle}>Know your parents are OK.{'\n'}Every day.</Text>
      </View>

      <View style={styles.cards}>
        <TouchableOpacity style={styles.card} onPress={handleFamilyDemo} activeOpacity={0.85}>
          <Text style={styles.cardEmoji}>👩</Text>
          <Text style={styles.cardTitle}>I&apos;m a Family Member</Text>
          <Text style={styles.cardDesc}>I want to check on my parents</Text>
          <View style={styles.cardBadge}>
            <Text style={styles.cardBadgeText}>Child / Sibling</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.card, styles.cardParent]} onPress={handleParentDemo} activeOpacity={0.85}>
          <Text style={styles.cardEmoji}>👵</Text>
          <Text style={styles.cardTitle}>I&apos;m a Parent</Text>
          <Text style={styles.cardDesc}>My child invited me to join</Text>
          <View style={[styles.cardBadge, styles.cardBadgeParent]}>
            <Text style={[styles.cardBadgeText, { color: colors.secondary }]}>Parent</Text>
          </View>
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>
        Demo Mode — No login required
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  logo: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: fonts.subtitle,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 26,
  },
  cards: {
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 2,
    borderColor: colors.primaryLight,
  },
  cardParent: {
    borderColor: colors.secondaryLight,
  },
  cardEmoji: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  cardTitle: {
    fontSize: fonts.title,
    fontWeight: '700',
    color: colors.text,
  },
  cardDesc: {
    fontSize: fonts.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  cardBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginTop: spacing.md,
  },
  cardBadgeParent: {
    backgroundColor: colors.secondaryLight,
  },
  cardBadgeText: {
    fontSize: fonts.small,
    fontWeight: '600',
    color: colors.primary,
  },
  footer: {
    textAlign: 'center',
    fontSize: fonts.small,
    color: colors.textLight,
    marginTop: spacing.xl,
  },
});
