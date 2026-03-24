import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, fonts, spacing, borderRadius } from '../../lib/theme';

interface Anomaly {
  type: string;
  severity: 'watch' | 'alert';
  metric_value: number;
  baseline_value: number;
  deviation: number;
  date: string;
}

interface AnomalyBannerProps {
  anomaly: Anomaly;
  onDismiss?: (reason: string) => void;
}

export default function AnomalyBanner({ anomaly, onDismiss }: AnomalyBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const isAlert = anomaly.severity === 'alert';
  const bgColor = isAlert ? colors.dangerLight : colors.warningLight;
  const accentColor = isAlert ? colors.danger : colors.warning;
  const icon = isAlert ? '\u26A0\uFE0F' : '\u2139\uFE0F';

  const deviationStr =
    anomaly.deviation > 0
      ? `+${anomaly.deviation.toFixed(0)}%`
      : `${anomaly.deviation.toFixed(0)}%`;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.('marked_as_known');
  };

  return (
    <View style={[styles.banner, { backgroundColor: bgColor, borderLeftColor: accentColor }]}>
      <View style={styles.headerRow}>
        <Text style={styles.icon}>{icon}</Text>
        <View style={styles.info}>
          <Text style={[styles.type, { color: accentColor }]}>{anomaly.type}</Text>
          <Text style={styles.detail}>
            {anomaly.metric_value.toLocaleString()} vs {anomaly.baseline_value.toLocaleString()} baseline ({deviationStr})
          </Text>
          <Text style={styles.date}>{anomaly.date}</Text>
        </View>
        {!isAlert && (
          <TouchableOpacity onPress={handleDismiss} style={styles.closeButton}>
            <Text style={styles.closeText}>{'\u2715'}</Text>
          </TouchableOpacity>
        )}
      </View>
      <TouchableOpacity
        style={[styles.dismissButton, { backgroundColor: accentColor }]}
        onPress={handleDismiss}
      >
        <Text style={styles.dismissText}>Mark as known</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderLeftWidth: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  icon: {
    fontSize: 20,
    marginTop: 2,
  },
  info: {
    flex: 1,
  },
  type: {
    fontSize: fonts.body,
    fontWeight: '700',
  },
  detail: {
    fontSize: fonts.small,
    color: colors.text,
    marginTop: 2,
  },
  date: {
    fontSize: fonts.tiny,
    color: colors.textSecondary,
    marginTop: 2,
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  dismissButton: {
    marginTop: spacing.sm,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    alignSelf: 'flex-start',
  },
  dismissText: {
    fontSize: fonts.small,
    fontWeight: '600',
    color: colors.white,
  },
});
