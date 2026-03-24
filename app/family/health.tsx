import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors, fonts, spacing, borderRadius } from '../../lib/theme';
import TrendChart from '../../components/family/TrendChart';
import AnomalyBanner from '../../components/family/AnomalyBanner';
import WeeklySummaryCard from '../../components/family/WeeklySummaryCard';

// --- Mock Data ---
const MOCK_STEPS: { date: string; steps: number }[] = [
  { date: '2026-03-18', steps: 3200 },
  { date: '2026-03-19', steps: 4100 },
  { date: '2026-03-20', steps: 2800 },
  { date: '2026-03-21', steps: 4500 },
  { date: '2026-03-22', steps: 3900 },
  { date: '2026-03-23', steps: 2100 },
  { date: '2026-03-24', steps: 3600 },
];

const MOCK_AVERAGE = 3457;
const MOCK_TODAY_STEPS = 3600;
const MOCK_ACTIVE_HOURS = 4;
const MOCK_SLEEP_HOURS = 7.5;

const MOCK_HOURLY_ACTIVITY = [
  false, false, false, false, false, false, // 0-5
  false, true, true, false, true, true,     // 6-11
  false, false, true, true, false, false,   // 12-17
  true, false, false, false, false, false,  // 18-23
];

const MOCK_ANOMALIES = [
  {
    type: 'Low step count',
    severity: 'watch' as const,
    metric_value: 2100,
    baseline_value: 3457,
    deviation: -39.2,
    date: '2026-03-23',
  },
];

const MOCK_SUMMARY = {
  summary_text:
    "Mom had a moderately active week with consistent daily movement. Saturday showed a notable dip in activity which may be worth checking on. Overall mood check-ins remained positive.",
  week_start: '2026-03-18',
  highlights: [
    { text: 'Thursday was the most active day at 4,500 steps', type: 'positive' as const },
    { text: 'Saturday activity dropped 39% below average', type: 'concern' as const },
    { text: 'Sleep pattern remained steady around 7-8 hours', type: 'positive' as const },
  ],
  suggestion: {
    label: 'Call Mom',
    action: 'call',
  },
};

export default function HealthDashboardScreen() {
  const router = useRouter();

  const todayVsAvg = MOCK_TODAY_STEPS - MOCK_AVERAGE;
  const todayTrend = todayVsAvg >= 0 ? '\u2191' : '\u2193';
  const todayTrendColor = todayVsAvg >= 0 ? colors.success : colors.warning;
  const todayPct = Math.abs((todayVsAvg / MOCK_AVERAGE) * 100).toFixed(0);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backArrow}>{'\u2190'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{'\u2764\uFE0F'} Health Dashboard</Text>
          <View style={styles.backButton} />
        </View>

        {/* Anomalies */}
        {MOCK_ANOMALIES.map((anomaly, i) => (
          <AnomalyBanner
            key={i}
            anomaly={anomaly}
            onDismiss={(reason) => {}}
          />
        ))}

        {/* Steps Today */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Steps Today</Text>
          <View style={styles.bigNumberRow}>
            <Text style={styles.bigNumber}>{MOCK_TODAY_STEPS.toLocaleString()}</Text>
            <View style={styles.trendBadge}>
              <Text style={[styles.trendArrow, { color: todayTrendColor }]}>
                {todayTrend}
              </Text>
              <Text style={[styles.trendText, { color: todayTrendColor }]}>
                {todayPct}% vs avg
              </Text>
            </View>
          </View>
          <Text style={styles.subLabel}>Average: {MOCK_AVERAGE.toLocaleString()} steps/day</Text>
        </View>

        {/* Trend Chart */}
        <TrendChart data={MOCK_STEPS} average={MOCK_AVERAGE} />

        {/* Activity */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Activity</Text>
          <Text style={styles.activityText}>
            Active {MOCK_ACTIVE_HOURS} hours today
          </Text>
          <View style={styles.hourlyRow}>
            {MOCK_HOURLY_ACTIVITY.map((active, i) => (
              <View
                key={i}
                style={[
                  styles.hourDot,
                  {
                    backgroundColor: active ? colors.success : colors.border,
                  },
                ]}
              />
            ))}
          </View>
          <View style={styles.hourLabels}>
            <Text style={styles.hourLabel}>12am</Text>
            <Text style={styles.hourLabel}>6am</Text>
            <Text style={styles.hourLabel}>12pm</Text>
            <Text style={styles.hourLabel}>6pm</Text>
            <Text style={styles.hourLabel}>12am</Text>
          </View>
        </View>

        {/* Sleep */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Sleep</Text>
          <View style={styles.sleepRow}>
            <Text style={styles.sleepEmoji}>{'\uD83D\uDE34'}</Text>
            <View>
              <Text style={styles.sleepValue}>
                Slept {MOCK_SLEEP_HOURS} hours last night
              </Text>
              <Text style={styles.subLabel}>Within normal range</Text>
            </View>
          </View>
        </View>

        {/* Weekly Summary */}
        <WeeklySummaryCard
          summary={MOCK_SUMMARY}
          onAction={(action) => {
            if (action === 'call') {
              // Handle call action
            }
          }}
        />

        {/* Bottom spacing */}
        <View style={{ height: spacing.lg }} />
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
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 24,
    color: colors.text,
  },
  headerTitle: {
    fontSize: fonts.title,
    fontWeight: '800',
    color: colors.text,
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
  sectionLabel: {
    fontSize: fonts.small,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  bigNumberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.md,
  },
  bigNumber: {
    fontSize: 42,
    fontWeight: '800',
    color: colors.text,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  trendArrow: {
    fontSize: 20,
    fontWeight: '700',
  },
  trendText: {
    fontSize: fonts.small,
    fontWeight: '600',
  },
  subLabel: {
    fontSize: fonts.small,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  activityText: {
    fontSize: fonts.subtitle,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  hourlyRow: {
    flexDirection: 'row',
    gap: 3,
    marginBottom: spacing.xs,
  },
  hourDot: {
    flex: 1,
    height: 12,
    borderRadius: 3,
  },
  hourLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  hourLabel: {
    fontSize: 10,
    color: colors.textLight,
  },
  sleepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  sleepEmoji: {
    fontSize: 32,
  },
  sleepValue: {
    fontSize: fonts.subtitle,
    fontWeight: '700',
    color: colors.text,
  },
});
