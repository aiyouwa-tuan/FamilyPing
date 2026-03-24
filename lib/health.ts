import { Platform } from 'react-native';
import { supabase } from './supabase';

// =============================================================================
// FamilyPing V2.0 - Unified Health Data Abstraction
// =============================================================================
// This module provides a cross-platform interface over:
//   - iOS:     Apple HealthKit  (via react-native-health)
//   - Android: Health Connect   (via react-native-health-connect)
//
// Currently uses mock data with realistic values. To enable real health data:
//
// iOS (react-native-health):
//   import AppleHealthKit, { HealthKitPermissions } from 'react-native-health';
//
// Android (react-native-health-connect):
//   import { initialize, requestPermission, readRecords }
//     from 'react-native-health-connect';
// =============================================================================

// ---------------------------------------------------------------------------
// Mock data generators (replace with real SDK calls)
// ---------------------------------------------------------------------------

function mockSteps(): number {
  // Realistic range: 1,200 - 8,500 steps for elderly users
  return Math.floor(2000 + Math.random() * 6500);
}

function mockSleepMinutes(): number {
  // Realistic range: 300 - 540 minutes (5 - 9 hours)
  return Math.floor(300 + Math.random() * 240);
}

function mockActiveHours(): number {
  // Realistic range: 2 - 10 hours with significant movement
  return Math.floor(2 + Math.random() * 8);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Request permissions for health data access.
 * On iOS this prompts the HealthKit authorization dialog.
 * On Android this opens Health Connect permission flow.
 *
 * Returns true if permissions were granted.
 */
export async function requestPermissions(): Promise<boolean> {
  if (Platform.OS === 'ios') {
    // ----- iOS: Apple HealthKit -----
    // const permissions: HealthKitPermissions = {
    //   permissions: {
    //     read: [
    //       AppleHealthKit.Constants.Permissions.StepCount,
    //       AppleHealthKit.Constants.Permissions.SleepAnalysis,
    //       AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
    //     ],
    //     write: [],
    //   },
    // };
    // return new Promise((resolve) => {
    //   AppleHealthKit.initHealthKit(permissions, (err) => resolve(!err));
    // });
    console.log('[Health] Mock: iOS permissions granted');
    return true;
  }

  if (Platform.OS === 'android') {
    // ----- Android: Health Connect -----
    // await initialize();
    // const granted = await requestPermission([
    //   { accessType: 'read', recordType: 'Steps' },
    //   { accessType: 'read', recordType: 'SleepSession' },
    //   { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
    // ]);
    // return granted.length > 0;
    console.log('[Health] Mock: Android permissions granted');
    return true;
  }

  // Web / other - no health data available
  console.log('[Health] Mock: platform not supported, returning mock data');
  return true;
}

/**
 * Get total step count for a given date.
 */
export async function getSteps(date: Date): Promise<number> {
  if (Platform.OS === 'ios') {
    // ----- iOS -----
    // const options = {
    //   date: date.toISOString(),
    //   includeManuallyAdded: true,
    // };
    // return new Promise((resolve) => {
    //   AppleHealthKit.getStepCount(options, (err, results) => {
    //     resolve(err ? 0 : results.value);
    //   });
    // });
  }

  if (Platform.OS === 'android') {
    // ----- Android -----
    // const start = new Date(date); start.setHours(0, 0, 0, 0);
    // const end = new Date(date); end.setHours(23, 59, 59, 999);
    // const result = await readRecords('Steps', {
    //   timeRangeFilter: { operator: 'between', startTime: start.toISOString(), endTime: end.toISOString() },
    // });
    // return result.records.reduce((sum, r) => sum + r.count, 0);
  }

  return mockSteps();
}

/**
 * Get total sleep duration in minutes for a given date (the night ending on that date).
 */
export async function getSleepMinutes(date: Date): Promise<number> {
  if (Platform.OS === 'ios') {
    // ----- iOS -----
    // const options = {
    //   startDate: new Date(date.getTime() - 24 * 60 * 60 * 1000).toISOString(),
    //   endDate: date.toISOString(),
    // };
    // return new Promise((resolve) => {
    //   AppleHealthKit.getSleepSamples(options, (err, results) => {
    //     if (err || !results) return resolve(0);
    //     const totalMs = results.reduce((sum, s) => {
    //       return sum + (new Date(s.endDate).getTime() - new Date(s.startDate).getTime());
    //     }, 0);
    //     resolve(Math.round(totalMs / 60000));
    //   });
    // });
  }

  if (Platform.OS === 'android') {
    // ----- Android -----
    // const start = new Date(date); start.setHours(0, 0, 0, 0);
    // start.setDate(start.getDate() - 1); // previous evening
    // const end = new Date(date); end.setHours(12, 0, 0, 0);
    // const result = await readRecords('SleepSession', {
    //   timeRangeFilter: { operator: 'between', startTime: start.toISOString(), endTime: end.toISOString() },
    // });
    // const totalMs = result.records.reduce((sum, r) => {
    //   return sum + (new Date(r.endTime).getTime() - new Date(r.startTime).getTime());
    // }, 0);
    // return Math.round(totalMs / 60000);
  }

  return mockSleepMinutes();
}

/**
 * Get number of hours with significant movement (active hours) for a date.
 */
export async function getActiveHours(date: Date): Promise<number> {
  if (Platform.OS === 'ios') {
    // ----- iOS -----
    // Query hourly ActiveEnergyBurned samples and count hours above threshold
    // const start = new Date(date); start.setHours(0, 0, 0, 0);
    // const end = new Date(date); end.setHours(23, 59, 59, 999);
    // ... aggregate by hour, count hours with calories > 50
  }

  if (Platform.OS === 'android') {
    // ----- Android -----
    // const start = new Date(date); start.setHours(0, 0, 0, 0);
    // const end = new Date(date); end.setHours(23, 59, 59, 999);
    // const result = await readRecords('ActiveCaloriesBurned', {
    //   timeRangeFilter: { operator: 'between', startTime: start.toISOString(), endTime: end.toISOString() },
    // });
    // ... aggregate by hour, count hours with significant activity
  }

  return mockActiveHours();
}

/**
 * Sync today's health data to the Supabase daily_metrics table.
 * Upserts on (user_id, date) so it can be called multiple times per day.
 */
export async function syncDailyMetrics(userId: string): Promise<void> {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD

  const [steps, sleepMinutes, activeHours] = await Promise.all([
    getSteps(today),
    getSleepMinutes(today),
    getActiveHours(today),
  ]);

  const { error } = await supabase
    .from('daily_metrics')
    .upsert(
      {
        user_id: userId,
        date: dateStr,
        steps,
        active_hours: activeHours,
        sleep_minutes: sleepMinutes,
      },
      { onConflict: 'user_id,date' },
    );

  if (error) {
    console.error('[Health] Failed to sync daily metrics:', error.message);
  } else {
    console.log(`[Health] Synced metrics for ${dateStr}: ${steps} steps, ${activeHours}h active, ${sleepMinutes}m sleep`);
  }
}
