import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Set default notification behaviour so alerts show even when the app is foregrounded. */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ---------------------------------------------------------------------------
// Push token registration
// ---------------------------------------------------------------------------

/**
 * Request push-notification permissions and return the Expo push token.
 * Returns `null` when running on a simulator or when the user declines.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  // Push notifications only work on physical devices
  if (!Device.isDevice) {
    console.warn('Push notifications require a physical device');
    return null;
  }

  // Android needs a notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF6B35',
    });
  }

  // Check / request permission
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('Push notification permission not granted');
    return null;
  }

  // Get the Expo push token
  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: undefined, // Uses the project ID from app.json automatically
  });

  return tokenData.data;
}

// ---------------------------------------------------------------------------
// Token persistence
// ---------------------------------------------------------------------------

/** Save a push token to the users table in Supabase. */
export async function savePushToken(userId: string, token: string): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('users')
      .update({ push_token: token })
      .eq('id', userId);

    if (error) return { error: error.message };
    return { error: null };
  } catch (err: any) {
    return { error: err.message ?? 'Failed to save push token' };
  }
}

// ---------------------------------------------------------------------------
// Local notifications
// ---------------------------------------------------------------------------

/** Fire a local notification immediately (useful for testing). */
export async function sendLocalNotification(title: string, body: string): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger: null, // null = immediate
  });
}

/**
 * Schedule a daily local notification at a specific hour and minute.
 * Cancels any previously scheduled daily reminders before creating a new one.
 */
export async function scheduleDailyReminder(hour: number, minute: number): Promise<void> {
  // Cancel existing scheduled notifications to avoid duplicates
  await Notifications.cancelAllScheduledNotificationsAsync();

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Time to check in!',
      body: "Your family is waiting to hear from you. Tap to let them know you're OK.",
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

// ---------------------------------------------------------------------------
// Notification response listener
// ---------------------------------------------------------------------------

/**
 * Set up a listener that fires whenever the user taps a notification.
 * Returns a subscription object — call `.remove()` to unsubscribe.
 *
 * Usage (typically in a root layout useEffect):
 *   const sub = setupNotificationResponseListener((response) => { ... });
 *   return () => sub.remove();
 */
export function setupNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void,
) {
  return Notifications.addNotificationResponseReceivedListener(callback);
}
