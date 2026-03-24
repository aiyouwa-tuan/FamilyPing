import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

export const GEOFENCE_TASK = 'FAMILYPING_GEOFENCE_TASK';

export interface GeofenceRegion {
  identifier: string;
  latitude: number;
  longitude: number;
  radius: number;
  label: string;
  notifyOnEnter?: boolean;
  notifyOnExit?: boolean;
}

export interface GeofenceEvent {
  identifier: string;
  label: string;
  action: 'enter' | 'exit';
  latitude: number;
  longitude: number;
  timestamp: string;
}

type GeofenceCallback = (event: GeofenceEvent) => void;

// Registry of active geofences and their labels
const geofenceRegistry = new Map<string, GeofenceRegion>();
let geofenceCallback: GeofenceCallback | null = null;

/**
 * Define the background task that handles geofence events.
 * Must be called at module scope (top-level) before any geofencing starts.
 */
TaskManager.defineTask(GEOFENCE_TASK, async ({ data, error }) => {
  if (error) {
    console.error('[Geofence] Task error:', error.message);
    return;
  }

  if (!data) return;

  const { eventType, region } = data as {
    eventType: Location.GeofencingEventType;
    region: Location.LocationRegion;
  };

  const registered = geofenceRegistry.get(region.identifier ?? '');
  const label = registered?.label ?? region.identifier ?? 'Unknown';

  const event: GeofenceEvent = {
    identifier: region.identifier ?? '',
    label,
    action: eventType === Location.GeofencingEventType.Enter ? 'enter' : 'exit',
    latitude: region.latitude,
    longitude: region.longitude,
    timestamp: new Date().toISOString(),
  };

  if (geofenceCallback) {
    geofenceCallback(event);
  }
});

/**
 * Register a geofence region for monitoring.
 */
export async function setupGeofence(
  lat: number,
  lng: number,
  radius: number,
  label: string
): Promise<string> {
  const identifier = `geofence_${label.replace(/\s+/g, '_')}_${Date.now()}`;

  const region: GeofenceRegion = {
    identifier,
    latitude: lat,
    longitude: lng,
    radius,
    label,
    notifyOnEnter: true,
    notifyOnExit: true,
  };

  geofenceRegistry.set(identifier, region);

  // Build the full list of regions to monitor
  const regions: Location.LocationRegion[] = Array.from(
    geofenceRegistry.values()
  ).map((r) => ({
    identifier: r.identifier,
    latitude: r.latitude,
    longitude: r.longitude,
    radius: r.radius,
    notifyOnEnter: r.notifyOnEnter ?? true,
    notifyOnExit: r.notifyOnExit ?? true,
  }));

  await Location.startGeofencingAsync(GEOFENCE_TASK, regions);

  return identifier;
}

/**
 * Remove a geofence by its identifier.
 */
export async function removeGeofence(identifier: string): Promise<void> {
  geofenceRegistry.delete(identifier);

  if (geofenceRegistry.size === 0) {
    await Location.stopGeofencingAsync(GEOFENCE_TASK);
  } else {
    // Re-register remaining geofences
    const regions: Location.LocationRegion[] = Array.from(
      geofenceRegistry.values()
    ).map((r) => ({
      identifier: r.identifier,
      latitude: r.latitude,
      longitude: r.longitude,
      radius: r.radius,
      notifyOnEnter: r.notifyOnEnter ?? true,
      notifyOnExit: r.notifyOnExit ?? true,
    }));

    await Location.startGeofencingAsync(GEOFENCE_TASK, regions);
  }
}

/**
 * Register a callback to listen for geofence enter/exit events.
 */
export function onGeofenceEvent(callback: GeofenceCallback): () => void {
  geofenceCallback = callback;

  // Return an unsubscribe function
  return () => {
    geofenceCallback = null;
  };
}
