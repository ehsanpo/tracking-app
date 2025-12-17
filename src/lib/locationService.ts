import * as Location from 'expo-location';
import { Platform } from 'react-native';
import { supabase } from './supabaseClient';

export type LocationData = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: number;
};

let locationSubscription: Location.LocationSubscription | null = null;
let currentCircleIds: string[] = [];
let webWatchId: number | null = null;

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
