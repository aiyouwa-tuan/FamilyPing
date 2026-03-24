import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, spacing, borderRadius } from '../../lib/theme';

interface MoodDataPoint {
  date: string;
  score: number;
}

interface MoodTrendChartProps {
  data: MoodDataPoint[];
  showDays?: number;
}

const CHART_HEIGHT = 180;
const CHART_PADDING_LEFT = 28;
const CHART_PADDING_RIGHT = 8;
const DOT_SIZE = 8;
const MIN_SCORE = 1;
const MAX_SCORE = 10;

const getScoreColor = (score: number): string => {
  if (score >= 7) return colors.moodGreat;
  if (score >= 4) return colors.moodOk;
  return colors.moodNotGreat;
};

export default function MoodTrendChart({ data, showDays = 30 }: MoodTrendChartProps) {
  const visibleData = data.slice(-showDays);
  const average = visibleData.reduce((sum, d) => sum + d.score, 0) / visibleData.length;

  const scoreToY = (score: number): number => {
    const ratio = (score - MIN_SCORE) / (MAX_SCORE - MIN_SCORE);
    return CHART_HEIGHT - ratio * CHART_HEIGHT;
  };

  const averageY = scoreToY(average);

  // Zone backgrounds
  const greenZoneTop = scoreToY(10);
  const greenZoneBottom = scoreToY(7);
  const yellowZoneTop = scoreToY(7);
  const yellowZoneBottom = scoreToY(4);
  const redZoneTop = scoreToY(4);
  const redZoneBottom = scoreToY(1);

  // Date labels: show every 5th day
  const dateLabels: { index: number; label: string }[] = [];
  visibleData.forEach((d, i) => {
    if (i % 5 === 0 || i === visibleData.length - 1) {
      const date = new Date(d.date);
      dateLabels.push({
        index: i,
        label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      });
    }
  });

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Mood Trend</Text>
        <Text style={styles.subtitle}>{showDays} days</Text>
      </View>

      <View style={styles.chartWrapper}>
        {/* Y-axis labels */}
        <View style={styles.yAxis}>
          <Text style={styles.yLabel}>10</Text>
          <Text style={styles.yLabel}>7</Text>
          <Text style={styles.yLabel}>4</Text>
          <Text style={styles.yLabel}>1</Text>
        </View>

        {/* Chart area */}
        <View style={styles.chartArea}>
          {/* Zone backgrounds */}
          <View
            style={[
              styles.zone,
              {
                top: greenZoneTop,
                height: greenZoneBottom - greenZoneTop,
                backgroundColor: colors.moodGreat + '10',
              },
            ]}
          />
          <View
            style={[
              styles.zone,
              {
                top: yellowZoneTop,
                height: yellowZoneBottom - yellowZoneTop,
                backgroundColor: colors.moodOk + '10',
              },
            ]}
          />
          <View
            style={[
              styles.zone,
              {
                top: redZoneTop,
                height: redZoneBottom - redZoneTop,
                backgroundColor: colors.moodNotGreat + '10',
              },
            ]}
          />

          {/* Grid lines */}
          {[10, 7, 4, 1].map((val) => (
            <View
              key={val}
              style={[styles.gridLine, { top: scoreToY(val) }]}
            />
          ))}

          {/* Average line */}
          <View style={[styles.averageLine, { top: averageY }]}>
            <View style={styles.averageDash} />
          </View>
          <View style={[styles.averageLabelContainer, { top: averageY - 8 }]}>
            <Text style={styles.averageLabel}>avg {average.toFixed(1)}</Text>
          </View>

          {/* Line segments connecting dots */}
          {visibleData.map((point, i) => {
            if (i === 0) return null;
            const prevPoint = visibleData[i - 1];
            const totalPoints = visibleData.length;
            const x1 = ((i - 1) / (totalPoints - 1)) * 100;
            const x2 = (i / (totalPoints - 1)) * 100;
            const y1 = scoreToY(prevPoint.score);
            const y2 = scoreToY(point.score);

            const dx = x2 - x1;
            const dy = y2 - y1;
            const length = Math.sqrt(dx * dx * 0.01 + dy * dy); // approximate
            const angle = Math.atan2(dy, dx * 0.01 * CHART_HEIGHT) * (180 / Math.PI);

            // Use simple connecting view with absolute positioning
            const midColor = getScoreColor((prevPoint.score + point.score) / 2);

            return (
              <View
                key={`line-${i}`}
                style={[
                  styles.lineSegment,
                  {
                    left: `${x1}%`,
                    top: Math.min(y1, y2),
                    width: `${dx}%`,
                    height: Math.abs(y2 - y1) || 2,
                    borderColor: midColor,
                  },
                ]}
              >
                <View
                  style={[
                    styles.lineInner,
                    {
                      backgroundColor: midColor,
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      top: y1 <= y2 ? 0 : undefined,
                      bottom: y1 > y2 ? 0 : undefined,
                      height: 2,
                      transform: [
                        {
                          rotate: `${Math.atan2(y2 - y1, (dx / 100) * 300)}rad`,
                        },
                      ],
                    },
                  ]}
                />
              </View>
            );
          })}

          {/* Data points */}
          {visibleData.map((point, i) => {
            const x = visibleData.length > 1 ? (i / (visibleData.length - 1)) * 100 : 50;
            const y = scoreToY(point.score);
            const dotColor = getScoreColor(point.score);

            return (
              <View
                key={`dot-${i}`}
                style={[
                  styles.dot,
                  {
                    left: `${x}%`,
                    top: y - DOT_SIZE / 2,
                    backgroundColor: dotColor,
                    marginLeft: -DOT_SIZE / 2,
                  },
                ]}
              />
            );
          })}
        </View>
      </View>

      {/* X-axis labels */}
      <View style={styles.xAxis}>
        {dateLabels.map((dl) => {
          const x =
            visibleData.length > 1 ? (dl.index / (visibleData.length - 1)) * 100 : 50;
          return (
            <Text
              key={dl.index}
              style={[styles.xLabel, { left: `${x}%` }]}
            >
              {dl.label}
            </Text>
          );
        })}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.moodGreat }]} />
          <Text style={styles.legendText}>Good (7-10)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.moodOk }]} />
          <Text style={styles.legendText}>Okay (4-6)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.moodNotGreat }]} />
          <Text style={styles.legendText}>Low (1-3)</Text>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fonts.subtitle,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: fonts.tiny,
    color: colors.textSecondary,
  },
  chartWrapper: {
    flexDirection: 'row',
    height: CHART_HEIGHT,
  },
  yAxis: {
    width: CHART_PADDING_LEFT,
    justifyContent: 'space-between',
    paddingRight: spacing.xs,
  },
  yLabel: {
    fontSize: 10,
    color: colors.textLight,
    textAlign: 'right',
  },
  chartArea: {
    flex: 1,
    height: CHART_HEIGHT,
    position: 'relative',
    overflow: 'hidden',
  },
  zone: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.border,
    opacity: 0.5,
  },
  averageLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 2,
  },
  averageDash: {
    flex: 1,
    height: 1,
    borderWidth: 1,
    borderColor: colors.textLight,
    borderStyle: 'dashed',
  },
  averageLabelContainer: {
    position: 'absolute',
    right: 0,
    zIndex: 3,
  },
  averageLabel: {
    fontSize: 9,
    color: colors.textSecondary,
    backgroundColor: colors.white,
    paddingHorizontal: 2,
  },
  lineSegment: {
    position: 'absolute',
    zIndex: 4,
  },
  lineInner: {
    borderRadius: 1,
  },
  dot: {
    position: 'absolute',
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    zIndex: 5,
    borderWidth: 2,
    borderColor: colors.white,
  },
  xAxis: {
    height: 20,
    position: 'relative',
    marginLeft: CHART_PADDING_LEFT,
    marginTop: spacing.xs,
  },
  xLabel: {
    position: 'absolute',
    fontSize: 9,
    color: colors.textSecondary,
    transform: [{ translateX: -16 }],
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: fonts.tiny,
    color: colors.textSecondary,
  },
});
