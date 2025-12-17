import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';
import { supabase } from './supabaseClient';

export type LocationData = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: number;
};

const LOCATION_TRACKING_TASK = 'background-location-tracking';

let locationSubscription: Location.LocationSubscription | null = null;
let currentCircleIds: string[] = [];
let webWatchId: number | null = null;
let isUsingBackgroundTask = false;

/**
 * Define background location task for Android
 * This runs when the app is backgrounded and continues to track location
 */
TaskManager.defineTask(LOCATION_TRACKING_TASK, async ({ data, error }: any) => {
  if (error) {
    console.error('Background location task error:', error);
    return;
  }
  
  if (data) {
    const { locations } = data;
    
    if (locations && locations.length > 0) {
      const location = locations[0];
      const locationData: LocationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        timestamp: location.timestamp,
      };
      
      console.log('Background location update:', locationData);
      
      // Publish to all current circles
      if (currentCircleIds.length > 0) {
        await publishLocation(locationData, currentCircleIds);
      }
    }
  }
});

/**
 * Request background location permissions (Android only)
 * Must be called after foreground permissions are granted
 */
export async function requestBackgroundPermissions(): Promise<{
  granted: boolean;
  permission?: Location.LocationPermissionResponse;
}> {
  if (Platform.OS === 'web') {
    // Web doesn't support background location
    return { granted: false };
  }

  if (Platform.OS === 'android') {
    const permission = await Location.requestBackgroundPermissionsAsync();
    return {
      granted: permission.granted,
      permission,
    };
  }

  return { granted: false };
}

/**
 * Request foreground location permissions
 * @returns Object with granted status and permission object
 */
export async function requestForegroundPermissions(): Promise<{
  granted: boolean;
  permission: Location.LocationPermissionResponse;
}> {
  if (Platform.OS === 'web') {
    // For web, we need to trigger the browser's permission prompt
    // by attempting to get the position
    try {
      const hasPermission = await new Promise<boolean>((resolve) => {
        if (!navigator.geolocation) {
          resolve(false);
          return;
        }
        
        navigator.geolocation.getCurrentPosition(
          () => resolve(true),
          (error) => {
            console.log('Geolocation error:', error.message);
            resolve(false);
          }
        );
      });

      return {
        granted: hasPermission,
        permission: { granted: hasPermission } as any,
      };
    } catch (error) {
      console.error('Permission request error:', error);
      return {
        granted: false,
        permission: { granted: false } as any,
      };
    }
  }

  const permission = await Location.requestForegroundPermissionsAsync();
  return {
    granted: permission.granted,
    permission,
  };
}

/**
 * Check if location services are enabled
 */
export async function isLocationEnabled(): Promise<boolean> {
  return await Location.hasServicesEnabledAsync();
}

/**
 * Get current location once
 */
export async function getCurrentLocation(): Promise<LocationData | null> {
  try {
    if (Platform.OS === 'web' && navigator.geolocation) {
      // Use native browser geolocation API for web
      return await new Promise<LocationData | null>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: position.timestamp,
            });
          },
          (error) => {
            console.error('Web geolocation error:', error.message);
            resolve(null);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          }
        );
      });
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy,
      timestamp: location.timestamp,
    };
  } catch (error) {
    console.error('Error getting current location:', error);
    return null;
  }
}

/**
 * Publish location to Supabase for all accepted circles
 */
async function publishLocation(location: LocationData, circleIds: string[]): Promise<void> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('No authenticated user');
      return;
    }

    // Insert location for each circle
    const locationInserts = circleIds.map((circleId) => ({
      user_id: user.id,
      circle_id: circleId,
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy,
      is_last_known: false,
      recorded_at: new Date(location.timestamp).toISOString(),
    }));

    const { error } = await supabase.from('locations').insert(locationInserts);

    if (error) {
      console.error('Error publishing location:', error);
    } else {
      console.log(`Published location to ${circleIds.length} circles`);
    }
  } catch (error) {
    console.error('Error in publishLocation:', error);
  }
}

/**
 * Start tracking user location and publishing to Supabase
 * @param circleIds Array of circle IDs to publish location to
 * @param options Location tracking options
 */
