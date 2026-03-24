import * as Battery from 'expo-battery';

const LOW_BATTERY_THRESHOLD = 0.15;
const THROTTLE_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

interface BatteryMonitor {
  userId: string;
  subscription: Battery.Subscription | null;
  lastAlertTime: number;
  onLowBattery: (userId: string, level: number) => void;
}

const activeMonitors = new Map<string, BatteryMonitor>();

/**
 * Start monitoring battery level for a given user.
 * Calls onLowBattery when level drops below 15%, throttled to once per hour.
 */
export async function startBatteryMonitoring(
  userId: string,
  onLowBattery: (userId: string, level: number) => void
): Promise<void> {
  // Stop existing monitor for this user if any
  stopBatteryMonitoring(userId);

  const monitor: BatteryMonitor = {
    userId,
    subscription: null,
    lastAlertTime: 0,
    onLowBattery,
  };

  // Check current level immediately
  const currentLevel = await Battery.getBatteryLevelAsync();
  if (currentLevel > 0 && currentLevel < LOW_BATTERY_THRESHOLD) {
    monitor.lastAlertTime = Date.now();
    onLowBattery(userId, currentLevel);
  }

  // Listen for level changes
  monitor.subscription = Battery.addBatteryLevelListener(({ batteryLevel }) => {
    if (batteryLevel < 0) return; // Unknown / simulator

    if (batteryLevel < LOW_BATTERY_THRESHOLD) {
      const now = Date.now();
      if (now - monitor.lastAlertTime >= THROTTLE_INTERVAL_MS) {
        monitor.lastAlertTime = now;
        monitor.onLowBattery(userId, batteryLevel);
      }
    }
  });

  activeMonitors.set(userId, monitor);
}

/**
 * Stop monitoring battery level for a given user.
 */
export function stopBatteryMonitoring(userId: string): void {
  const monitor = activeMonitors.get(userId);
  if (monitor) {
    monitor.subscription?.remove();
    activeMonitors.delete(userId);
  }
}
