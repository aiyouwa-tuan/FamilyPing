import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, spacing, borderRadius } from '../../lib/theme';
import type { Checkin } from '../../lib/types';

interface WeekCalendarProps {
  checkins: Checkin[];
}

export default function WeekCalendar({ checkins }: WeekCalendarProps) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const now = new Date();

  // Build a map of date -> checkin
  const checkinMap = new Map<string, Checkin>();
  checkins.forEach((c) => {
    const d = new Date(c.checked_in_at);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    checkinMap.set(key, c);
  });

  // Get this week's dates (Monday to Sunday)
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });

  const getStatus = (date: Date) => {
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    const checkin = checkinMap.get(key);
    const isToday = date.toDateString() === now.toDateString();
    const isFuture = date > now;

    if (isFuture) return { icon: '—', color: colors.textLight, bg: colors.border };
    if (checkin) {
      const moodColor = {
        great: colors.moodGreat,
        ok: colors.moodOk,
        not_great: colors.moodNotGreat,
      }[checkin.mood];
      return { icon: '✅', color: moodColor, bg: moodColor + '20' };
    }
    if (isToday) return { icon: '⏳', color: colors.warning, bg: colors.warningLight };
    return { icon: '⚠️', color: colors.danger, bg: colors.dangerLight };
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>This Week</Text>
      <View style={styles.row}>
        {weekDays.map((date, i) => {
          const status = getStatus(date);
          const isToday = date.toDateString() === now.toDateString();
          return (
            <View key={i} style={styles.dayContainer}>
              <Text style={[styles.dayLabel, isToday && styles.todayLabel]}>
                {days[i]}
              </Text>
              <View style={[styles.dayCircle, { backgroundColor: status.bg }]}>
                <Text style={styles.dayIcon}>{status.icon}</Text>
              </View>
              <Text style={styles.dateLabel}>{date.getDate()}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayContainer: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  dayLabel: {
    fontSize: fonts.tiny,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  todayLabel: {
    color: colors.primary,
    fontWeight: '800',
  },
  dayCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayIcon: {
    fontSize: 18,
  },
  dateLabel: {
    fontSize: fonts.tiny,
    color: colors.textLight,
  },
});