export async function startLocationTracking(
  circleIds: string[],
  options: {
    interval?: number; // milliseconds between updates (default 10000 = 10s)
    distanceInterval?: number; // meters between updates (default 10m)
    useBackgroundTask?: boolean; // Use background task for Android (default true)
    onBackgroundPermissionChange?: (granted: boolean) => void; // Notify caller when background permission state changes
  } = {}
): Promise<void> {
  // Stop existing subscription if any
  await stopLocationTracking();

  currentCircleIds = circleIds;

  if (circleIds.length === 0) {
    console.log('No circles to track location for');
    return;
  }

  try {
    const { granted } = await requestForegroundPermissions();
    
    if (!granted) {
      console.error('Location permission not granted');
      return;
    }

    console.log(`Starting location tracking for ${circleIds.length} circles`);

    // For Android, use background task by default for better reliability
    const shouldUseBackgroundTask = 
      Platform.OS === 'android' && 
      (options.useBackgroundTask !== false);

    if (shouldUseBackgroundTask) {
      // Request background permissions for Android
      const { granted: bgGranted } = await requestBackgroundPermissions();
      options.onBackgroundPermissionChange?.(bgGranted);
      
      if (bgGranted) {
        console.log('Starting background location task');
        
        await Location.startLocationUpdatesAsync(LOCATION_TRACKING_TASK, {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: options.interval || 10000, // 10 seconds default
          distanceInterval: options.distanceInterval || 10, // 10 meters default
          foregroundService: {
            notificationTitle: 'Sharing location',
            notificationBody: 'Your location is being shared with family members',
            notificationColor: '#4A90E2',
          },
          pausesUpdatesAutomatically: false,
          showsBackgroundLocationIndicator: true,
        });
        
        isUsingBackgroundTask = true;
        console.log('Background location task started');
        return;
      } else {
        console.warn('Background permission not granted, falling back to foreground tracking');
      }
    }

    if (Platform.OS === 'web' && navigator.geolocation) {
      // Use native browser watchPosition for web
      webWatchId = navigator.geolocation.watchPosition(
        (position) => {
          const locationData: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          };

          console.log('Web location update:', locationData);
          publishLocation(locationData, currentCircleIds);
        },
        (error) => {
          console.error('Web watch position error:', error.message);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );

      // Also set up interval-based publishing (browser watchPosition may not update frequently)
      const intervalMs = options.interval || 10000;
      const intervalId = setInterval(async () => {
        const location = await getCurrentLocation();
        if (location && currentCircleIds.length > 0) {
          console.log('Interval location update:', location);
          await publishLocation(location, currentCircleIds);
        }
      }, intervalMs);

      // Store interval ID for cleanup (hacky but works for web)
      (webWatchId as any).intervalId = intervalId;
    } else {
      // Start watching location with specified interval for native
      locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: options.interval || 10000, // 10 seconds default
          distanceInterval: options.distanceInterval || 10, // 10 meters default
        },
        (location) => {
          const locationData: LocationData = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy,
            timestamp: location.timestamp,
          };

          console.log('Location update:', locationData);
          publishLocation(locationData, currentCircleIds);
        }
      );
    }
  } catch (error) {
    console.error('Error starting location tracking:', error);
  }
}

/**
 * Stop location tracking
 */
export async function stopLocationTracking(): Promise<void> {
  // Stop background task if running
  if (isUsingBackgroundTask) {
    const isTaskRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TRACKING_TASK);
    if (isTaskRegistered) {
      await Location.stopLocationUpdatesAsync(LOCATION_TRACKING_TASK);
      console.log('Background location task stopped');
    }
    isUsingBackgroundTask = false;
  }
  
  if (Platform.OS === 'web' && webWatchId !== null) {
    navigator.geolocation.clearWatch(webWatchId);
    
    // Clear interval if it exists
    if ((webWatchId as any).intervalId) {
      clearInterval((webWatchId as any).intervalId);
    }
    
    webWatchId = null;
    console.log('Web location tracking stopped');
  }
  
  if (locationSubscription) {
    locationSubscription.remove();
    locationSubscription = null;
    console.log('Native location tracking stopped');
  }
}

/**
 * Update the list of circles to publish location to
 */
export function updateCircleIds(circleIds: string[]): void {
  currentCircleIds = circleIds;
  console.log(`Updated circle IDs for location tracking: ${circleIds.length} circles`);
}

/**
 * Publish last-known location when going offline
 */
export async function publishLastKnownLocation(circleIds: string[]): Promise<void> {
  const location = await getCurrentLocation();
  
  if (!location) {
    console.error('Could not get current location for last-known update');
    return;
  }

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('No authenticated user');
      return;
    }

    // Insert last-known location for each circle
    const locationInserts = circleIds.map((circleId) => ({
      user_id: user.id,
      circle_id: circleId,
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy,
      is_last_known: true,
      recorded_at: new Date(location.timestamp).toISOString(),
    }));

    const { error } = await supabase.from('locations').insert(locationInserts);

    if (error) {
      console.error('Error publishing last-known location:', error);
    } else {
      console.log(`Published last-known location to ${circleIds.length} circles`);
    }
  } catch (error) {
    console.error('Error in publishLastKnownLocation:', error);
  }
}
