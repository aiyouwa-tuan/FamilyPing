import React, { useState } from 'react';
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
import { useAuthStore } from '../../lib/store';

interface PlanTier {
  id: string;
  name: string;
  monthlyPrice: string;
  annualPrice: string;
  features: string[];
  highlight?: boolean;
}

const plans: PlanTier[] = [
  {
    id: 'free',
    name: 'Free',
    monthlyPrice: '$0',
    annualPrice: '$0',
    features: [
      'Daily check-in for 1 parent',
      'Mood tracking',
      'SOS button',
      'Basic notifications',
    ],
  },
  {
    id: 'family',
    name: 'Family',
    monthlyPrice: '$4.99/mo',
    annualPrice: '$39.99/yr',
    features: [
      'Everything in Free',
      'Up to 5 family members',
      'Family messaging',
      'Voice & photo messages',
      'Family Chat (siblings only)',
      'Invite via SMS',
    ],
    highlight: true,
  },
  {
    id: 'smart',
    name: 'Smart',
    monthlyPrice: '$9.99/mo',
    annualPrice: '$79.99/yr',
    features: [
      'Everything in Family',
      'AI mood insights',
      'Weekly wellness reports',
      'Custom check-in schedules',
      'Priority support',
      'Multiple parent profiles',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    monthlyPrice: '$14.99/mo',
    annualPrice: '$119.99/yr',
    features: [
      'Everything in Smart',
      'Unlimited family members',
      'Video messages',
      'Caregiver coordination tools',
      'Medical info sharing',
      'Emergency contacts network',
      'Dedicated support line',
    ],
  },
];

export default function PaywallScreen() {
  const router = useRouter();
  const family = useAuthStore((s) => s.family);
  const [isAnnual, setIsAnnual] = useState(false);
  const currentPlan = family?.plan || 'free';

  const handleSubscribe = (planId: string) => {
    if (planId === currentPlan) return;
    Alert.alert(
      'Subscribe',
      `This would initiate subscription to the ${planId.charAt(0).toUpperCase() + planId.slice(1)} plan. In-app purchase flow would start here.`,
      [{ text: 'OK' }]
    );
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
        </View>

        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Choose Your Plan</Text>
          <Text style={styles.subtitle}>
            Keep your family connected with the features you need.
          </Text>
        </View>

        {/* Annual Toggle */}
        <View style={styles.toggleRow}>
          <Text style={[styles.toggleLabel, !isAnnual && styles.toggleLabelActive]}>Monthly</Text>
          <TouchableOpacity
            style={styles.toggleTrack}
            onPress={() => setIsAnnual(!isAnnual)}
            activeOpacity={0.8}
          >
            <View style={[styles.toggleThumb, isAnnual && styles.toggleThumbActive]} />
          </TouchableOpacity>
          <Text style={[styles.toggleLabel, isAnnual && styles.toggleLabelActive]}>
            Annual
          </Text>
          {isAnnual && (
            <View style={styles.saveBadge}>
              <Text style={styles.saveBadgeText}>Save 33%</Text>
            </View>
          )}
        </View>

        {/* Plan Cards */}
        {plans.map((plan) => {
          const isCurrent = plan.id === currentPlan;
          return (
            <View
              key={plan.id}
              style={[
                styles.planCard,
                plan.highlight && styles.planCardHighlight,
                isCurrent && styles.planCardCurrent,
              ]}
            >
              {plan.highlight && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>Most Popular</Text>
                </View>
              )}

              <View style={styles.planHeader}>
                <Text style={[styles.planName, plan.highlight && styles.planNameHighlight]}>
                  {plan.name}
                </Text>
                <Text style={[styles.planPrice, plan.highlight && styles.planPriceHighlight]}>
                  {isAnnual ? plan.annualPrice : plan.monthlyPrice}
                </Text>
              </View>

              <View style={styles.featuresList}>
                {plan.features.map((feature, idx) => (
                  <View key={idx} style={styles.featureRow}>
                    <Text style={styles.featureCheck}>
                      {plan.highlight ? '* ' : '  '}
                    </Text>
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>

              {isCurrent ? (
                <View style={styles.currentPlanBtn}>
                  <Text style={styles.currentPlanBtnText}>Current Plan</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.subscribeBtn,
                    plan.highlight && styles.subscribeBtnHighlight,
                  ]}
                  onPress={() => handleSubscribe(plan.id)}
                >
                  <Text
                    style={[
                      styles.subscribeBtnText,
                      plan.highlight && styles.subscribeBtnTextHighlight,
                    ]}
                  >
                    {plan.id === 'free' ? 'Downgrade' : 'Subscribe'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Subscriptions auto-renew. Cancel anytime.
          </Text>
          <Text style={styles.footerText}>
            Prices shown in USD. Taxes may apply.
          </Text>
        </View>
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
    marginTop: spacing.md,
  },
  backBtn: {
    paddingVertical: spacing.xs,
    alignSelf: 'flex-start',
  },
  backBtnText: {
    fontSize: fonts.body,
    color: colors.primary,
    fontWeight: '600',
  },
  titleSection: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    fontSize: fonts.title,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fonts.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  toggleLabel: {
    fontSize: fonts.body,
    color: colors.textLight,
    fontWeight: '600',
  },
  toggleLabelActive: {
    color: colors.text,
  },
  toggleTrack: {
    width: 52,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.border,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
  },
  saveBadge: {
    backgroundColor: colors.successLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  saveBadgeText: {
    fontSize: fonts.tiny,
    fontWeight: '700',
    color: colors.success,
  },
  planCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  planCardHighlight: {
    borderColor: colors.primary,
    borderWidth: 2,
    shadowColor: colors.primary,
    shadowOpacity: 0.15,
  },
  planCardCurrent: {
    borderColor: colors.success,
    borderWidth: 2,
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  popularBadgeText: {
    fontSize: fonts.tiny,
    fontWeight: '700',
    color: colors.white,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: spacing.md,
  },
  planName: {
    fontSize: fonts.subtitle,
    fontWeight: '800',
    color: colors.text,
  },
  planNameHighlight: {
    color: colors.primary,
  },
  planPrice: {
    fontSize: fonts.subtitle,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  planPriceHighlight: {
    color: colors.primary,
  },
  featuresList: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  featureCheck: {
    fontSize: fonts.body,
    color: colors.success,
  },
  featureText: {
    fontSize: fonts.small,
    color: colors.text,
    flex: 1,
    lineHeight: 20,
  },
  currentPlanBtn: {
    backgroundColor: colors.successLight,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  currentPlanBtnText: {
    fontSize: fonts.body,
    fontWeight: '700',
    color: colors.success,
  },
  subscribeBtn: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  subscribeBtnHighlight: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  subscribeBtnText: {
    fontSize: fonts.body,
    fontWeight: '700',
    color: colors.text,
  },
  subscribeBtnTextHighlight: {
    color: colors.white,
  },
  footer: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingTop: spacing.md,
  },
  footerText: {
    fontSize: fonts.tiny,
    color: colors.textLight,
    textAlign: 'center',
  },
});
