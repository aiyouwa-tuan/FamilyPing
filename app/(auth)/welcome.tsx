import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, fonts, spacing, borderRadius } from '../../lib/theme';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.emoji}>🏠</Text>
          <Text style={styles.title}>FamilyPing</Text>
          <Text style={styles.subtitle}>
            Stay connected with your loved ones through simple daily check-ins
          </Text>
        </View>

        {/* Features */}
        <View style={styles.features}>
          <View style={styles.featureRow}>
            <Text style={styles.featureIcon}>💛</Text>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Daily Check-ins</Text>
              <Text style={styles.featureDesc}>
                A gentle tap to let family know you're OK
              </Text>
            </View>
          </View>
          <View style={styles.featureRow}>
            <Text style={styles.featureIcon}>🚨</Text>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>SOS Alerts</Text>
              <Text style={styles.featureDesc}>
                One-tap emergency alerts with location
              </Text>
            </View>
          </View>
          <View style={styles.featureRow}>
            <Text style={styles.featureIcon}>💬</Text>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Family Messages</Text>
              <Text style={styles.featureDesc}>
                Share moments and stay in touch easily
              </Text>
            </View>
          </View>
        </View>

        {/* CTA */}
        <View style={styles.ctaSection}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/(auth)/login')}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </TouchableOpacity>

          <Text style={styles.footerText}>
            Simple, safe, and built for families
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'space-between',
    paddingBottom: spacing.xl,
  },
  hero: {
    alignItems: 'center',
    marginTop: spacing.xxl * 1.5,
    gap: spacing.md,
  },
  emoji: {
    fontSize: 72,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.primary,
  },
  subtitle: {
    fontSize: fonts.subtitle,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: spacing.lg,
  },
  features: {
    gap: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  featureIcon: {
    fontSize: 32,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: fonts.body,
    fontWeight: '700',
    color: colors.text,
  },
  featureDesc: {
    fontSize: fonts.small,
    color: colors.textSecondary,
    marginTop: 2,
  },
  ctaSection: {
    alignItems: 'center',
    gap: spacing.md,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxl,
    width: '100%',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: fonts.subtitle,
    fontWeight: '700',
    color: colors.white,
  },
  footerText: {
    fontSize: fonts.small,
    color: colors.textLight,
  },
});
