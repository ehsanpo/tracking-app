import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabaseClient';
import { useCircles } from './CircleContext';
import {
  startLocationTracking,
  stopLocationTracking,
  updateCircleIds,
  requestForegroundPermissions,
  requestBackgroundPermissions,
  getCurrentLocation,
  publishLastKnownLocation,
  LocationData,
} from '../lib/locationService';

export type MemberLocation = {
  userId: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: string;
  circleIds: string[]; // User may appear in multiple circles
  isLastKnown: boolean;
};

type LocationContextType = {
  memberLocations: Map<string, MemberLocation>; // keyed by userId
  isTracking: boolean;
  isOnline: boolean;
  hasPermission: boolean;
  hasBackgroundPermission: boolean;
  currentLocation: LocationData | null;
  setOnline: (online: boolean) => Promise<void>;
  requestPermission: () => Promise<boolean>;
  requestBackgroundPermission: () => Promise<boolean>;
  refreshCurrentLocation: () => Promise<void>;
};

const LocationContext = createContext<LocationContextType | undefined>(undefined);

const ONLINE_STATUS_KEY = '@tracking_app:online_status';

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const { circles } = useCircles();
  const [memberLocations, setMemberLocations] = useState<Map<string, MemberLocation>>(new Map());
  const [isTracking, setIsTracking] = useState(false);
  const [isOnline, setIsOnlineState] = useState(true); // User's online/offline preference
  const [hasPermission, setHasPermission] = useState(false);
  const [hasBackgroundPermission, setHasBackgroundPermission] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [realtimeChannel, setRealtimeChannel] = useState<RealtimeChannel | null>(null);

  const acceptedCircleIds = circles.map((c) => c.id);

  // Load online status from storage
  useEffect(() => {
    AsyncStorage.getItem(ONLINE_STATUS_KEY).then((value) => {
      if (value !== null) {
        setIsOnlineState(value === 'true');
      }
    });
  }, []);

  // Request location permission
  const requestPermission = useCallback(async () => {
    const { granted } = await requestForegroundPermissions();
    setHasPermission(granted);
    return granted;
  }, []);

  // Request background location permission
  const requestBackgroundPermission = useCallback(async () => {
    const { granted } = await requestBackgroundPermissions();
    setHasBackgroundPermission(granted);
    return granted;
  }, []);

  // Get current location
  const refreshCurrentLocation = useCallback(async () => {
    const location = await getCurrentLocation();
    if (location) {
      setCurrentLocation(location);
    }
  }, []);

  // Start tracking user location and publishing
  const startTracking = useCallback(async () => {
    if (acceptedCircleIds.length === 0) {
      console.log('No circles to track');
      return;
    }

    if (!isOnline) {
      console.log('User is offline, not starting tracking');
      return;
    }

    const granted = await requestPermission();
    if (!granted) {
      console.error('Permission denied');
      return;
    }

    await startLocationTracking(acceptedCircleIds, {
      interval: 10000, // 10 seconds
      distanceInterval: 10, // 10 meters
      useBackgroundTask: true, // Enable background tracking for Android
      onBackgroundPermissionChange: setHasBackgroundPermission,
    });

    setIsTracking(true);
    await refreshCurrentLocation();
  }, [acceptedCircleIds, isOnline, requestPermission, refreshCurrentLocation]);

  // Stop tracking
  const stopTracking = useCallback(async () => {
    await stopLocationTracking();
    setIsTracking(false);
  }, []);

  // Set online/offline status
  const setOnline = useCallback(async (online: boolean) => {
    setIsOnlineState(online);
    await AsyncStorage.setItem(ONLINE_STATUS_KEY, online.toString());
    
    if (!online) {
      // Going offline - publish last known location
      if (acceptedCircleIds.length > 0) {
        await publishLastKnownLocation(acceptedCircleIds);
      }
      await stopTracking();
    } else {
      // Going online - start tracking
      await startTracking();
    }
  }, [acceptedCircleIds, startTracking, stopTracking]);

  // Subscribe to realtime location updates for all accepted circles
  useEffect(() => {
    if (acceptedCircleIds.length === 0) {
      // Clean up existing channel
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
        setRealtimeChannel(null);
      }
      return;
    }

    console.log('Setting up realtime subscription for circles:', acceptedCircleIds);

    const quotedIds = acceptedCircleIds.map((id) => `"${id}"`).join(',');

    // Create a channel for location updates
    const channel = supabase
      .channel('locations-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'locations',
          filter: `circle_id=in.(${quotedIds})`,
        },
        (payload) => {
          console.log('Location update received:', payload);
          
          const newLocation = payload.new as {
            user_id: string;
            circle_id: string;
            latitude: number;
            longitude: number;
            accuracy: number | null;
            recorded_at: string;
            is_last_known: boolean;
          };

          setMemberLocations((prev) => {
            const updated = new Map(prev);
            const existing = updated.get(newLocation.user_id);

            if (existing) {
              // Update existing location, merge circle IDs
              const circleIds = existing.circleIds.includes(newLocation.circle_id)
                ? existing.circleIds
                : [...existing.circleIds, newLocation.circle_id];

              updated.set(newLocation.user_id, {
                userId: newLocation.user_id,
                latitude: newLocation.latitude,
                longitude: newLocation.longitude,
                accuracy: newLocation.accuracy,
                timestamp: newLocation.recorded_at,
                circleIds,
                isLastKnown: newLocation.is_last_known,
              });
            } else {
              // New location
              updated.set(newLocation.user_id, {
                userId: newLocation.user_id,
                latitude: newLocation.latitude,
                longitude: newLocation.longitude,
                accuracy: newLocation.accuracy,
                timestamp: newLocation.recorded_at,
                circleIds: [newLocation.circle_id],
                isLastKnown: newLocation.is_last_known,
              });
            }

            return updated;
          });
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    setRealtimeChannel(channel);

    // Load initial locations
    loadInitialLocations(acceptedCircleIds);

    // Cleanup
    return () => {
      console.log('Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [acceptedCircleIds.join(',')]); // Only re-subscribe when circle IDs change

  // Load initial/latest locations for all members in accepted circles
  const loadInitialLocations = async (circleIds: string[]) => {
    try {
      // Get the latest location for each user in each circle
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .in('circle_id', circleIds)
        .order('recorded_at', { ascending: false });

      if (error) {
        console.error('Error loading initial locations:', error);
        return;
      }

      if (!data || data.length === 0) {
        console.log('No initial locations found');
        return;
      }

      // Group by user_id and take the most recent for each
      const locationMap = new Map<string, MemberLocation>();

      data.forEach((loc: any) => {
        const existing = locationMap.get(loc.user_id);
        
        if (!existing || new Date(loc.recorded_at) > new Date(existing.timestamp)) {
          const circleIds = existing?.circleIds.includes(loc.circle_id)
            ? existing.circleIds
            : [...(existing?.circleIds || []), loc.circle_id];

          locationMap.set(loc.user_id, {
            userId: loc.user_id,
            latitude: loc.latitude,
            longitude: loc.longitude,
            accuracy: loc.accuracy,
            timestamp: loc.recorded_at,
            circleIds,
            isLastKnown: loc.is_last_known,
          });
        }
      });

      setMemberLocations(locationMap);
      console.log(`Loaded ${locationMap.size} member locations`);
    } catch (error) {
      console.error('Error in loadInitialLocations:', error);
    }
  };

  // Update location service when circles change
  useEffect(() => {
    if (isTracking) {
      updateCircleIds(acceptedCircleIds);
    }
  }, [acceptedCircleIds.join(','), isTracking]);

  // Auto-start tracking when user has circles and is online
  useEffect(() => {
    if (acceptedCircleIds.length > 0 && isOnline && !isTracking) {
      console.log('Auto-starting location tracking');
      startTracking();
    }
  }, [acceptedCircleIds.length, isOnline]); // Don't include isTracking to avoid loops

  return (
    <LocationContext.Provider
      value={{
        memberLocations,
        isTracking,
        isOnline,
        hasPermission,
        hasBackgroundPermission,
        currentLocation,
        setOnline,
        requestPermission,
        requestBackgroundPermission,
        refreshCurrentLocation,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within LocationProvider');
  }
  return context;
}
