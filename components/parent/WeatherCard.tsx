import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, spacing, borderRadius } from '../../lib/theme';
import type { WeatherData } from '../../lib/types';

interface WeatherCardProps {
  weather: WeatherData;
}

export default function WeatherCard({ weather }: WeatherCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.icon}>{weather.icon}</Text>
        <View style={styles.tempContainer}>
          <Text style={styles.temp}>{weather.temp}°F</Text>
          <Text style={styles.desc}>{weather.description}</Text>
        </View>
      </View>
      <View style={styles.details}>
        <Text style={styles.detail}>H: {weather.high}°  L: {weather.low}°</Text>
        <Text style={styles.detail}>Rain: {weather.rain_chance}%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#E3F2FD',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  icon: {
    fontSize: 56,
  },
  tempContainer: {
    flex: 1,
  },
  temp: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.text,
  },
  desc: {
    fontSize: fonts.parentBody,
    color: colors.textSecondary,
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  detail: {
    fontSize: fonts.parentSmall,
    color: colors.textSecondary,
  },
});
