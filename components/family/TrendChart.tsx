import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, spacing, borderRadius } from '../../lib/theme';

interface DayData {
  date: string;
  steps: number;
}

interface TrendChartProps {
  data: DayData[];
  average: number;
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const CHART_HEIGHT = 140;

export default function TrendChart({ data, average }: TrendChartProps) {
  const maxSteps = Math.max(...data.map((d) => d.steps), 1);

  // Calculate standard deviation
  const mean = data.reduce((sum, d) => sum + d.steps, 0) / data.length;
  const variance = data.reduce((sum, d) => sum + Math.pow(d.steps - mean, 2), 0) / data.length;
  const stdDev = Math.sqrt(variance);
  const lowThreshold = average - 1.5 * stdDev;

  const getBarColor = (steps: number) => {
    if (steps < lowThreshold) return colors.danger;
    if (steps < average) return colors.warning;
    return colors.success;
  };

  const averageY = CHART_HEIGHT - (average / maxSteps) * CHART_HEIGHT;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Steps This Week</Text>
      <View style={styles.chartContainer}>
        {/* Average line */}
        <View style={[styles.averageLine, { top: averageY }]}>
          <Text style={styles.averageLabel}>avg {average.toLocaleString()}</Text>
          <View style={styles.averageDash} />
        </View>

        {/* Bars */}
        <View style={styles.barsRow}>
          {data.map((day, index) => {
            const barHeight = Math.max((day.steps / maxSteps) * CHART_HEIGHT, 4);
            const barColor = getBarColor(day.steps);
            const label = DAY_LABELS[index] || day.date.slice(5);

            return (
              <View key={day.date} style={styles.barColumn}>
                <View style={styles.barArea}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: barHeight,
                        backgroundColor: barColor,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.dayLabel}>{label}</Text>
                <Text style={[styles.stepCount, { color: barColor }]}>
                  {day.steps >= 1000
                    ? `${(day.steps / 1000).toFixed(1)}k`
                    : day.steps}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
  title: {
    fontSize: fonts.subtitle,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  chartContainer: {
    position: 'relative',
    paddingTop: spacing.sm,
  },
  averageLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  averageLabel: {
    fontSize: fonts.tiny,
    color: colors.textSecondary,
    marginRight: spacing.xs,
  },
  averageDash: {
    flex: 1,
    height: 1,
    borderWidth: 1,
    borderColor: colors.textLight,
    borderStyle: 'dashed',
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: CHART_HEIGHT,
    gap: spacing.xs,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
  },
  barArea: {
    flex: 1,
    justifyContent: 'flex-end',
    width: '100%',
    alignItems: 'center',
  },
  bar: {
    width: '70%',
    borderRadius: borderRadius.sm,
    minHeight: 4,
  },
  dayLabel: {
    fontSize: fonts.tiny,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    fontWeight: '600',
  },
  stepCount: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
});
